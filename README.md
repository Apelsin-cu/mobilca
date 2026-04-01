# ShelfLife Workspace

This repository currently contains one active mobile app and a small amount of legacy root-level scaffolding.

## Active Project

The working application lives in `helfifexpo/`.

Technology stack:
- Expo SDK 54
- React Native 0.81
- TypeScript
- Firebase Firestore
- Open Food Facts API

## Current Status

The root-level files such as `App.tsx` and `index.js` are legacy artifacts from an older app structure and should not be used as the main entrypoint.

Use the Expo app inside `helfifexpo/` for development and release work.

## Quick Start

From the repository root:

```bash
npm run install:app
npm run start
```

Android:

```bash
npm run android
```

Web:

```bash
npm run web
```

You can also work directly inside `helfifexpo/`:

```bash
cd helfifexpo
npm install
npm start
```

## Real Project Structure

```text
helfifexpo/
  App.tsx
  app.json
  package.json
  src/
    components/
    config/
    screens/
    services/
    types/
  android/
```

## Documentation

- `QUICK_START.md`: short launch guide
- `PROJECT_FILES.md`: file map for the active app
- `INSTALLATION.md`: older install notes, partially outdated
- `WINDOWS_SETUP.md`: older Windows notes, partially outdated

## Next Cleanup Targets

- remove legacy root React Native scaffold after confirming it is no longer needed
- normalize dates and notification logic inside the Expo app
- add linting, tests, and environment-based config
