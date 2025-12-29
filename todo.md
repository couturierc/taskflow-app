# Todoist Client - Project TODO

## Authentication
- [x] Login screen with API token input
- [x] Secure token storage with SecureStore
- [x] Token validation on app start
- [x] Sign out functionality

## Core API Integration
- [x] Todoist API client service
- [x] Fetch projects endpoint
- [x] Fetch tasks endpoint
- [x] Create task endpoint
- [x] Update task endpoint
- [x] Complete task endpoint
- [x] Delete task endpoint
- [x] Error handling and retry logic

## Today Screen
- [x] Today screen layout with task list
- [x] Filter tasks for today and overdue
- [x] Task count summary
- [x] Pull-to-refresh functionality
- [x] Empty state when no tasks

## Inbox Screen
- [x] Inbox screen layout
- [x] Display inbox tasks
- [x] Task count display
- [x] Pull-to-refresh

## Projects Screen
- [x] Projects list screen
- [x] Display all projects with colors
- [ ] Task count badges per project
- [ ] Navigation to project detail

## Project Detail Screen
- [ ] Project detail screen layout
- [ ] Display tasks for selected project
- [ ] Back navigation
- [ ] Project header with color

## Task Management
- [x] Task row component with checkbox
- [x] Task completion toggle
- [x] Task priority indicators (P1-P4)
- [x] Due date display
- [ ] Project badge display
- [ ] Add task floating action button
- [ ] Add/Edit task modal sheet
- [ ] Task form with title input
- [ ] Task form with description input
- [ ] Task form with project picker
- [ ] Task form with due date picker
- [ ] Task form with priority selector
- [ ] Delete task functionality

## Settings Screen
- [x] Settings screen layout
- [ ] Theme selector (Light/Dark/System)
- [x] Display user info
- [x] Sign out button
- [x] App version display

## UI/UX Polish
- [x] Tab bar navigation
- [x] Haptic feedback on interactions
- [ ] Task completion animations
- [x] Loading states and spinners
- [x] Error messages and alerts
- [x] Optimistic UI updates
- [x] Keyboard handling

## Data Management
- [ ] Local caching with AsyncStorage
- [ ] Background sync on app foreground
- [ ] Offline viewing support
- [ ] Sync status indicator

## API Migration
- [x] Switch from API v1 to REST API v2
- [x] Update API base URL
- [x] Revert type definitions to simpler v2 structure
- [x] Remove normalization methods (not needed in v2)
- [x] Test all endpoints with v2

## Version 1.0.2 Features
- [x] Floating Action Button (FAB) component
- [x] Task creation modal/sheet
- [x] Task form with title input
- [x] Task form with description input
- [x] Task form with project selector
- [x] Task form with due date picker
- [x] Task form with priority selector
- [x] Create task API integration
- [x] Task detail/edit modal
- [x] Edit task functionality
- [x] Delete task with confirmation
- [x] Search bar component
- [x] Search tasks by keyword
- [x] Filter by priority
- [x] Filter by project
- [ ] Filter by label

## Version 1.0.3 Features - Labels, Sections & Project Detail

### Labels System
- [x] Labels management screen (create, edit, delete)
- [x] Label color picker
- [x] Assign labels to tasks in task form
- [x] Display label badges on task cards
- [ ] Filter by label in search/filter modal
- [x] Label API integration (get, create, update, delete)

### Sections
- [x] Sections API integration (get, create, update, delete)
- [x] Display tasks grouped by section in project detail
- [x] Create section UI in project detail
- [ ] Move tasks between sections (not implemented - API limitation)
- [x] Collapse/expand sections
- [x] Section headers in task lists

### Project Detail View
- [x] Project detail screen component
- [x] Navigation from projects list to detail
- [x] Display all tasks in project
- [x] Show sections with tasks
- [x] Project header with name and stats
- [x] FAB to create task in current project
- [x] Search and filter within project
- [x] Pull-to-refresh in project detail
- [x] Empty state for projects with no tasks

### Integration
- [x] Add label badges to Today screen tasks
- [x] Add label badges to Inbox screen tasks
- [ ] Add label filter option to filter modal
- [x] Update task form to support label selection
- [x] Update projects screen to navigate to detail

## Version 1.0.4 Features - Subtasks, Recurring Tasks, Calendar

