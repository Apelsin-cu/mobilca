import { Product, ProductCategory } from '../types/Product';
import { getDaysUntilExpiry } from './productDate';

export interface RecipeSuggestion {
  id: string;
  title: string;
  description: string;
  productNames: string[];
  urgency: 'expired' | 'soon' | 'fresh';
}

const CATEGORY_RECIPE_LIBRARY: Record<
  ProductCategory,
  Array<{ title: string; description: string }>
> = {
  fruits: [
    {
      title: 'Фруктовый салат',
      description: 'Нарежьте фрукты и подайте как быстрый легкий перекус.',
    },
    {
      title: 'Смузи',
      description: 'Смешайте фрукты с йогуртом, молоком или водой в блендере.',
    },
    {
      title: 'Запеченные фрукты',
      description: 'Подойдут для яблок, груш и других мягких фруктов.',
    },
  ],
  vegetables: [
    {
      title: 'Овощное рагу',
      description: 'Соберите в одну сковороду все овощи, которые пора использовать.',
    },
    {
      title: 'Теплый салат',
      description: 'Быстрый способ использовать огурцы, томаты, зелень и сыр.',
    },
    {
      title: 'Овощной суп',
      description: 'Удобный вариант, если овощей осталось понемногу.',
    },
  ],
  dairy: [
    {
      title: 'Запеканка',
      description: 'Подходит для молочных продуктов, которые нужно использовать скорее.',
    },
    {
      title: 'Сырники или оладьи',
      description: 'Хороший вариант для творога, кефира и йогурта.',
    },
    {
      title: 'Сливочный соус',
      description: 'Можно быстро использовать сливки, сыр или сметану.',
    },
  ],
  meat: [
    {
      title: 'Паста с мясом',
      description: 'Быстрое горячее блюдо, если мясо нужно использовать в ближайшее время.',
    },
    {
      title: 'Тушеное мясо с овощами',
      description: 'Хорошо собирает вместе мясо и овощи с близким сроком.',
    },
    {
      title: 'Суп с мясом',
      description: 'Удобный способ использовать мясо и овощи в одном блюде.',
    },
  ],
  beverages: [
    {
      title: 'Коктейль',
      description: 'Смешайте напиток с фруктами или льдом для быстрого варианта.',
    },
    {
      title: 'Холодный десерт',
      description: 'Некоторые напитки удобно использовать как основу для десерта.',
    },
    {
      title: 'Маринад или соус',
      description: 'Напитки вроде йогурта или томатного сока можно пустить в готовку.',
    },
  ],
  bakery: [
    {
      title: 'Горячие бутерброды',
      description: 'Простой способ использовать хлеб, сыр и колбасу.',
    },
    {
      title: 'Гренки',
      description: 'Подойдут, если хлеб уже не совсем свежий, но еще пригоден.',
    },
    {
      title: 'Хлебная запеканка',
      description: 'Помогает использовать выпечку и молочные продукты вместе.',
    },
  ],
  snacks: [
    {
      title: 'Домашний десерт',
      description: 'Используйте снеки как основу или дополнение к простому десерту.',
    },
    {
      title: 'Сладкая тарелка',
      description: 'Объедините снеки, фрукты и йогурт в быстрый вариант перекуса.',
    },
    {
      title: 'Добавка к завтраку',
      description: 'Хлопья, печенье и сладости можно добавить в кашу или йогурт.',
    },
  ],
  frozen: [
    {
      title: 'Быстрая сковорода',
      description: 'Замороженные продукты удобно быстро приготовить с овощами и соусом.',
    },
    {
      title: 'Горячее на ужин',
      description: 'Соберите замороженные продукты в одно простое блюдо.',
    },
    {
      title: 'Запекание в духовке',
      description: 'Удобно для полуфабрикатов и овощных смесей.',
    },
  ],
  other: [
    {
      title: 'Быстрое блюдо из остатков',
      description: 'Соберите продукты с ближайшим сроком в один прием пищи.',
    },
    {
      title: 'Домашний перекус',
      description: 'Подходит для разных продуктов, которые пора использовать.',
    },
    {
      title: 'Ужин из холодильника',
      description: 'Сфокусируйтесь на продуктах, которые лежат ближе всего к сроку.',
    },
  ],
};

