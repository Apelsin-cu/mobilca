# Quick Start

## Important

The active application is `helfifexpo/`.
Do not use the legacy root-level React Native files as the main app.

## Option 1: Start From Repository Root

Install app dependencies:

```bash
npm run install:app
```

Start Expo:

```bash
npm run start
```

Run on Android:

```bash
npm run android
```

Run on web:

```bash
npm run web
```

## Option 2: Work Directly In The App Folder

```bash
cd helfifexpo
npm install
npm start
```

## What Works Right Now

- barcode scanning
- manual product entry
- Firestore-based product storage
- Open Food Facts lookup
- expiry reminders

## Recommended Next Checks

After launch, verify:

1. camera permission is requested correctly
2. product scan opens the add-product flow
3. manual product entry saves to Firestore
4. fridge list displays saved items
5. notifications can be scheduled on a real device
