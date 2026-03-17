/**
 * Todoist API v1 Client
 *
 * Official documentation: https://developer.todoist.com/api/v1/
 *
 * Migrated from deprecated REST API v2 + Sync API v9 to the unified
 * Todoist API v1. Key differences:
 *   - Base URL: /api/v1 (replaces /rest/v2 and /sync/v9)
 *   - List endpoints return { results, next_cursor } instead of plain arrays
 *   - Completed tasks endpoint requires since/until date range
 *   - Some field names changed (is_completed -> checked, etc.)
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { v4 as uuidv4 } from 'uuid';

const API_BASE_URL = 'https://api.todoist.com/api/v1';
const SYNC_API_URL = 'https://api.todoist.com/api/v1/sync';
const COMPLETED_TASKS_URL = 'https://api.todoist.com/api/v1/tasks/completed/by_completion_date';

/**
 * Paginated response wrapper used by all v1 list endpoints.
 */
export interface PaginatedResponse<T> {
  results: T[];
  next_cursor: string | null;
}

export interface TodoistProject {
  id: string;
  name: string;
  color: string;
  parent_id: string | null;
  child_order: number;
  is_shared: boolean;
  is_favorite: boolean;
  inbox_project: boolean;
  view_style: string;
  description: string;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
  is_deleted: boolean;
  can_assign_tasks: boolean;
  creator_uid: string;
  is_frozen: boolean;
  default_order: number;
  is_collapsed: boolean;
}

export interface TodoistTask {
  id: string;
  user_id: string;
  project_id: string;
  section_id: string | null;
  parent_id: string | null;
  added_by_uid: string;
  assigned_by_uid: string | null;
  responsible_uid: string | null;
  content: string;
  description: string;
  checked: boolean;
  labels: string[];
  child_order: number;
  priority: number;
  due: {
    date: string;
    string: string;
    lang?: string;
    is_recurring?: boolean;
    datetime?: string;
    timezone?: string;
  } | null;
  deadline: any | null;
  duration: { amount: number; unit: string } | null;
  note_count: number;
  added_at: string;
  completed_at: string | null;
  updated_at: string;
  is_deleted: boolean;
  day_order: number;
  is_collapsed: boolean;
}

export interface TodoistSection {
  id: string;
  project_id: string;
  order: number;
  name: string;
}

export interface TodoistLabel {
  id: string;
  name: string;
  color: string;
  order: number;
  is_favorite: boolean;
}

export interface TodoistComment {
  id: string;
  task_id?: string;
  project_id?: string;
  content: string;
  posted_at: string;
  attachment?: {
    file_name: string;
    file_type: string;
    file_url: string;
    resource_type: string;
  };
}

/**
 * Completed task from the v1 completed-tasks endpoint.
 * Same shape as TodoistTask but with checked=true and completed_at set.
 */
export type TodoistCompletedTask = TodoistTask;

/**
 * Custom error class for Todoist API errors
 */
export class TodoistAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: any
  ) {
    super(message);
    this.name = 'TodoistAPIError';
  }
}

/**
 * Todoist API Client
 */
export class TodoistAPI {
  private client: AxiosInstance;
  private apiToken: string;

  constructor(apiToken: string) {
    this.apiToken = apiToken;
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Handle API errors
   */
  private handleError(error: any): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      if (axiosError.response) {
        const status = axiosError.response.status;
        const data = axiosError.response.data as any;

        switch (status) {
          case 400:
            throw new TodoistAPIError('Bad request. Please check your input.', status, error);
          case 401:
            throw new TodoistAPIError('Unauthorized. Invalid API token.', status, error);
          case 403:
            throw new TodoistAPIError('Forbidden. You don\'t have permission to access this resource.', status, error);
          case 404:
            throw new TodoistAPIError('Resource not found.', status, error);
          case 429:
            throw new TodoistAPIError('Too many requests. Please slow down.', status, error);
          case 500:
            throw new TodoistAPIError('Todoist server error. Please try again later.', status, error);
          default:
            throw new TodoistAPIError(
              data?.error || 'An error occurred while communicating with Todoist.',
              status,
              error
            );
        }
      } else if (axiosError.request) {
        throw new TodoistAPIError('No response from Todoist. Please check your internet connection.', undefined, error);
      }
    }

