# Todoist Client - Mobile App Design

## Design Philosophy

This Todoist client follows **Apple Human Interface Guidelines (HIG)** to feel like a native iOS app with intuitive, one-handed usage optimized for **mobile portrait orientation (9:16)**. The design emphasizes clarity, efficiency, and familiar iOS patterns for task management.

## Color Palette

The app uses Todoist's signature colors combined with iOS-standard system colors:

- **Primary (Brand)**: `#E44332` - Todoist's signature red for primary actions and accents
- **Background**: `#FFFFFF` (light) / `#000000` (dark) - Main screen background
- **Surface**: `#F7F7F7` (light) / `#1C1C1E` (dark) - Cards and elevated surfaces
- **Foreground**: `#000000` (light) / `#FFFFFF` (dark) - Primary text
- **Muted**: `#8E8E93` - Secondary text and metadata
- **Border**: `#E5E5EA` (light) / `#38383A` (dark) - Dividers and borders
- **Success**: `#34C759` - Completed tasks
- **Warning**: `#FF9500` - Due soon indicators
- **Error**: `#FF3B30` - Overdue tasks

## Screen List

### 1. **Login Screen**
- **Purpose**: Authenticate user with Todoist API token
- **Content**: 
  - App logo and name at top
  - Welcome message explaining token requirement
  - Text input for API token (secure entry)
  - "Sign In" button
  - Link to Todoist settings page to get token
- **Layout**: Centered content with generous padding, keyboard-aware scrolling

### 2. **Today Screen** (Main/Home)
- **Purpose**: Display today's tasks and quick actions
- **Content**:
  - Header with "Today" title and date
  - Task count summary
  - List of tasks due today or overdue
  - Each task shows: checkbox, title, project badge, priority indicator
  - Pull-to-refresh gesture
  - Floating "+" button for quick task add
- **Layout**: Full-screen list with sticky header, tab bar at bottom

### 3. **Inbox Screen**
- **Purpose**: Show all tasks in the Inbox (default project)
- **Content**:
  - Header with "Inbox" title
  - Task count
  - List of inbox tasks
  - Empty state when no tasks
  - Pull-to-refresh
  - Floating "+" button
- **Layout**: Same structure as Today screen

### 4. **Projects Screen**
- **Purpose**: Browse and manage all projects
- **Content**:
  - Header with "Projects" title
  - List of all projects with:
    - Project name
    - Task count badge
    - Color indicator
    - Chevron for navigation
  - "Add Project" button at bottom
- **Layout**: Grouped list style with section headers if needed

### 5. **Project Detail Screen**
- **Purpose**: View all tasks within a specific project
- **Content**:
  - Header with project name and color
  - Task count
  - List of tasks in project
  - Section support (if project has sections)
  - Pull-to-refresh
  - Floating "+" button for adding task to this project
- **Layout**: Full-screen list with back button in header

### 6. **Add/Edit Task Screen**
- **Purpose**: Create new task or edit existing task
- **Content**:
  - Header with "New Task" or "Edit Task" title
  - Task title input (large, prominent)
  - Description input (multiline)
  - Project picker (modal sheet)
  - Due date picker (modal sheet with calendar)
  - Priority selector (P1-P4)
  - Labels selector (chips)
  - "Save" and "Cancel" buttons
- **Layout**: Form-style layout with grouped sections, keyboard-aware

### 7. **Settings Screen**
- **Purpose**: App configuration and account management
- **Content**:
  - User info section (name, email if available)
  - Theme selector (Light/Dark/System)
  - API token management
  - "Sign Out" button
  - App version info
- **Layout**: Grouped list style (iOS Settings-like)

## Key User Flows

### Flow 1: First-time Login
1. User opens app → Login Screen
2. User taps "Get Token" link → Opens Todoist settings in browser
3. User copies token from Todoist
4. User returns to app, pastes token
5. User taps "Sign In" → App validates token
6. Success → Navigate to Today Screen with tab bar

### Flow 2: View and Complete Tasks
1. User on Today Screen → Sees list of tasks
2. User taps checkbox on a task → Task marked complete with animation
3. Task moves to completed section or fades out
4. Haptic feedback confirms action
5. Change syncs to Todoist API

### Flow 3: Add New Task
1. User taps floating "+" button on any task list screen
2. Add Task Sheet slides up from bottom
3. User types task title (required)
4. User optionally sets: project, due date, priority, description
5. User taps "Save" → Sheet dismisses
6. New task appears in appropriate list
7. Task syncs to Todoist API

### Flow 4: Browse Projects and Tasks
1. User taps "Projects" tab → Projects Screen
2. User sees list of all projects with task counts
3. User taps a project → Project Detail Screen
4. User sees all tasks in that project
5. User can complete tasks or add new ones
6. User taps back button → Returns to Projects Screen

### Flow 5: Edit Task
1. User taps on a task row → Task Detail Sheet
2. Sheet shows all task properties (editable)
3. User modifies title, due date, priority, etc.
4. User taps "Save" → Changes sync to API
5. Sheet dismisses, list updates

## Interaction Patterns

### Task Row Interactions
- **Tap checkbox**: Toggle task completion (immediate feedback)
- **Tap task text**: Open task detail sheet for editing
- **Swipe left**: Reveal "Delete" action (red background)
- **Swipe right**: Quick reschedule options (Today, Tomorrow, etc.)
- **Long press**: Show context menu with quick actions

### Navigation
- **Tab Bar** (bottom): Today | Inbox | Projects | Settings
- **Back button**: Top-left for hierarchical navigation
- **Modal sheets**: For add/edit forms (swipe down to dismiss)

### Feedback
- **Haptics**: Light impact on task completion, medium on button press
- **Animations**: Smooth checkbox animation, task fade-out on completion
- **Loading states**: Spinner on initial load, pull-to-refresh indicator
- **Empty states**: Friendly message with illustration when no tasks

## Typography
- **Large Title**: 34pt, Bold - Screen headers
- **Title**: 20pt, Semibold - Section headers
- **Body**: 17pt, Regular - Task titles, main content
- **Subhead**: 15pt, Regular - Metadata (project, due date)
- **Caption**: 13pt, Regular - Timestamps, counts

## Component Patterns

### Task Card
- Checkbox (left) → Task title → Priority indicator (right)
- Project badge and due date below title (if set)
- Subtle border, rounded corners
- White/surface background

### Project Card
- Color indicator (left bar) → Project name → Task count badge → Chevron
- Tappable area with press feedback

### Floating Action Button (FAB)
- Circular button with "+" icon
- Primary color background
- Bottom-right position (56pt from bottom, 16pt from right)
- Shadow for elevation
- Scale animation on press

### Bottom Sheet
- Rounded top corners
- Drag handle at top
- Backdrop dimming
- Swipe-to-dismiss gesture

## Accessibility
- All interactive elements minimum 44pt touch target
- Sufficient color contrast (WCAG AA)
- Dynamic Type support for text scaling
- VoiceOver labels for all controls
- Haptic feedback for important actions

## Performance Considerations
- Lazy loading for long task lists
- Optimistic UI updates (update UI immediately, sync in background)
- Local caching with AsyncStorage for offline viewing
- Pull-to-refresh for manual sync
- Background sync when app returns to foreground
