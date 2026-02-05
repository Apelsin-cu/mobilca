export interface Product {
  id: string;
  name: string;
  barcode: string;
  expiryDate: string;
  category: string;
  quantity: number;
  imageUrl?: string;
  addedAt: string;
  brand?: string;
  purchaseLocation?: string; // Где был куплен продукт
}

export type ProductCategory = 
  | 'fruits'
  | 'vegetables'
  | 'dairy'
  | 'meat'
  | 'beverages'
  | 'bakery'
  | 'snacks'
  | 'frozen'
  | 'other';

export const CATEGORY_ICONS: Record<ProductCategory, string> = {
  fruits: '🍎',
  vegetables: '🥦',
  dairy: '🥛',
  meat: '🥩',
  beverages: '🧃',
  bakery: '🍞',
  snacks: '🍪',
  frozen: '🧊',
  other: '📦',
};

export const CATEGORY_COLORS: Record<ProductCategory, string> = {
  fruits: '#FF6B6B',
  vegetables: '#4ECDC4',
  dairy: '#95E1D3',
  meat: '#F38181',
  beverages: '#FCE38A',
  bakery: '#EAFFD0',
  snacks: '#FFB6B9',
  frozen: '#A8D8EA',
  other: '#CFCFCF',
};

export const CATEGORY_NAMES: Record<ProductCategory, string> = {
  fruits: 'Фрукты',
  vegetables: 'Овощи',
  dairy: 'Молочные',
  meat: 'Мясо',
  beverages: 'Напитки',
  bakery: 'Выпечка',
  snacks: 'Снеки',
  frozen: 'Заморозка',
  other: 'Другое',
};

