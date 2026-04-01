import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const port = process.env.PORT || 8787;
const spoonacularKey = process.env.SPOONACULAR_API_KEY;
const spoonacularBaseUrl =
  process.env.SPOONACULAR_BASE_URL || 'https://api.spoonacular.com';
const mealDbApiKey = process.env.THEMEALDB_API_KEY || '1';
const mealDbBaseUrl =
  process.env.THEMEALDB_BASE_URL ||
  `https://www.themealdb.com/api/json/v1/${mealDbApiKey}`;
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const RECIPE_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    recipes: {
      type: 'array',
      minItems: 1,
      maxItems: 5,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          summary: { type: 'string' },
          matchedProductNames: {
            type: 'array',
            items: { type: 'string' },
          },
          missingIngredients: {
            type: 'array',
            items: { type: 'string' },
          },
          prepMinutes: { type: 'number' },
          cookMinutes: { type: 'number' },
          difficulty: { type: 'string' },
          nutrition: {
            type: 'object',
            additionalProperties: false,
            properties: {
              calories: { type: 'number' },
              proteins: { type: 'number' },
              fats: { type: 'number' },
              carbs: { type: 'number' },
            },
            required: ['calories', 'proteins', 'fats', 'carbs'],
          },
          ingredients: {
            type: 'array',
            items: { type: 'string' },
          },
          steps: {
            type: 'array',
            minItems: 2,
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                imagePrompt: { type: 'string' },
              },
              required: ['title', 'description', 'imagePrompt'],
            },
          },
          coverImagePrompt: { type: 'string' },
          tips: {
            type: 'array',
            items: { type: 'string' },
          },
          source: { type: 'string' },
        },
        required: [
          'id',
          'title',
          'summary',
          'matchedProductNames',
          'missingIngredients',
          'prepMinutes',
          'cookMinutes',
          'difficulty',
          'nutrition',
          'ingredients',
          'steps',
          'coverImagePrompt',
          'tips',
          'source',
        ],
      },
    },
  },
  required: ['recipes'],
};

const SYSTEM_PROMPT = `
Ты помогаешь мобильному приложению с рецептами.
На вход ты получаешь найденные рецепты из Spoonacular и список продуктов пользователя.

Требования:
- Верни только валидный JSON.
- Все тексты должны быть строго на русском языке.
- Сделай названия и описания естественными для русскоязычного пользователя.
- Сделай рецепты максимально подробными, но без воды.
- Ингредиенты пиши понятно и по-человечески.
- Шаги должны быть подробными, пошаговыми и практичными.
- Для каждого шага создай короткий реалистичный промпт для food-photo изображения.
- Для обложки тоже создай отдельный промпт.
- Используй только те блюда, которые действительно подходят под продукты пользователя.
- Не выдумывай экзотические ингредиенты без необходимости.
- Если данных от Spoonacular мало, аккуратно дополни недостающие бытовые детали приготовления.
`;

const stripHtml = (value = '') => value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const buildImageWithOpenAI = async (prompt) => {
  const image = await client.images.generate({
    model: 'gpt-image-1',
    prompt,
    size: '1024x1024',
  });

  const base64 = image.data?.[0]?.b64_json;
  if (!base64) {
    return undefined;
  }

  return `data:image/png;base64,${base64}`;
};