const COMBO_RECIPES = [
  {
    categories: ['vegetables', 'meat'] as ProductCategory[],
    title: 'Рагу с мясом и овощами',
    description: 'Используйте овощи и мясо, которые пора приготовить в первую очередь.',
  },
  {
    categories: ['bakery', 'dairy'] as ProductCategory[],
    title: 'Горячие бутерброды',
    description: 'Быстрый вариант, если дома есть хлеб, сыр или молочные продукты.',
  },
  {
    categories: ['fruits', 'dairy'] as ProductCategory[],
    title: 'Фруктовый десерт или смузи',
    description: 'Хорошо помогает использовать фрукты и йогурт до окончания срока.',
  },
  {
    categories: ['vegetables', 'dairy'] as ProductCategory[],
    title: 'Теплый салат с сыром',
    description: 'Подходит, если нужно быстро использовать овощи и сыр.',
  },
];

const getUrgency = (days: number): 'expired' | 'soon' | 'fresh' => {
  if (!Number.isNaN(days) && days < 0) return 'expired';
  if (!Number.isNaN(days) && days <= 3) return 'soon';
  return 'fresh';
};

const uniqueProductNames = (products: Product[]) =>
  Array.from(new Set(products.map((product) => product.name.trim()).filter(Boolean)));

const getPrimaryProducts = (products: Product[]) => {
  return [...products]
    .sort((first, second) => getDaysUntilExpiry(first.expiryDate) - getDaysUntilExpiry(second.expiryDate))
    .slice(0, 3);
};

const getMatchedComboRecipe = (products: Product[]) => {
  const categories = new Set(products.map((product) => product.category as ProductCategory));
  return COMBO_RECIPES.find((recipe) => recipe.categories.every((category) => categories.has(category)));
};

export const buildRecipeSuggestions = (products: Product[]): RecipeSuggestion[] => {
  if (!products.length) return [];

  const actionableProducts = [...products]
    .filter((product) => Boolean(product.name))
    .sort((first, second) => getDaysUntilExpiry(first.expiryDate) - getDaysUntilExpiry(second.expiryDate));

  const priorityProducts =
    actionableProducts.filter((product) => {
      const days = getDaysUntilExpiry(product.expiryDate);
      return !Number.isNaN(days) && days <= 3;
    }).length > 0
      ? actionableProducts.filter((product) => {
          const days = getDaysUntilExpiry(product.expiryDate);
          return !Number.isNaN(days) && days <= 3;
        })
      : actionableProducts.slice(0, 4);

  if (!priorityProducts.length) return [];

  const suggestions: RecipeSuggestion[] = [];
  const comboRecipe = getMatchedComboRecipe(priorityProducts);

  if (comboRecipe) {
    const comboProducts = priorityProducts.filter((product) =>
      comboRecipe.categories.includes(product.category as ProductCategory)
    );
    const comboDays = comboProducts.map((product) => getDaysUntilExpiry(product.expiryDate));

    suggestions.push({
      id: `combo-${comboRecipe.title}`,
      title: comboRecipe.title,
      description: comboRecipe.description,
      productNames: uniqueProductNames(getPrimaryProducts(comboProducts)),
      urgency: getUrgency(Math.min(...comboDays)),
    });
  }

  const categoriesInUse = Array.from(
    new Set(priorityProducts.map((product) => product.category as ProductCategory))
  );

  for (const category of categoriesInUse) {
    if (suggestions.length >= 3) break;

    const categoryProducts = priorityProducts.filter(
      (product) => (product.category as ProductCategory) === category
    );

    if (!categoryProducts.length) continue;

    const recipePool = CATEGORY_RECIPE_LIBRARY[category] || CATEGORY_RECIPE_LIBRARY.other;
    const recipe = recipePool[suggestions.length % recipePool.length];
    const categoryDays = categoryProducts.map((product) => getDaysUntilExpiry(product.expiryDate));

    suggestions.push({
      id: `${category}-${recipe.title}`,
      title: recipe.title,
      description: recipe.description,
      productNames: uniqueProductNames(getPrimaryProducts(categoryProducts)),
      urgency: getUrgency(Math.min(...categoryDays)),
    });
  }

  return suggestions.slice(0, 3);
};

