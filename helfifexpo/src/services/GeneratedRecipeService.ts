import { AiRecipeApi } from './AiRecipeApi';
import { FirebaseService } from './FirebaseService';
import { Product } from '../types/Product';
import { GeneratedRecipe, GeneratedRecipeSet } from '../types/GeneratedRecipe';
import { RecipeService } from './RecipeService';
import { RecipeMatch } from '../types/Recipe';

const normalizeName = (value: string) => value.trim().toLowerCase();

const buildProductsSignature = (products: Product[]) =>
  [...products]
    .map((product) => `${normalizeName(product.name)}|${product.expiryDate || ''}|${product.quantity || 0}`)
    .sort();

const buildCacheKey = (products: Product[]) => {
  const signature = buildProductsSignature(products);
  return signature.join('__').replace(/[.#$/[\]]/g, '_').slice(0, 500);
};

const mapRecipeMatchToGeneratedRecipe = (match: RecipeMatch): GeneratedRecipe => ({
  id: match.recipe.id,
  title: match.recipe.title,
  summary: match.recipe.summary,
  mainImageUrl: match.recipe.imageUrl,
  matchedProductNames: match.matchedProductNames,
  missingIngredients: match.missingIngredients,
  prepMinutes: match.recipe.prepMinutes,
  cookMinutes: match.recipe.cookMinutes,
  difficulty: match.recipe.difficulty,
  nutrition: match.recipe.nutrition,
  ingredients: match.recipe.ingredients,
  steps: match.recipe.steps.map((step) => ({
    title: step.title,
    description: step.description,
  })),
  tips: match.recipe.tips,
  source: 'local-fallback',
});

export const GeneratedRecipeService = {
  buildCacheKey,

  async getOrCreateRecipeSet(products: Product[]): Promise<GeneratedRecipeSet> {
    const cacheKey = buildCacheKey(products);
    const productsSignature = buildProductsSignature(products);

    const cachedSet = await FirebaseService.getGeneratedRecipeSet(cacheKey);
    if (cachedSet) {
      return {
        ...cachedSet,
        recipes: cachedSet.recipes.map((recipe) => ({ ...recipe, source: 'cache' })),
      };
    }

    let recipes: GeneratedRecipe[] = [];

    try {
      recipes = await AiRecipeApi.generateRecipes(products, cacheKey);
    } catch (backendError) {
      console.warn('Backend recipe generation unavailable, falling back to local recipes:', backendError);
      recipes = RecipeService.getRecipesForProducts(products)
        .slice(0, 8)
        .map(mapRecipeMatchToGeneratedRecipe);
    }

    const normalizedRecipes = recipes.map((recipe) => ({
      ...recipe,
      source: recipe.source || 'generated',
    }));

    const recipeSet: GeneratedRecipeSet = {
      cacheKey,
      productsSignature,
      recipes: normalizedRecipes,
      createdAt: new Date().toISOString(),
    };

    await FirebaseService.saveGeneratedRecipeSet(recipeSet);
    return recipeSet;
  },
};
