import { RECIPES } from '../data/recipes';
import { Product } from '../types/Product';
import { Recipe, RecipeMatch } from '../types/Recipe';
import { getDaysUntilExpiry } from '../utils/productDate';

const normalize = (value: string) => value.trim().toLowerCase();

const inferUrgency = (products: Product[]): RecipeMatch['urgency'] => {
  const days = products
    .map((product) => getDaysUntilExpiry(product.expiryDate))
    .filter((value) => !Number.isNaN(value));

  if (!days.length) return 'fresh';

  const minDays = Math.min(...days);
  if (minDays < 0) return 'expired';
  if (minDays <= 3) return 'soon';
  return 'fresh';
};

const findMatchesForRecipe = (recipe: Recipe, products: Product[]) => {
  const matchedProducts = products.filter((product) => {
    const normalizedName = normalize(product.name);
    return recipe.ingredientKeywords.some((keyword) => normalizedName.includes(normalize(keyword)));
  });

  const matchedNames = Array.from(new Set(matchedProducts.map((product) => product.name)));
  const matchedKeywords = recipe.ingredientKeywords.filter((keyword) =>
    matchedProducts.some((product) => normalize(product.name).includes(normalize(keyword)))
  );

  const score = matchedKeywords.length / recipe.ingredientKeywords.length;

  return {
    matchedProducts,
    matchedNames,
    missingIngredients: recipe.ingredientKeywords.filter(
      (keyword) => !matchedKeywords.includes(keyword)
    ),
    score,
  };
};

export const RecipeService = {
  getAllRecipes(): Recipe[] {
    return RECIPES;
  },

  getRecipesForProducts(products: Product[]): RecipeMatch[] {
    return RECIPES.map((recipe) => {
      const match = findMatchesForRecipe(recipe, products);

      return {
        recipe,
        matchedProductNames: match.matchedNames,
        missingIngredients: match.missingIngredients,
        score: match.score,
        urgency: inferUrgency(match.matchedProducts),
      } as RecipeMatch;
    })
      .filter((recipeMatch) => recipeMatch.matchedProductNames.length > 0)
      .sort((first, second) => {
        if (second.score !== first.score) {
          return second.score - first.score;
        }

        const urgencyRank = { expired: 0, soon: 1, fresh: 2 };
        return urgencyRank[first.urgency] - urgencyRank[second.urgency];
      });
  },
};