    throw new TodoistAPIError('An unexpected error occurred.', undefined, error);
  }

  /**
   * Validate the API token
   */
  async validateToken(): Promise<boolean> {
    try {
      await this.client.get('/projects');
      return true;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        return false;
      }
      throw error;
    }
  }

  // ============ Projects ============

  /**
   * Get all projects (auto-paginates)
   */
  async getProjects(): Promise<TodoistProject[]> {
    try {
      return await this.fetchAllPages<TodoistProject>('/projects');
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get a single project by ID
   */
  async getProject(projectId: string): Promise<TodoistProject> {
    try {
      const response = await this.client.get(`/projects/${projectId}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // ============ Tasks ============

  /**
   * Get all active tasks (auto-paginates)
   * @param params Optional filters (project_id, section_id, label, ids)
   */
  async getTasks(params?: {
    project_id?: string;
    section_id?: string;
    label?: string;
    ids?: string[];
  }): Promise<TodoistTask[]> {
    try {
      return await this.fetchAllPages<TodoistTask>('/tasks', params);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get a single task by ID
   */
  async getTask(taskId: string): Promise<TodoistTask> {
    try {
      const response = await this.client.get(`/tasks/${taskId}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Create a new task
   */
  async createTask(task: {
    content: string;
    description?: string;
    project_id?: string;
    section_id?: string;
    parent_id?: string;
    order?: number;
    labels?: string[];
    priority?: number;
    due_string?: string;
    due_date?: string;
    due_datetime?: string;
    due_lang?: string;
    assignee_id?: string;
    duration?: number;
    duration_unit?: string;
    deadline_date?: string;
  }): Promise<TodoistTask> {
    try {
      const response = await this.client.post('/tasks', task);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Update an existing task
   */
  async updateTask(taskId: string, updates: {
    content?: string;
    description?: string;
    labels?: string[];
    priority?: number;
    due_string?: string;
    due_date?: string;
    due_datetime?: string;
    due_lang?: string;
    assignee_id?: string;
    duration?: number;
    duration_unit?: string;
    deadline_date?: string;
  }): Promise<TodoistTask> {
    try {
      const response = await this.client.post(`/tasks/${taskId}`, updates);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Move a task to a different project using Sync API
   * The REST API v2 does not support changing project_id, so we use the Sync API
   */
  async moveTask(taskId: string, projectId: string): Promise<boolean> {
    try {
      const response = await axios.post(
        SYNC_API_URL,
        {
          commands: JSON.stringify([
            {
              type: 'item_move',
              uuid: uuidv4(),
              args: {
                id: taskId,
                project_id: projectId,
              },
            },
          ]),
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      // Check if the command was successful
      const syncStatus = response.data?.sync_status;
      if (syncStatus) {
        const commandResults = Object.values(syncStatus);
        return commandResults.every((result: any) => result === 'ok');
      }
      return true;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Move a task to a different section within the same project using Sync API
   */
  async moveTaskToSection(taskId: string, sectionId: string | null): Promise<boolean> {
    try {
      const response = await axios.post(
        SYNC_API_URL,
        {
          commands: JSON.stringify([
            {
              type: 'item_move',
              uuid: uuidv4(),
              args: {
                id: taskId,
                section_id: sectionId || null,
              },
            },
          ]),
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      // Check if the command was successful
      const syncStatus = response.data?.sync_status;
      if (syncStatus) {
        const commandResults = Object.values(syncStatus);
        return commandResults.every((result: any) => result === 'ok');
      }
      return true;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Close (complete) a task
   */
  async closeTask(taskId: string): Promise<boolean> {
    try {
      await this.client.post(`/tasks/${taskId}/close`);
      return true;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Reopen a completed task
   */
  async reopenTask(taskId: string): Promise<boolean> {
    try {
      await this.client.post(`/tasks/${taskId}/reopen`);
      return true;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Delete a task
   */
  async deleteTask(taskId: string): Promise<boolean> {
    try {
      await this.client.delete(`/tasks/${taskId}`);
      return true;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get completed tasks
   * @param params Required: since and until (ISO 8601 datetime). Optional: project_id, limit, cursor.
   */
  async getCompletedTasks(params: {
    since: string;
    until: string;
    project_id?: string;
    section_id?: string;
    limit?: number;
    cursor?: string;
  }): Promise<TodoistCompletedTask[]> {
    try {
      const all: TodoistCompletedTask[] = [];
      let cursor: string | null = params.cursor ?? null;
      do {
        const response = await axios.get(COMPLETED_TASKS_URL, {
          params: { ...params, cursor },
          headers: { 'Authorization': `Bearer ${this.apiToken}` },
        });
        const data = response.data as { items: TodoistCompletedTask[]; next_cursor: string | null };
        all.push(...(data.items || []));
        cursor = data.next_cursor;
      } while (cursor);
      return all;
    } catch (error) {
      this.handleError(error);
    }
  }

  // ============ Sections ============

  /**
   * Get all sections (optionally filtered by project, auto-paginates)
   */
  async getSections(projectId?: string): Promise<TodoistSection[]> {
    try {
      const params = projectId ? { project_id: projectId } : undefined;
      return await this.fetchAllPages<TodoistSection>('/sections', params);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get a single section by ID
   */
  async getSection(sectionId: string): Promise<TodoistSection> {
    try {
      const response = await this.client.get(`/sections/${sectionId}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Create a new section
   */
  async createSection(section: {
    name: string;
    project_id: string;
    order?: number;
  }): Promise<TodoistSection> {
    try {
      const response = await this.client.post('/sections', section);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Update an existing section
   */
  async updateSection(sectionId: string, updates: {
    name?: string;
  }): Promise<TodoistSection> {
    try {
      const response = await this.client.post(`/sections/${sectionId}`, updates);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Delete a section
   */
  async deleteSection(sectionId: string): Promise<boolean> {
    try {
      await this.client.delete(`/sections/${sectionId}`);
      return true;
    } catch (error) {
      this.handleError(error);
    }
  }

  // ============ Labels ============

  /**
   * Get all labels (auto-paginates)
   */
  async getLabels(): Promise<TodoistLabel[]> {
    try {
      return await this.fetchAllPages<TodoistLabel>('/labels');
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get a single label by ID
   */
  async getLabel(labelId: string): Promise<TodoistLabel> {
    try {
      const response = await this.client.get(`/labels/${labelId}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Create a new label
   */
  async createLabel(label: {
    name: string;
    color?: string;
    order?: number;
    is_favorite?: boolean;
  }): Promise<TodoistLabel> {
    try {
      const response = await this.client.post('/labels', label);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Update an existing label
   */
  async updateLabel(labelId: string, updates: {
    name?: string;
    color?: string;
    order?: number;
    is_favorite?: boolean;
  }): Promise<TodoistLabel> {
    try {
      const response = await this.client.post(`/labels/${labelId}`, updates);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Delete a label
   */
  async deleteLabel(labelId: string): Promise<boolean> {
    try {
      await this.client.delete(`/labels/${labelId}`);
      return true;
    } catch (error) {
      this.handleError(error);
    }
  }

  // ============ Helper Methods ============

  /**
   * Get tasks due today or overdue
   */
  async getTodayTasks(): Promise<TodoistTask[]> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const allTasks = await this.getTasks();
      return allTasks.filter(task => {
        if (!task.due) return false;

        const dueDate = new Date(task.due.date);
        dueDate.setHours(0, 0, 0, 0);

        // Include today and overdue tasks
        return dueDate <= today;
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get inbox tasks (tasks in the inbox project)
   */
  async getInboxTasks(): Promise<TodoistTask[]> {
    try {
      const projects = await this.getProjects();
      const inboxProject = projects.find(p => p.inbox_project);

      if (!inboxProject) {
        return [];
      }

      return await this.getTasks({ project_id: inboxProject.id });
    } catch (error) {
      this.handleError(error);
    }
  }

  // ============ Pagination ============

  /**
   * Fetch all pages from a cursor-paginated v1 endpoint.
   * v1 list endpoints return { results: T[], next_cursor: string | null }.
   */
  private async fetchAllPages<T>(path: string, params?: Record<string, any>): Promise<T[]> {
    const all: T[] = [];
    let cursor: string | null = null;
    do {
      const response = await this.client.get(path, {
        params: { ...params, cursor, limit: 200 },
      });
      const data = response.data as PaginatedResponse<T>;
      all.push(...data.results);
      cursor = data.next_cursor;
    } while (cursor);
    return all;
  }
}

/**
 * Factory function to create a Todoist API client
 */
export function createTodoistClient(apiToken: string): TodoistAPI {
  return new TodoistAPI(apiToken);
}
