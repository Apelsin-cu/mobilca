const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const logger = require('firebase-functions/logger');
const cors = require('cors')({ origin: true });
const OpenAI = require('openai');

const openAiKey = defineSecret('OPENAI_API_KEY');
const deepAiKey = defineSecret('DEEPAI_API_KEY');

const SYSTEM_PROMPT = `
You generate concise cooking recipes in Russian.
Return valid JSON only.
Generate recipes based on products that will expire soon.
Each recipe must include:
- id
- title
- summary
- matchedProductNames
- missingIngredients
- prepMinutes
- cookMinutes
- difficulty
- nutrition { calories, proteins, fats, carbs }
- ingredients
- steps [{ title, description, imagePrompt }]
- coverImagePrompt
- tips
- source
`;

const createOpenAIClient = () =>
  new OpenAI({
    apiKey: openAiKey.value(),
  });

const buildImageWithOpenAI = async (client, prompt) => {
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
      'api-key': deepAiKey.value(),
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
    throw new Error(`DeepAI image error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return data.output_url;
};

const buildImage = async (client, prompt) => {
  if (deepAiKey.value()) {
    return buildImageWithDeepAI(prompt);
  }

  return buildImageWithOpenAI(client, prompt);
};

exports.generateRecipes = onRequest(
  {
    region: 'europe-west1',
    secrets: [openAiKey, deepAiKey],
    timeoutSeconds: 540,
    memory: '1GiB',
  },
  async (req, res) => {
    cors(req, res, async () => {
      try {
        if (req.method !== 'POST') {
          res.status(405).json({ error: 'Method not allowed' });
          return;
        }

        if (!openAiKey.value()) {
          res.status(500).json({ error: 'OPENAI_API_KEY is not configured' });
          return;
        }

        const { products = [], cacheKey } = req.body || {};

        if (!Array.isArray(products) || !products.length) {
          res.status(400).json({ error: 'products are required' });
          return;
        }

        const client = createOpenAIClient();
        const productSummary = products.map((product) => ({
          name: product.name,
          category: product.category,
          expiryDate: product.expiryDate,
          quantity: product.quantity,
        }));

        const completion = await client.responses.create({
          model: 'gpt-5.4-mini',
          text: {
            format: {
              type: 'json_schema',
              name: 'generated_recipes',
              strict: true,
              schema: {
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
                        'source'
                      ],
                    },
                  },
                },
                required: ['recipes'],
              },
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
                  text: `Cache key: ${cacheKey || 'none'}\nProducts:\n${JSON.stringify(productSummary, null, 2)}\nGenerate 3-5 detailed Russian recipes from these products.`,
                },
              ],
            },
          ],
        });

        const parsed = JSON.parse(completion.output_text || '{}');
        const recipes = [];

        for (const recipe of parsed.recipes || []) {
          const mainImageUrl = await buildImage(client, recipe.coverImagePrompt);
          const steps = [];

          for (const step of recipe.steps) {
            const imageUrl = await buildImage(client, step.imagePrompt);
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
        logger.error('generateRecipes failed', error);
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });
  }
);
