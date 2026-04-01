export interface GeneratedRecipeStep {
  title: string;
  description: string;
  imageUrl?: string;
}

export interface GeneratedRecipeNutrition {
  calories: number;
  proteins: number;
  fats: number;
  carbs: number;
}

export interface GeneratedRecipe {
  id: string;
  title: string;
  summary: string;
  mainImageUrl?: string;
  matchedProductNames: string[];
  missingIngredients: string[];
  prepMinutes: number;
  cookMinutes: number;
  difficulty: string;
  nutrition: GeneratedRecipeNutrition;
  ingredients: string[];
  steps: GeneratedRecipeStep[];
  tips: string[];
  source: 'cache' | 'generated' | 'local-fallback';
}

export interface GeneratedRecipeSet {
  cacheKey: string;
  productsSignature: string[];
  recipes: GeneratedRecipe[];
  createdAt: string;
}
