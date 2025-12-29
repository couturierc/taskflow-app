/**
 * Todoist API Integration Test with Real Account
 * 
 * Tests the API client with actual Todoist credentials
 */

import { describe, it, expect } from 'vitest';
import { TodoistAPI } from '../lib/todoist-api';

describe('Todoist API Integration (Real Account)', () => {
  const API_TOKEN = '1ed9e3f38bb4728db18aed2cae8b930613b81c54';
  const api = new TodoistAPI(API_TOKEN);

  it('should validate the API token successfully', async () => {
    const isValid = await api.validateToken();
    expect(isValid).toBe(true);
  }, 15000);

  it('should fetch projects from the account', async () => {
    const projects = await api.getProjects();
    expect(Array.isArray(projects)).toBe(true);
    expect(projects.length).toBeGreaterThan(0);
    
    // Verify project structure
    const firstProject = projects[0];
    expect(firstProject).toHaveProperty('id');
    expect(firstProject).toHaveProperty('name');
    expect(firstProject).toHaveProperty('color');
    
    console.log(`Found ${projects.length} projects`);
    console.log('First project:', firstProject.name);
  }, 15000);

  it('should fetch tasks from the account', async () => {
    const tasks = await api.getTasks();
    expect(Array.isArray(tasks)).toBe(true);
    
    if (tasks.length > 0) {
      const firstTask = tasks[0];
      expect(firstTask).toHaveProperty('id');
      expect(firstTask).toHaveProperty('content');
      expect(firstTask).toHaveProperty('is_completed');
      expect(firstTask).toHaveProperty('priority');
      
      console.log(`Found ${tasks.length} tasks`);
      console.log('First task:', firstTask.content);
    } else {
      console.log('No tasks found in account');
    }
  }, 15000);

  it('should fetch inbox tasks', async () => {
    const inboxTasks = await api.getInboxTasks();
    expect(Array.isArray(inboxTasks)).toBe(true);
    console.log(`Found ${inboxTasks.length} inbox tasks`);
  }, 15000);

  it('should fetch today tasks', async () => {
    const todayTasks = await api.getTodayTasks();
    expect(Array.isArray(todayTasks)).toBe(true);
    console.log(`Found ${todayTasks.length} today/overdue tasks`);
  }, 15000);

  it('should fetch sections', async () => {
    const sections = await api.getSections();
    expect(Array.isArray(sections)).toBe(true);
    console.log(`Found ${sections.length} sections`);
  }, 15000);

  it('should fetch labels', async () => {
    const labels = await api.getLabels();
    expect(Array.isArray(labels)).toBe(true);
    console.log(`Found ${labels.length} labels`);
  }, 15000);
});
