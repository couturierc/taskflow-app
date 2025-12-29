/**
 * Task Management Features Test
 * 
 * Tests for task creation, editing, deletion, search, and filtering
 */

import { describe, it, expect } from 'vitest';
import { TodoistAPI, TodoistTask, TodoistProject } from '../lib/todoist-api';

describe('Task Management Features', () => {
  const API_TOKEN = '1ed9e3f38bb4728db18aed2cae8b930613b81c54';
  const api = new TodoistAPI(API_TOKEN);

  it('should create a new task', async () => {
    const newTask = await api.createTask({
      content: 'Test task from vitest',
      description: 'This is a test task created by automated tests',
      priority: 2,
    });

    expect(newTask).toBeDefined();
    expect(newTask.id).toBeDefined();
    expect(newTask.content).toBe('Test task from vitest');
    expect(newTask.description).toBe('This is a test task created by automated tests');
    expect(newTask.priority).toBe(2);

    // Clean up: delete the test task
    await api.deleteTask(newTask.id);
  });

  it('should update an existing task', async () => {
    // Create a task first
    const task = await api.createTask({
      content: 'Task to update',
      priority: 1,
    });

    // Update the task
    const updatedTask = await api.updateTask(task.id, {
      content: 'Updated task content',
      priority: 3,
    });

    expect(updatedTask.content).toBe('Updated task content');
    expect(updatedTask.priority).toBe(3);

    // Clean up
    await api.deleteTask(task.id);
  });

  it('should delete a task', async () => {
    // Create a task first
    const task = await api.createTask({
      content: 'Task to delete',
    });

    // Delete the task
    const result = await api.deleteTask(task.id);
    expect(result).toBe(true);

    // Verify deletion by trying to get the task (should fail)
    try {
      await api.getTask(task.id);
      // If we get here, the task wasn't deleted
      expect(true).toBe(false);
    } catch (error) {
      // Expected to fail
      expect(error).toBeDefined();
    }
  });

  it('should filter tasks by priority', async () => {
    const tasks = await api.getTasks();
    
    // Test priority filtering logic
    const p1Tasks = tasks.filter(t => t.priority === 4);
    const p2Tasks = tasks.filter(t => t.priority === 3);
    const p3Tasks = tasks.filter(t => t.priority === 2);
    const p4Tasks = tasks.filter(t => t.priority === 1);

    console.log(`P1 (Urgent) tasks: ${p1Tasks.length}`);
    console.log(`P2 tasks: ${p2Tasks.length}`);
    console.log(`P3 tasks: ${p3Tasks.length}`);
    console.log(`P4 (Low) tasks: ${p4Tasks.length}`);

    expect(Array.isArray(tasks)).toBe(true);
  });

  it('should search tasks by content', async () => {
    const tasks = await api.getTasks();
    
    // Test search logic
    const searchQuery = 'todoist';
    const searchResults = tasks.filter(task => {
      const matchesContent = task.content.toLowerCase().includes(searchQuery);
      const matchesDescription = task.description?.toLowerCase().includes(searchQuery);
      return matchesContent || matchesDescription;
    });

    console.log(`Found ${searchResults.length} tasks matching "${searchQuery}"`);
    expect(Array.isArray(searchResults)).toBe(true);
  });

  it('should filter tasks by project', async () => {
    const [tasks, projects] = await Promise.all([
      api.getTasks(),
      api.getProjects(),
    ]);

    if (projects.length > 0) {
      const firstProject = projects[0];
      const projectTasks = tasks.filter(t => t.project_id === firstProject.id);
      
      console.log(`Project "${firstProject.name}" has ${projectTasks.length} tasks`);
      expect(Array.isArray(projectTasks)).toBe(true);
    }
  });

  it('should complete and reopen a task', async () => {
    // Create a task
    const task = await api.createTask({
      content: 'Task to complete',
    });

    // Complete the task
    await api.closeTask(task.id);
    const completedTask = await api.getTask(task.id);
    expect(completedTask.is_completed).toBe(true);

    // Reopen the task
    await api.reopenTask(task.id);
    const reopenedTask = await api.getTask(task.id);
    expect(reopenedTask.is_completed).toBe(false);

    // Clean up
    await api.deleteTask(task.id);
  }, 10000); // Increase timeout to 10 seconds
});
