# TaskFlow - Todoist Client

<p align="center">
  <img src="assets/images/icon.png" alt="TaskFlow Logo" width="120" height="120">
</p>

<p align="center">
  A cross-platform task management app built with Expo/React Native that integrates with the Todoist API.
</p>

## Features

- ✅ Task management (create, edit, delete, complete)
- 📁 Project organization with sections
- 🏷️ Labels and tagging system
- 📅 Calendar view with date picker
- 🔄 Recurring tasks support
- 📝 Markdown rendering in tasks
- 🌙 Dark/Light theme support
- 📱 Cross-platform (Android, Web) [iOS to be tested]

## Prerequisites

- Node.js 18+ 
- pnpm 9+
- (For mobile) Expo Go app or development build

## Getting Started

### Install Dependencies

```bash
pnpm install
```

### Run Development Server

```bash
# Start web preview (opens at http://localhost:8081)
pnpm dev:metro

# Or run full dev server with backend
pnpm dev
```

### Preview Options

| Platform | Command |
|----------|---------|
| Web | Open http://localhost:8081 in browser |
| iOS | Press `i` in terminal (requires iOS Simulator) |
| Android | Press `a` in terminal (requires Android Emulator or physical device) |
| Expo Go | Scan QR code in terminal with Expo Go app |

## Building for Production

### Android APK (Local Build)

```bash
# Generate native Android project
npx expo prebuild --platform android

# Build APK
cd android && ./gradlew assembleRelease
```

### Using EAS Build

If you have an Expo account with EAS Build credits:

1. Create an Expo account at https://expo.dev
2. Install EAS CLI: `npm install -g eas-cli`
3. Login: `eas login`
4. Build: `eas build --platform android --profile preview`

## CI/CD with GitHub Actions

This project includes a GitHub Actions workflow for building Android APKs locally:

### Local Build (`.github/workflows/build-android-local.yml`)

Builds directly on GitHub Actions runners without requiring an Expo account. Uses `expo prebuild` to generate native projects, then builds with Gradle.

Triggered on pushes/PRs to main/master branches, or manually via workflow dispatch.

## Environment Variables

Create a `.env` file with:

```env
# Optional - for server-side features
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
```

## Project Structure

```
├── app/                 # Expo Router pages
│   ├── (tabs)/         # Tab navigation screens
│   ├── oauth/          # OAuth callback handling
│   └── project/        # Dynamic project routes
├── components/         # Reusable UI components
├── constants/          # App constants and theme
├── hooks/              # Custom React hooks
├── lib/                # Utilities and API clients
├── server/             # Backend API (tRPC)
└── shared/             # Shared types and utilities
```

## Tech Stack

- **Framework**: Expo SDK 54 with React Native
- **Routing**: Expo Router v6
- **Styling**: NativeWind (TailwindCSS for React Native)
- **State**: TanStack React Query
- **API**: tRPC with Express backend
- **Database**: Drizzle ORM with MySQL
- **Bundler**: Metro

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start full development server |
| `pnpm dev:metro` | Start Expo Metro only (web) |
| `pnpm dev:server` | Start backend server only |
| `pnpm build` | Build server for production |
| `pnpm test` | Run tests with Vitest |
| `pnpm lint` | Run ESLint |
| `pnpm check` | TypeScript type checking |

## License

MIT
