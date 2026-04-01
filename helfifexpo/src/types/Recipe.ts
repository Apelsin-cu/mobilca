export type RecipeDifficulty = 'Легко' | 'Средне' | 'Сложно';

export interface RecipeNutrition {
  calories: number;
  proteins: number;
  fats: number;
  carbs: number;
}

export interface RecipeStep {
  title: string;
  description: string;
}

export interface Recipe {
  id: string;
  title: string;
  summary: string;
  imageUrl?: string;
  categories: string[];
  ingredientKeywords: string[];
  ingredients: string[];
  steps: RecipeStep[];
  prepMinutes: number;
  cookMinutes: number;
  difficulty: RecipeDifficulty;
  nutrition: RecipeNutrition;
  tips: string[];
}

export interface RecipeMatch {
  recipe: Recipe;
  matchedProductNames: string[];
  missingIngredients: string[];
  score: number;
  urgency: 'expired' | 'soon' | 'fresh';
}
