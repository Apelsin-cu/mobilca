# Recipe API

Server for recipe generation pipeline:

`products -> Spoonacular/TheMealDB -> OpenAI (Russian detailed rewrite) -> images -> app`

## Setup

1. Create a new OpenAI API key.
2. Create a Spoonacular API key.
3. Optional: add a separate DeepAI key for recipe images.
4. TheMealDB is used as an additional public recipe source.
5. Put them in `.env` as:
   `OPENAI_API_KEY`
   `SPOONACULAR_API_KEY`
   `DEEPAI_API_KEY` (optional)
   `THEMEALDB_API_KEY=1` (default test key, optional)
6. Install dependencies:
   `npm install`
7. Run:
   `npm start`

## Client

Set this in the Expo app environment:

`EXPO_PUBLIC_RECIPE_API_URL=http://YOUR_HOST:8787/generate-recipes`

The mobile app:
- checks Firestore cache first
- requests the backend only when there is no cached set
- the backend fetches recipe candidates from Spoonacular and TheMealDB
- OpenAI rewrites them into strict Russian, detailed recipes
- generated result is stored in Firestore for reuse

If `DEEPAI_API_KEY` is present, the server uses DeepAI for recipe cover and step images.
If it is not present, image generation falls back to OpenAI.

TheMealDB:
- by default the server uses test key `1`
- for public app release TheMealDB recommends upgrading to a production/supporter key
