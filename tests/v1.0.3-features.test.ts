/**
 * Tests for v1.0.3 Features: Labels, Sections, and Project Detail
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTodoistClient } from '../lib/todoist-api';

const API_TOKEN = '1ed9e3f38bb4728db18aed2cae8b930613b81c54';

describe('v1.0.3 Features - Labels, Sections, Project Detail', () => {
  let apiClient: ReturnType<typeof createTodoistClient>;
  let testLabelId: string;
  let testProjectId: string;
  let testSectionId: string;

  beforeAll(() => {
    apiClient = createTodoistClient(API_TOKEN);
  });

  describe('Labels API', () => {
    it('should fetch all labels', async () => {
      const labels = await apiClient.getLabels();
      expect(Array.isArray(labels)).toBe(true);
      console.log(`✓ Found ${labels.length} labels`);
    });

    it('should create a new label', async () => {
      const newLabel = await apiClient.createLabel({
        name: `Test Label ${Date.now()}`,
        color: 'blue',
      });

      expect(newLabel).toBeDefined();
      expect(newLabel.name).toContain('Test Label');
      expect(newLabel.color).toBe('blue');
      testLabelId = newLabel.id;
      console.log(`✓ Created label: ${newLabel.name} (${newLabel.id})`);
    });

    it('should update a label', async () => {
      const updatedLabel = await apiClient.updateLabel(testLabelId, {
        name: 'Updated Test Label',
        color: 'red',
      });

      expect(updatedLabel.name).toBe('Updated Test Label');
      expect(updatedLabel.color).toBe('red');
      console.log(`✓ Updated label to: ${updatedLabel.name}`);
    });

    it('should delete a label', async () => {
      await apiClient.deleteLabel(testLabelId);
      console.log(`✓ Deleted label ${testLabelId}`);
    });
  });

  describe('Sections API', () => {
    beforeAll(async () => {
      // Get a project to test sections with
      const projects = await apiClient.getProjects();
      testProjectId = projects[0].id;
      console.log(`Using project ${testProjectId} for section tests`);
    });

    it('should fetch sections for a project', async () => {
      const sections = await apiClient.getSections(testProjectId);
      expect(Array.isArray(sections)).toBe(true);
      console.log(`✓ Found ${sections.length} sections in project`);
    });

    it('should create a new section', async () => {
      const newSection = await apiClient.createSection({
        name: `Test Section ${Date.now()}`,
        project_id: testProjectId,
      });

      expect(newSection).toBeDefined();
      expect(newSection.name).toContain('Test Section');
      expect(newSection.project_id).toBe(testProjectId);
      testSectionId = newSection.id;
      console.log(`✓ Created section: ${newSection.name} (${newSection.id})`);
    });

    it('should update a section', async () => {
      const updatedSection = await apiClient.updateSection(testSectionId, {
        name: 'Updated Test Section',
      });

      expect(updatedSection.name).toBe('Updated Test Section');
      console.log(`✓ Updated section to: ${updatedSection.name}`);
    });

    it('should delete a section', async () => {
      await apiClient.deleteSection(testSectionId);
      console.log(`✓ Deleted section ${testSectionId}`);
    });
  });

  describe('Project Detail Integration', () => {
    it('should fetch a specific project', async () => {
      const projects = await apiClient.getProjects();
      const projectId = projects[0].id;

      const project = await apiClient.getProject(projectId);
      expect(project).toBeDefined();
      expect(project.id).toBe(projectId);
      console.log(`✓ Fetched project: ${project.name}`);
    });

    it('should fetch tasks for a specific project', async () => {
      const projects = await apiClient.getProjects();
      const projectId = projects[0].id;

      const tasks = await apiClient.getTasks({ project_id: projectId });
      expect(Array.isArray(tasks)).toBe(true);
      console.log(`✓ Found ${tasks.length} tasks in project`);
    });
  });

  describe('Task Labels Integration', () => {
    let testTaskId: string;
    let testLabel: any;

    beforeAll(async () => {
      // Create a test label
      testLabel = await apiClient.createLabel({
        name: `Task Test Label ${Date.now()}`,
        color: 'green',
      });

      // Create a test task
      const projects = await apiClient.getProjects();
      const inbox = projects.find((p: any) => p.is_inbox_project);
      
      const task = await apiClient.createTask({
        content: `Test task with labels ${Date.now()}`,
        project_id: inbox?.id || projects[0].id,
        labels: [testLabel.name],
      });

      testTaskId = task.id;
      console.log(`Created test task ${testTaskId} with label ${testLabel.name}`);
    });

    it('should create a task with labels', async () => {
      const tasks = await apiClient.getTasks();
      const task = tasks.find((t: any) => t.id === testTaskId);

      expect(task).toBeDefined();
      expect(task?.labels).toContain(testLabel.name);
      console.log(`✓ Task has label: ${testLabel.name}`);
    });

    it('should update task labels', async () => {
      // Create another label
      const newLabel = await apiClient.createLabel({
        name: `Second Label ${Date.now()}`,
        color: 'yellow',
      });

      // Update task with both labels
      const updatedTask = await apiClient.updateTask(testTaskId, {
        labels: [testLabel.name, newLabel.name],
      });

      expect(updatedTask.labels).toContain(testLabel.name);
      expect(updatedTask.labels).toContain(newLabel.name);
      console.log(`✓ Task updated with multiple labels`);

      // Cleanup
      await apiClient.deleteLabel(newLabel.id);
    });

    afterAll(async () => {
      // Cleanup
      await apiClient.deleteTask(testTaskId);
      await apiClient.deleteLabel(testLabel.id);
      console.log(`✓ Cleaned up test task and label`);
    });
  });
});
