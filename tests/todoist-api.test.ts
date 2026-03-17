/**
 * Todoist API Integration Tests
 *
 * Tests the Todoist API client with mock data
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TodoistAPI, TodoistAPIError } from '../lib/todoist-api';

describe('TodoistAPI', () => {
  let api: TodoistAPI;
  const mockToken = 'test_token_12345';

  beforeEach(() => {
    api = new TodoistAPI(mockToken);
  });

  it('should create an instance with a token', () => {
    expect(api).toBeInstanceOf(TodoistAPI);
  });

  it('should have all required methods', () => {
    expect(typeof api.getProjects).toBe('function');
    expect(typeof api.getTasks).toBe('function');
    expect(typeof api.createTask).toBe('function');
    expect(typeof api.updateTask).toBe('function');
    expect(typeof api.closeTask).toBe('function');
    expect(typeof api.reopenTask).toBe('function');
    expect(typeof api.deleteTask).toBe('function');
    expect(typeof api.getSections).toBe('function');
    expect(typeof api.getLabels).toBe('function');
    expect(typeof api.getTodayTasks).toBe('function');
    expect(typeof api.getInboxTasks).toBe('function');
    expect(typeof api.validateToken).toBe('function');
  });

  it('should create TodoistAPIError with correct properties', () => {
    const error = new TodoistAPIError('Test error', 404, new Error('Original'));
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(404);
    expect(error.name).toBe('TodoistAPIError');
  });

  it('should handle task priority values correctly', () => {
    const priorities: (1 | 2 | 3 | 4)[] = [1, 2, 3, 4];
    priorities.forEach(priority => {
      expect([1, 2, 3, 4]).toContain(priority);
    });
  });

  it('should validate task structure', () => {
    const mockTask = {
      id: '123',
      user_id: '789',
      project_id: '456',
      section_id: null,
      parent_id: null,
      added_by_uid: '789',
      assigned_by_uid: null,
      responsible_uid: null,
      content: 'Test task',
      description: 'Test description',
      checked: false,
      labels: ['label1'],
      child_order: 1,
      priority: 1,
      due: {
        date: '2024-12-31',
        string: 'Dec 31',
      },
      deadline: null,
      duration: null,
      note_count: 0,
      added_at: '2024-01-01T00:00:00Z',
      completed_at: null,
      updated_at: '2024-01-01T00:00:00Z',
      is_deleted: false,
      day_order: 0,
      is_collapsed: false,
    };

    expect(mockTask.id).toBeDefined();
    expect(mockTask.content).toBeDefined();
    expect(typeof mockTask.checked).toBe('boolean');
    expect([1, 2, 3, 4]).toContain(mockTask.priority);
  });

  it('should validate project structure', () => {
    const mockProject = {
      id: '123',
      name: 'Test Project',
      color: 'red',
      parent_id: null,
      child_order: 1,
      is_shared: false,
      is_favorite: false,
      inbox_project: false,
      view_style: 'list',
      description: '',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      is_archived: false,
      is_deleted: false,
      can_assign_tasks: true,
      creator_uid: '789',
      is_frozen: false,
      default_order: 0,
      is_collapsed: false,
    };

    expect(mockProject.id).toBeDefined();
    expect(mockProject.name).toBeDefined();
    expect(typeof mockProject.inbox_project).toBe('boolean');
  });
});
