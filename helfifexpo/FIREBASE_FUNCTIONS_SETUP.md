# Firebase Functions Setup

## 1. Install Firebase CLI

```powershell
npm install -g firebase-tools
```

## 2. Login

```powershell
firebase login
```

## 3. Install function dependencies

```powershell
cd E:\desktop2\mobilka\helfifexpo\functions
npm install
```

## 4. Set secrets

```powershell
firebase functions:secrets:set OPENAI_API_KEY
firebase functions:secrets:set DEEPAI_API_KEY
```

`DEEPAI_API_KEY` is optional. If you skip it, images are generated through OpenAI.

## 5. Deploy

```powershell
cd E:\desktop2\mobilka\helfifexpo
firebase deploy --only functions
```

## 6. Put function URL into the app

After deploy, Firebase will print a URL like:

`https://europe-west1-food-8d785.cloudfunctions.net/generateRecipes`

Use that exact URL as:

```env
EXPO_PUBLIC_RECIPE_API_URL=https://europe-west1-food-8d785.cloudfunctions.net/generateRecipes
```

## 7. Build APK

Build only after the app points to the deployed function URL.

## Notes

- Do not put OpenAI or DeepAI keys into the mobile app.
- The app already caches generated recipes in Firestore and will reuse them.
- For RuStore, only a deployed backend URL should be used, not localhost.
