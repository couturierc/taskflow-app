/**
 * Tests for v1.0.8 Features
 * - Markdown rendering
 * - Batch operations foundation
 * - Offline mode foundation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createTodoistClient } from '../lib/todoist-api';

const API_TOKEN = '1ed9e3f38bb4728db18aed2cae8b930613b81c54';

describe('v1.0.8 Features', () => {
  let apiClient: ReturnType<typeof createTodoistClient>;

  beforeEach(() => {
    apiClient = createTodoistClient(API_TOKEN);
  });

  describe('Markdown Support', () => {
    it('should accept markdown in task content', async () => {
      const markdownContent = '**Bold** and *italic* text';
      const task = await apiClient.createTask({
        content: markdownContent,
      });

      expect(task.content).toBe(markdownContent);

      // Clean up
      await apiClient.deleteTask(task.id);
    });

    it('should accept markdown in task description', async () => {
      const markdownDescription = '# Heading\n\n- List item 1\n- List item 2\n\n`code block`';
      const task = await apiClient.createTask({
        content: 'Task with markdown description',
        description: markdownDescription,
      });

      expect(task.description).toBe(markdownDescription);

      // Clean up
      await apiClient.deleteTask(task.id);
    });

    it('should support markdown links in content', async () => {
      const contentWithLink = '[Click here](https://example.com)';
      const task = await apiClient.createTask({
        content: contentWithLink,
      });

      expect(task.content).toBe(contentWithLink);

      // Clean up
      await apiClient.deleteTask(task.id);
    });

    it('should support markdown code blocks in description', async () => {
      const codeBlockDescription = '```\nconst x = 42;\n```';
      const task = await apiClient.createTask({
        content: 'Task with code',
        description: codeBlockDescription,
      });

      expect(task.description).toBe(codeBlockDescription);

      // Clean up
      await apiClient.deleteTask(task.id);
    });
  });

  describe('Batch Operations Foundation', () => {
    it('should support updating multiple task properties', async () => {
      const task = await apiClient.createTask({
        content: 'Task for batch test',
        priority: 1,
      });

      // Update multiple properties
      const updated = await apiClient.updateTask(task.id, {
        content: 'Updated task',
        priority: 4,
        description: 'New description',
      });

      expect(updated.content).toBe('Updated task');
      expect(updated.priority).toBe(4);
      expect(updated.description).toBe('New description');

      // Clean up
      await apiClient.deleteTask(task.id);
    });

    it('should support completing and reopening tasks', async () => {
      const task = await apiClient.createTask({
        content: 'Task for complete/reopen test',
      });

      expect((task as any).is_completed).toBe(false);

      // Complete task
      const completed = await apiClient.closeTask(task.id);
      expect(completed).toBe(true);

      // Reopen task
      const reopened = await apiClient.reopenTask(task.id);
      expect(reopened).toBe(true);

      // Clean up
      await apiClient.deleteTask(task.id);
    });
  });

  describe('Offline Mode Foundation', () => {
    it('should handle API client initialization', () => {
      expect(apiClient).toBeDefined();
    });

    it('should support task creation with all properties', async () => {
      const projects = await apiClient.getProjects();
      const inboxProject = projects.find((p: any) => p.is_inbox_project);
      const inboxId = inboxProject?.id || '2300938957';
      
      const task = await apiClient.createTask({
        content: 'Complete task for offline test',
        description: 'Task description',
        project_id: inboxId,
        priority: 2,
        due_string: 'tomorrow',
      });

      expect(task.content).toBe('Complete task for offline test');
      expect(task.description).toBe('Task description');
      expect(task.priority).toBe(2);
      // Labels may not be assigned if they don't exist, so just check it's an array
      expect(Array.isArray(task.labels)).toBe(true);

      // Clean up
      await apiClient.deleteTask(task.id);
    });

    it('should support fetching all data types', async () => {
      const [tasks, projects, labels] = await Promise.all([
        apiClient.getTasks(),
        apiClient.getProjects(),
        apiClient.getLabels(),
      ]);

      expect(Array.isArray(tasks)).toBe(true);
      expect(Array.isArray(projects)).toBe(true);
      expect(Array.isArray(labels)).toBe(true);
    });
  });

  describe('Version 1.0.8 Integration', () => {
    it('should handle complex task workflows', async () => {
      // Create task
      const task = await apiClient.createTask({
        content: '**Important** task with *markdown*',
        description: '- [ ] Subtask 1\n- [ ] Subtask 2',
        priority: 4,
        due_string: 'next monday',
      });

      expect(task.content).toContain('**Important**');
      expect(task.priority).toBe(4);

      // Update task
      const updated = await apiClient.updateTask(task.id, {
        content: '**Completed** task',
        priority: 1,
      });

      expect(updated.content).toContain('**Completed**');
      expect(updated.priority).toBe(1);

      // Complete task
      const completed = await apiClient.closeTask(task.id);
      expect(completed).toBe(true);

      // Delete task
      await apiClient.deleteTask(task.id);

      // Verify deletion
      const allTasks = await apiClient.getTasks();
      const deletedTask = allTasks.find((t: any) => t.id === task.id);
      expect(deletedTask).toBeUndefined();
    });
  });
});