const buildImageWithDeepAI = async (prompt) => {
  const response = await fetch('https://api.deepai.org/api/text2img', {
    method: 'POST',
    headers: {
      'api-key': process.env.DEEPAI_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: prompt,
      width: '1024',
      height: '1024',
      image_generator_version: 'hd',
      negative_prompt: 'blurry, low quality, watermark, logo, text, distorted food',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepAI image error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.output_url;
};

const buildImage = async (prompt) => {
  if (process.env.DEEPAI_API_KEY) {
    return buildImageWithDeepAI(prompt);
  }

  return buildImageWithOpenAI(prompt);
};

const getNutrientAmount = (nutrients = [], name) => {
  const nutrient = nutrients.find((item) => item.name === name);
  return nutrient && Number.isFinite(nutrient.amount) ? Math.round(nutrient.amount * 10) / 10 : 0;
};

const spoonacularFetch = async (path) => {
  if (!spoonacularKey) {
    throw new Error('SPOONACULAR_API_KEY is not configured');
  }

  const url = new URL(`${spoonacularBaseUrl}${path}`);
  const response = await fetch(url, {
    headers: {
      'x-api-key': spoonacularKey,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Spoonacular error ${response.status}: ${text}`);
  }

  return response.json();
};

const mealDbFetch = async (path) => {
  const url = new URL(`${mealDbBaseUrl}${path}`);
  const response = await fetch(url);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`TheMealDB error ${response.status}: ${text}`);
  }

  return response.json();
};

const findRecipesFromSpoonacular = async (products) => {
  const ingredients = products
    .map((product) => product.name?.trim())
    .filter(Boolean)
    .slice(0, 8)
    .join(',');

  if (!ingredients) {
    return [];
  }

  const foundRecipes = await spoonacularFetch(
    `/recipes/findByIngredients?ingredients=${encodeURIComponent(
      ingredients
    )}&number=8&ranking=1&ignorePantry=true`
  );

  if (!Array.isArray(foundRecipes) || !foundRecipes.length) {
    return [];
  }

  const ids = foundRecipes.map((recipe) => recipe.id).join(',');
  const detailedRecipes = await spoonacularFetch(
    `/recipes/informationBulk?ids=${ids}&includeNutrition=true`
  );
  const detailedById = new Map(
    Array.isArray(detailedRecipes)
      ? detailedRecipes.map((recipe) => [recipe.id, recipe])
      : []
  );

  return foundRecipes
    .map((recipe) => {
      const details = detailedById.get(recipe.id);
      if (!details) {
        return null;
      }

      return {
        spoonacularId: recipe.id,
        title: details.title || recipe.title,
        summary: stripHtml(details.summary || ''),
        image: details.image || recipe.image,
        usedIngredients: (recipe.usedIngredients || []).map((item) => item.name).filter(Boolean),
        missedIngredients: (recipe.missedIngredients || []).map((item) => item.name).filter(Boolean),
        ingredients: (details.extendedIngredients || [])
          .map((item) => item.original)
          .filter(Boolean),
        instructions:
          details.analyzedInstructions?.[0]?.steps?.map((step) => ({
            number: step.number,
            step: step.step,
          })) || [],
        nutrition: {
          calories: getNutrientAmount(details.nutrition?.nutrients, 'Calories'),
          proteins: getNutrientAmount(details.nutrition?.nutrients, 'Protein'),
          fats: getNutrientAmount(details.nutrition?.nutrients, 'Fat'),
          carbs: getNutrientAmount(details.nutrition?.nutrients, 'Carbohydrates'),
        },
        readyInMinutes: details.readyInMinutes || 0,
        cookingMinutes: details.cookingMinutes || 0,
        preparationMinutes: details.preparationMinutes || 0,
      };
    })
    .filter(Boolean);
};

const extractMealDbIngredients = (meal) => {
  const ingredients = [];

  for (let index = 1; index <= 20; index += 1) {
    const ingredient = meal[`strIngredient${index}`]?.trim();
    const measure = meal[`strMeasure${index}`]?.trim();

    if (!ingredient) {
      continue;
    }

    ingredients.push(measure ? `${ingredient} - ${measure}` : ingredient);
  }

  return ingredients;
};

const extractMealDbMatchedProducts = (meal, products) => {
  const normalizedIngredients = extractMealDbIngredients(meal).map((item) =>
    item.toLowerCase()
  );

  return products
    .map((product) => product.name.trim())
    .filter(Boolean)
    .filter((productName) =>
      normalizedIngredients.some((ingredient) =>
        ingredient.includes(productName.toLowerCase())
      )
    );
};

const findRecipesFromMealDb = async (products) => {
  const productNames = products
    .map((product) => product.name?.trim())
    .filter(Boolean)
    .slice(0, 6);

  if (!productNames.length) {
    return [];
  }

  const collectedMeals = new Map();

  for (const productName of productNames) {
    const response = await mealDbFetch(
      `/filter.php?i=${encodeURIComponent(productName)}`
    );
    const meals = response.meals || [];

    for (const meal of meals.slice(0, 5)) {
      if (!collectedMeals.has(meal.idMeal)) {
        collectedMeals.set(meal.idMeal, meal);
      }
    }
  }

  const mealIds = Array.from(collectedMeals.keys()).slice(0, 8);
  const detailedMeals = [];

  for (const mealId of mealIds) {
    const response = await mealDbFetch(`/lookup.php?i=${encodeURIComponent(mealId)}`);
    if (response.meals?.[0]) {
      detailedMeals.push(response.meals[0]);
    }
  }

  return detailedMeals.map((meal) => {
    const instructions = (meal.strInstructions || '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, index) => ({
        number: index + 1,
        step: line,
      }));

    const matchedProducts = extractMealDbMatchedProducts(meal, products);
    const allIngredients = extractMealDbIngredients(meal);

    return {
      sourceName: 'TheMealDB',
      sourceId: meal.idMeal,
      title: meal.strMeal,
      summary: stripHtml(meal.strInstructions || ''),
      image: meal.strMealThumb,
      usedIngredients: matchedProducts,
      missedIngredients: [],
      ingredients: allIngredients,
      instructions,
      nutrition: {
        calories: 0,
        proteins: 0,
        fats: 0,
        carbs: 0,
      },
      readyInMinutes: 0,
      cookingMinutes: 0,
      preparationMinutes: 0,
      area: meal.strArea || '',
      category: meal.strCategory || '',
    };
  });
};

const enrichRecipesWithOpenAI = async ({ products, spoonacularRecipes, cacheKey }) => {
  const completion = await client.responses.create({
    model: 'gpt-5.4-mini',
    text: {
      format: {
        type: 'json_schema',
        name: 'generated_recipes',
        strict: true,
        schema: RECIPE_JSON_SCHEMA,
      },
    },
    input: [
      {
        role: 'system',
        content: [{ type: 'input_text', text: SYSTEM_PROMPT }],
      },
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: JSON.stringify(
              {
                cacheKey,
                userProducts: products.map((product) => ({
                  name: product.name,
                  category: product.category,
                  expiryDate: product.expiryDate,
                  quantity: product.quantity,
                })),
                spoonacularRecipes,
              },
              null,
              2
            ),
          },
        ],
      },
    ],
  });

  return JSON.parse(completion.output_text || '{"recipes":[]}');
};

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    date: new Date().toISOString(),
    spoonacular: Boolean(spoonacularKey),
    openai: Boolean(process.env.OPENAI_API_KEY),
  });
});

app.post('/generate-recipes', async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OPENAI_API_KEY is not configured' });
    }

    if (!spoonacularKey) {
      return res.status(500).json({ error: 'SPOONACULAR_API_KEY is not configured' });
    }

    const { products = [], cacheKey } = req.body || {};

    if (!Array.isArray(products) || !products.length) {
      return res.status(400).json({ error: 'products are required' });
    }

    const [spoonacularRecipes, mealDbRecipes] = await Promise.allSettled([
      findRecipesFromSpoonacular(products),
      findRecipesFromMealDb(products),
    ]);

    const sourceRecipes = [
      ...(spoonacularRecipes.status === 'fulfilled' ? spoonacularRecipes.value : []),
      ...(mealDbRecipes.status === 'fulfilled' ? mealDbRecipes.value : []),
    ];

    if (!sourceRecipes.length) {
      return res.json({ recipes: [] });
    }

    const enriched = await enrichRecipesWithOpenAI({
      products,
      spoonacularRecipes: sourceRecipes,
      cacheKey,
    });

    const recipes = [];

    for (const recipe of enriched.recipes || []) {
      const mainImageUrl = await buildImage(recipe.coverImagePrompt);
      const steps = [];

      for (const step of recipe.steps || []) {
        const imageUrl = await buildImage(step.imagePrompt);
        steps.push({
          title: step.title,
          description: step.description,
          imageUrl,
        });
      }

      recipes.push({
        id: recipe.id,
        title: recipe.title,
        summary: recipe.summary,
        mainImageUrl,
        matchedProductNames: recipe.matchedProductNames,
        missingIngredients: recipe.missingIngredients,
        prepMinutes: recipe.prepMinutes,
        cookMinutes: recipe.cookMinutes,
        difficulty: recipe.difficulty,
        nutrition: recipe.nutrition,
        ingredients: recipe.ingredients,
        steps,
        tips: recipe.tips,
        source: 'generated',
      });
    }

    res.json({ recipes });
  } catch (error) {
    console.error('generate-recipes failed', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.listen(port, () => {
  console.log(`Recipe API is running on http://localhost:${port}`);
});
