# TaskFlow - Todoist Client

<p align="center">
  <img src="assets/images/icon.png" alt="TaskFlow Logo" width="120" height="120">
</p>

<p align="center">
  <strong>An unofficial, open-source Todoist client</strong><br>
  Built with Expo/React Native for a beautiful, native mobile experience.
</p>

<p align="center">
  <a href="https://github.com/couturierc/taskflow-app/releases/latest">
    <img src="https://img.shields.io/github/v/release/couturierc/taskflow-app?style=flat-square" alt="Latest Release">
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/github/license/couturierc/taskflow-app?style=flat-square" alt="License">
  </a>
</p>

> ⚠️ **Disclaimer**: TaskFlow is an independent, unofficial project and is not affiliated with, endorsed by, or connected to Doist (the makers of Todoist) in any way. "Todoist" is a trademark of Doist. This app uses the official [Todoist API](https://developer.todoist.com/) to connect to your account.

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

### iOS App (Local Build - macOS only)

> ⚠️ **Not tested** - iOS builds have not been verified due to time constraints. The commands below are theoretical and may require adjustments.

```bash
npx expo prebuild --platform ios
cd ios && pod install
xcodebuild -workspace TaskFlow.xcworkspace -scheme TaskFlow \
  -sdk iphonesimulator CODE_SIGNING_ALLOWED=NO build
```

### Using EAS Build

If you have an Expo account with EAS Build credits:

1. Create an Expo account at https://expo.dev
2. Install EAS CLI: `npm install -g eas-cli`
3. Login: `eas login`
4. Build: `eas build --platform android --profile preview`

## CI/CD with GitHub Actions

This project includes GitHub Actions workflows for automated Android builds:

### Development Build

- **Android** (`.github/workflows/build-android-local.yml`): Builds APK on Ubuntu runners (on push/PR to main/master)

### Release Workflow (`.github/workflows/release.yml`)

Creates GitHub Releases with versioned Android APK. Triggered by:
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

> **Note:** iOS builds are not automated (code signing complexity, macOS runner costs, and lack of testing time).

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

This project is licensed under the **GNU General Public License v3.0** - see the [LICENSE](LICENSE) file for details.

This means:
- ✅ You can use, modify, and distribute this software
- ✅ You must keep it open source
- ✅ Derivative works must also be GPL-3.0 licensed
- ❌ You cannot create closed-source forks

## Acknowledgments

TaskFlow is made possible by these amazing open-source projects:

- **[Expo](https://expo.dev/)** - The platform for universal React apps
- **[React Native](https://reactnative.dev/)** - Build native apps with React
- **[NativeWind](https://www.nativewind.dev/)** - TailwindCSS for React Native
- **[TanStack Query](https://tanstack.com/query)** - Powerful data synchronization
- **[tRPC](https://trpc.io/)** - End-to-end type-safe APIs
- **[Drizzle ORM](https://orm.drizzle.team/)** - TypeScript ORM
- **[Todoist API](https://developer.todoist.com/)** - Task management API

Special thanks to the open-source community for making projects like this possible.

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/couturierc">Camille Couturier</a>
</p>
