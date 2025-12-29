/**
 * Tests for v1.0.4 features:
 * - Subtasks (parent-child relationships)
 * - Recurring tasks
 * - Calendar date picker
 * - Calendar view
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createTodoistClient, TodoistAPI } from '../lib/todoist-api';
import { organizeTasksWithSubtasks, flattenTasksWithSubtasks, calculateSubtaskProgress, hasSubtasks } from '../lib/subtask-utils';

const API_TOKEN = '1ed9e3f38bb4728db18aed2cae8b930613b81c54';

describe('v1.0.4 Features', () => {
  let apiClient: TodoistAPI;

  beforeAll(() => {
    apiClient = createTodoistClient(API_TOKEN);
  });

  describe('Subtasks', () => {
    it('should organize tasks with parent-child relationships', async () => {
      const tasks = await apiClient.getTasks();
      const organized = organizeTasksWithSubtasks(tasks);
      
      // Check that organized tasks are returned
      expect(Array.isArray(organized)).toBe(true);
      
      // Check that tasks have children property
      organized.forEach((task: typeof organized[0]) => {
        expect(task).toHaveProperty('children');
        expect(task).toHaveProperty('level');
        expect(Array.isArray(task.children)).toBe(true);
      });
    });

    it('should flatten hierarchical tasks correctly', async () => {
      const tasks = await apiClient.getTasks();
      const organized = organizeTasksWithSubtasks(tasks);
      const flattened = flattenTasksWithSubtasks(organized);
      
      // Flattened list should contain all tasks
      expect(Array.isArray(flattened)).toBe(true);
      
      // Each task should have level property
      flattened.forEach(task => {
        expect(task).toHaveProperty('level');
        expect(typeof task.level).toBe('number');
        expect(task.level).toBeGreaterThanOrEqual(0);
      });
    });

    it('should calculate subtask progress correctly', async () => {
      const tasks = await apiClient.getTasks();
      const organized = organizeTasksWithSubtasks(tasks);
      
      organized.forEach((task: typeof organized[0]) => {
        if (hasSubtasks(task)) {
          const progress = calculateSubtaskProgress(task);
          
          expect(progress).toHaveProperty('completed');
          expect(progress).toHaveProperty('total');
          expect(progress).toHaveProperty('percentage');
          
          expect(progress.total).toBe(task.children.length);
          expect(progress.percentage).toBeGreaterThanOrEqual(0);
          expect(progress.percentage).toBeLessThanOrEqual(100);
        }
      });
    });
  });

  describe('Recurring Tasks', () => {
    it('should create recurring task with due_string', async () => {
      // Create a recurring task
      const task = await apiClient.createTask({
        content: 'Test Recurring Task',
        due_string: 'every day',
      });

      expect(task.content).toBe('Test Recurring Task');
      expect(task.due).toBeDefined();
      expect(task.due?.is_recurring).toBe(true);
      expect(task.due?.string).toContain('every');

      // Cleanup
      await apiClient.deleteTask(task.id);
    }, 10000);

    it('should support various recurring patterns', async () => {
      const patterns = [
        'every week',
        'every Monday',
        'every month',
      ];

      for (const pattern of patterns) {
        const task = await apiClient.createTask({
          content: `Test ${pattern}`,
          due_string: pattern,
        });

        expect(task.due?.is_recurring).toBe(true);
        
        // Cleanup
        await apiClient.deleteTask(task.id);
      }
    }, 15000);
  });

  describe('Calendar Date Picker', () => {
    it('should create task with specific date from calendar', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD

      const task = await apiClient.createTask({
        content: 'Test Calendar Date',
        due_string: dateStr,
      });

      expect(task.due).toBeDefined();
      expect(task.due?.date).toBe(dateStr);

      // Cleanup
      await apiClient.deleteTask(task.id);
    }, 10000);
  });

  describe('Calendar View', () => {
    it('should fetch tasks with due dates for calendar view', async () => {
      const tasks = await apiClient.getTasks();
      const tasksWithDueDates = tasks.filter((task: typeof tasks[0]) => task.due && !task.is_completed);
      
      expect(Array.isArray(tasksWithDueDates)).toBe(true);
      
      // Check that each task has a due date
      tasksWithDueDates.forEach((task: typeof tasks[0]) => {
        expect(task.due).toBeDefined();
        expect(task.due?.date).toBeDefined();
      });
    });

    it('should group tasks by date correctly', async () => {
      const tasks = await apiClient.getTasks();
      const tasksWithDueDates = tasks.filter((task: typeof tasks[0]) => task.due && !task.is_completed);
      
      // Group by date
      const tasksByDate = new Map<string, typeof tasks>();
      tasksWithDueDates.forEach((task: typeof tasks[0]) => {
        if (task.due?.date) {
          const existing = tasksByDate.get(task.due.date) || [];
          tasksByDate.set(task.due.date, [...existing, task]);
        }
      });

      // Verify grouping
      tasksByDate.forEach((dateTasks: typeof tasks, date: string) => {
        expect(Array.isArray(dateTasks)).toBe(true);
        expect(dateTasks.length).toBeGreaterThan(0);
        
        // All tasks in this group should have the same date
        dateTasks.forEach((task: typeof tasks[0]) => {
          expect(task.due?.date).toBe(date);
        });
      });
    });
  });

  describe('Integration Tests', () => {
    it('should create parent task with subtasks', async () => {
      // Create parent task
      const parent = await apiClient.createTask({
        content: 'Parent Task',
      });

      // Create subtasks
      const subtask1 = await apiClient.createTask({
        content: 'Subtask 1',
        parent_id: parent.id,
      });

      const subtask2 = await apiClient.createTask({
        content: 'Subtask 2',
        parent_id: parent.id,
      });

      expect(subtask1.parent_id).toBe(parent.id);
      expect(subtask2.parent_id).toBe(parent.id);

      // Fetch all tasks and verify hierarchy
      const allTasks = await apiClient.getTasks();
      const organized = organizeTasksWithSubtasks(allTasks);
      const parentInOrganized = organized.find(t => t.id === parent.id);

      expect(parentInOrganized).toBeDefined();
      expect(hasSubtasks(parentInOrganized!)).toBe(true);
      expect(parentInOrganized!.children.length).toBeGreaterThanOrEqual(2);

      // Cleanup
      await apiClient.deleteTask(subtask1.id);
      await apiClient.deleteTask(subtask2.id);
      await apiClient.deleteTask(parent.id);
    }, 15000);

    it('should create recurring task with subtasks', async () => {
      // Create recurring parent task
      const parent = await apiClient.createTask({
        content: 'Recurring Parent',
        due_string: 'every week',
      });

      expect(parent.due?.is_recurring).toBe(true);

      // Create subtask
      const subtask = await apiClient.createTask({
        content: 'Recurring Subtask',
        parent_id: parent.id,
      });

      expect(subtask.parent_id).toBe(parent.id);

      // Cleanup
      await apiClient.deleteTask(subtask.id);
      await apiClient.deleteTask(parent.id);
    }, 15000);
  });
});
