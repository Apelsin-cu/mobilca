import { GeneratedRecipe } from '../types/GeneratedRecipe';
import { Product } from '../types/Product';

const API_URL = process.env.EXPO_PUBLIC_RECIPE_API_URL;

export const AiRecipeApi = {
  async generateRecipes(products: Product[], cacheKey: string): Promise<GeneratedRecipe[]> {
    if (!API_URL) {
      throw new Error('EXPO_PUBLIC_RECIPE_API_URL is not configured');
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cacheKey,
        products: products.map((product) => ({
          id: product.id,
          name: product.name,
          category: product.category,
          expiryDate: product.expiryDate,
          quantity: product.quantity,
          imageUrl: product.imageUrl,
        })),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Recipe API error: ${response.status} ${errorText}`);
    }

    const data = (await response.json()) as { recipes?: GeneratedRecipe[] };
    return data.recipes || [];
  },
};
