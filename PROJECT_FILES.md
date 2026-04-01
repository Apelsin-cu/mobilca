# Project Files

This file documents the active application in `helfifexpo/`.

## Workspace Level

- `package.json`: root helper scripts that proxy commands into the Expo app
- `README.md`: workspace overview
- `QUICK_START.md`: short launch guide

## Active App

- `helfifexpo/package.json`: Expo app dependencies and scripts
- `helfifexpo/App.tsx`: tab navigation entrypoint
- `helfifexpo/app.json`: Expo configuration
- `helfifexpo/eas.json`: EAS build profiles
- `helfifexpo/tsconfig.json`: TypeScript config

## Screens

- `helfifexpo/src/screens/HomeScreen.tsx`: scanner and product lookup result screen
- `helfifexpo/src/screens/FridgeScreen.tsx`: fridge list, filters, add flow

## Components

- `helfifexpo/src/components/BarcodeScanner.tsx`: camera-based barcode scanner
- `helfifexpo/src/components/AddProductModal.tsx`: product creation form
- `helfifexpo/src/components/ProductCard.tsx`: fridge grid item

## Services

- `helfifexpo/src/services/OpenFoodFactsAPI.ts`: external product lookup and category mapping
- `helfifexpo/src/services/FirebaseService.ts`: Firestore CRUD
- `helfifexpo/src/services/NotificationService.ts`: local notification scheduling

## Config And Types

- `helfifexpo/src/config/firebase.ts`: Firebase initialization
- `helfifexpo/src/types/Product.ts`: domain types and category metadata

## Legacy Files

- `App.tsx`: old root app shell, not the active app
- `index.js`: old root entrypoint, not the active app

Keep legacy files only until the team confirms they are no longer needed.
