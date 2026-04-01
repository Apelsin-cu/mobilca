export interface Product {
  id: string;
  name: string;
  barcode: string;
  expiryDate: string;
  expiryDateSource?: ProductDateSource;
  manufactureDate?: string;
  manufactureDateSource?: ProductDateSource;
  category: string;
  quantity: number;
  imageUrl?: string;
  addedAt: string;
  brand?: string;
  purchaseLocation?: string;
}

export type ProductDateSource =
  | 'api'
  | 'ocr'
  | 'manual'
  | 'calculated'
  | 'unknown';

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

export const CATEGORY_NAMES: Record<ProductCategory, string> = {
  fruits: 'Фрукты',
  vegetables: 'Овощи',
  dairy: 'Молочные продукты',
  meat: 'Мясо',
  beverages: 'Напитки',
  bakery: 'Выпечка',
  snacks: 'Снеки',
  frozen: 'Заморозка',
  other: 'Другое',
};

export const PRODUCT_DATE_SOURCE_LABELS: Record<ProductDateSource, string> = {
  api: 'Из API',
  ocr: 'Считано с упаковки',
  manual: 'Введено вручную',
  calculated: 'Рассчитано примерно',
  unknown: 'Источник не указан',
};

export const CATEGORY_ART: Record<
  ProductCategory,
  {
    background: string;
    accent: string;
    bubble: string;
    textOnColor: string;
  }
> = {
  fruits: {
    background: '#FDE9E7',
    accent: '#F28A7A',
    bubble: '#FFD5CC',
    textOnColor: '#6B2A24',
  },
  vegetables: {
    background: '#E8F4EA',
    accent: '#79B58B',
    bubble: '#CFE7D6',
    textOnColor: '#24452E',
  },
  dairy: {
    background: '#E9F1FB',
    accent: '#8CB6E8',
    bubble: '#D6E6FB',
    textOnColor: '#264564',
  },
  meat: {
    background: '#F8E6E8',
    accent: '#D98A95',
    bubble: '#F0CFD5',
    textOnColor: '#6A2C35',
  },
  beverages: {
    background: '#FFF0DC',
    accent: '#E6B06D',
    bubble: '#FFE0B8',
    textOnColor: '#6D4716',
  },
  bakery: {
    background: '#F7EEDF',
    accent: '#D9B17A',
    bubble: '#EFD8B3',
    textOnColor: '#6B4B24',
  },
  snacks: {
    background: '#F7E9F3',
    accent: '#D89BC2',
    bubble: '#EFCFE1',
    textOnColor: '#66304E',
  },
  frozen: {
    background: '#E7F4F8',
    accent: '#8EC9D6',
    bubble: '#CFE7EE',
    textOnColor: '#234A54',
  },
  other: {
    background: '#EEF1F5',
    accent: '#B7C0CB',
    bubble: '#DDE2E8',
    textOnColor: '#3C4754',
  },
};