### Subtasks
- [x] Research parent_id field in Todoist API
- [x] Display subtasks indented under parent tasks
- [x] Show completion progress on parent tasks
- [x] Create subtask from task detail view (via parent_id parameter)
- [ ] Collapse/expand subtask groups (not implemented)
- [x] Visual hierarchy with indentation

### Recurring Tasks
- [x] Research due.string format for recurring patterns
- [x] Support "every day", "every week", "every month" patterns
- [x] Support "every Monday", "every 2 weeks" patterns
- [x] Display recurring icon on task cards
- [x] Show next occurrence date
- [x] Parse natural language recurrence in task form

### Calendar Date Picker
- [x] Create calendar component for date selection
- [x] Month view with day grid
- [x] Highlight today and selected date
- [x] Navigate between months
- [x] Quick select buttons (Today, Tomorrow, Next Week)
- [x] Replace text input with calendar picker in task form

### Calendar View
- [x] New Calendar tab in navigation
- [x] Month view displaying tasks by due date
- [x] Day cells with task count indicators
- [x] Tap day to see tasks for that date
- [x] Navigate between months
- [x] Highlight today and days with tasks
- [x] Color-code tasks by priority or project

## Bug Fixes and Improvements
- [x] Fix task form modal header clashing with Android status bar
- [x] Add Project field to task edit form (not just create)
- [x] Allow changing task project when editing existing tasks

## New Issues and Features
- [x] Make tasks clickable in Calendar tab to open task edit modal
- [ ] Investigate and fix APK build error (status 404)
- [x] Add task completion toggle in Calendar tab task list

## Version 1.0.5 Features - Batch Operations & Offline Mode (In Progress)

### Batch Operations
- [x] Batch context provider created
- [x] Multi-select mode state management
- [x] Floating action bar component w### Batch Operations Integration
- [x] Batch context provider created
- [x] Floating action bar component
- [ ] Add multi-select toggle to Today screen (v1.0.9)
- [ ] Add multi-select toggle to Inbox screen (v1.0.9)
- [ ] Add multi-select toggle to Project Detail screen (v1.0.9)
- [ ] Batch complete tasks implementation (v1.0.9)
- [ ] Batch delete tasks implementation (v1.0.9)
- [ ] Batch move tasks to different project implementation (v1.0.9)
- [ ] Select all / Deselect all functionality (v1.0.9)

### Offline Mode
- [x] Offline storage utility (AsyncStorage)
- [x] Cache tasks, projects, labels functions
- [x] Sync queue management
- [x] Offline sync manager with auto-sync
- [x] Network status detection
- [x] Sync manager integrated into auth context
- [ ] Integrate caching into all data loading functions (v1.0.9)
- [ ] Add pending changes to queue on offline operations (v1.0.9)
- [ ] Show offline indicator in UI (v1.0.9)
- [ ] Optimistic updates with rollback on error (v1.0.9)

## Version 1.0.8 Features - Bug Fixes, Markdown, Batch & Offline

### Bug Fixes
- [x] Fix project move bug - refresh task lists after moving task to different project
- [x] Ensure task appears in new project immediately after move
- [x] Ensure task is removed from old project after move
- [x] Fix task detail showing old project after move

### Markdown Support
- [x] Add markdown rendering library (react-native-markdown-display)
- [x] Render markdown in task titles
- [x] Render markdown in task descriptions
- [x] Support bold, italic, lists, code blocks, links
- [x] Handle markdown parsing errors gracefully

### Batch Operations Integration
- [ ] Add multi-select toggle to Today screen
- [ ] Add multi-select toggle to Inbox screen
- [ ] Add multi-select toggle to Project Detail screen
- [ ] Implement batch complete functionality
- [ ] Implement batch delete functionality
- [ ] Implement batch move functionality
- [ ] Add select all / deselect all buttons

### Offline Caching Integration
- [ ] Cache tasks on load
- [ ] Cache projects on load
- [ ] Cache labels on load
- [ ] Load from cache first, then sync
- [ ] Show cache status indicator
- [ ] Queue changes when offline

### Offline Indicator
- [ ] Add offline status banner
- [ ] Show pending sync count
- [ ] Show last sync timestamp
- [ ] Auto-hide when online

### Version Update
- [ ] Update app version to 1.0.8 in app.config.ts
- [ ] Update version display in Settings screen
