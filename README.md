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
- 📱 Cross-platform (Android, iOS, Web)

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

### iOS App (Local Build)

```bash
# Generate native iOS project
npx expo prebuild --platform ios

# Install CocoaPods dependencies
cd ios && pod install

# Build for Simulator (no code signing required)
xcodebuild -workspace TaskFlow.xcworkspace -scheme TaskFlow \
  -configuration Release -sdk iphonesimulator \
  -destination 'platform=iOS Simulator,name=iPhone 15' \
  CODE_SIGNING_ALLOWED=NO build
```

> **Note:** For App Store distribution, open `ios/TaskFlow.xcworkspace` in Xcode and configure your team/signing certificates.

### Using EAS Build

If you have an Expo account with EAS Build credits:

1. Create an Expo account at https://expo.dev
2. Install EAS CLI: `npm install -g eas-cli`
3. Login: `eas login`
4. Build: `eas build --platform android --profile preview`

## CI/CD with GitHub Actions

This project includes GitHub Actions workflows for building and releasing mobile apps:

### Development Builds

- **Android** (`.github/workflows/build-android-local.yml`): Builds APK on Ubuntu runners
- **iOS** (`.github/workflows/build-ios-local.yml`): Builds Simulator app on macOS runners

These workflows run on pushes/PRs to main/master branches.

### Release Workflow (`.github/workflows/release.yml`)

Creates GitHub Releases with versioned builds for both platforms. Triggered by:
- Pushing a version tag: `git tag v1.1.0 && git push origin v1.1.0`
- Manual workflow dispatch with version input

### Creating a Release

```bash
# Bump version (updates version.json and package.json)
pnpm version:bump patch  # 1.1.0 -> 1.1.1
pnpm version:bump minor  # 1.1.0 -> 1.2.0
pnpm version:bump major  # 1.1.0 -> 2.0.0

# Commit and tag
git add version.json package.json
git commit -m "chore: bump version to 1.1.1"
git tag v1.1.1
git push origin master --tags
```

The release workflow will automatically build both platforms and create a GitHub Release with the APK and iOS Simulator builds attached.

> **Note:** iOS builds are Simulator-only (no code signing). For App Store distribution, configure signing in Xcode.

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
| `pnpm version:bump` | Bump app version (patch/minor/major) |

## License

MIT
