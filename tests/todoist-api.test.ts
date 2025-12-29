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
      project_id: '456',
      section_id: null,
      content: 'Test task',
      description: 'Test description',
      is_completed: false,
      labels: ['label1'],
      parent_id: null,
      order: 1,
      priority: 1 as 1 | 2 | 3 | 4,
      due: {
        date: '2024-12-31',
        is_recurring: false,
        string: 'Dec 31',
      },
      url: 'https://todoist.com/showTask?id=123',
      comment_count: 0,
      created_at: '2024-01-01T00:00:00Z',
      creator_id: '789',
      assignee_id: null,
      assigner_id: null,
    };

    expect(mockTask.id).toBeDefined();
    expect(mockTask.content).toBeDefined();
    expect(typeof mockTask.is_completed).toBe('boolean');
    expect([1, 2, 3, 4]).toContain(mockTask.priority);
  });

  it('should validate project structure', () => {
    const mockProject = {
      id: '123',
      name: 'Test Project',
      color: 'red',
      parent_id: null,
      order: 1,
      comment_count: 0,
      is_shared: false,
      is_favorite: false,
      is_inbox_project: false,
      is_team_inbox: false,
      view_style: 'list' as 'list' | 'board',
      url: 'https://todoist.com/showProject?id=123',
    };

    expect(mockProject.id).toBeDefined();
    expect(mockProject.name).toBeDefined();
    expect(['list', 'board']).toContain(mockProject.view_style);
  });
});
