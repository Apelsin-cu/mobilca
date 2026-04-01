import { ProductCategory, ProductDateSource } from '../types/Product';
import { normalizeScannedBarcode } from '../utils/barcode';
import { normalizeExpiryDate, parseProductDate } from '../utils/productDate';

interface ProductData {
  name: string;
  brand: string;
  category: ProductCategory;
  expiryDate: string;
  expiryDateSource: ProductDateSource;
  manufactureDate?: string;
  manufactureDateSource?: ProductDateSource;
  imageUrl: string;
  isFromApi: boolean; // Флаг, что данные получены из API
  purchaseLocation?: string; // Магазин из API
}

// Маппинг категорий OpenFoodFacts на наши категории
const mapCategory = (categories: string, productName: string = ''): ProductCategory => {
  const lowerCategories = categories.toLowerCase();
  const lowerName = productName.toLowerCase();
  const searchText = lowerCategories + ' ' + lowerName;
  
  console.log('mapCategory searching in:', searchText.substring(0, 500));
  
  // Молочные продукты (расширенный список)
  if (searchText.includes('dairy') || searchText.includes('milk') || searchText.includes('молок') || 
      searchText.includes('йогурт') || searchText.includes('yogurt') || searchText.includes('yoghurt') ||
      searchText.includes('cheese') || searchText.includes('сыр') || searchText.includes('кефир') || 
      searchText.includes('сметан') || searchText.includes('творог') || searchText.includes('butter') || 
      searchText.includes('масл') || searchText.includes('cream') || searchText.includes('сливк') || 
      searchText.includes('ряженк') || searchText.includes('простокваш') || searchText.includes('айран') || 
      searchText.includes('биолакт') || searchText.includes('dairies') || searchText.includes('lait') ||
      searchText.includes('fromage') || searchText.includes('milch') || searchText.includes('käse') ||
      searchText.includes('fermented') || searchText.includes('lactose') || searchText.includes('probiot') ||
      searchText.includes('бифидо') || searchText.includes('снежок') || searchText.includes('варенец') ||
      searchText.includes('acidophilus') || searchText.includes('ацидофил')) {
    console.log('Matched: dairy');
    return 'dairy';
  }
  
  // Фрукты
  if (searchText.includes('fruit') || searchText.includes('фрукт') || searchText.includes('apple') || 
      searchText.includes('яблок') || searchText.includes('banana') || searchText.includes('банан') ||
      searchText.includes('orange') || searchText.includes('апельсин') || searchText.includes('lemon') ||
      searchText.includes('лимон') || searchText.includes('груш') || searchText.includes('pear') ||
      searchText.includes('виноград') || searchText.includes('grape') || searchText.includes('манго') ||
      searchText.includes('mango') || searchText.includes('ананас') || searchText.includes('pineapple') ||
      searchText.includes('персик') || searchText.includes('peach') || searchText.includes('слив') ||
      searchText.includes('plum') || searchText.includes('абрикос') || searchText.includes('apricot') ||
      searchText.includes('ягод') || searchText.includes('berry') || searchText.includes('клубник') ||
      searchText.includes('strawberry') || searchText.includes('малин') || searchText.includes('raspberry') ||
      searchText.includes('черник') || searchText.includes('blueberry') || searchText.includes('вишн') ||
      searchText.includes('cherry') || searchText.includes('киви') || searchText.includes('kiwi')) {
    console.log('Matched: fruits');
    return 'fruits';
  }
  
  // Овощи
  if (searchText.includes('vegetable') || searchText.includes('овощ') || searchText.includes('tomato') ||
      searchText.includes('помидор') || searchText.includes('cucumber') || searchText.includes('огурц') ||
      searchText.includes('carrot') || searchText.includes('морков') || searchText.includes('potato') ||
      searchText.includes('картоф') || searchText.includes('onion') || searchText.includes('лук') ||
      searchText.includes('капуст') || searchText.includes('cabbage') || searchText.includes('перец') ||
      searchText.includes('pepper') || searchText.includes('баклажан') || searchText.includes('eggplant') ||
      searchText.includes('кабачок') || searchText.includes('zucchini') || searchText.includes('свекл') ||
      searchText.includes('beet') || searchText.includes('редис') || searchText.includes('radish') ||
      searchText.includes('салат') || searchText.includes('lettuce') || searchText.includes('зелен') ||
      searchText.includes('укроп') || searchText.includes('dill') || searchText.includes('петрушк') ||
      searchText.includes('parsley') || searchText.includes('шпинат') || searchText.includes('spinach')) {
    console.log('Matched: vegetables');
    return 'vegetables';
  }
  
  // Мясо
  if (searchText.includes('meat') || searchText.includes('мяс') || searchText.includes('chicken') || 
      searchText.includes('кур') || searchText.includes('колбас') || searchText.includes('sausage') ||
      searchText.includes('beef') || searchText.includes('говядин') || searchText.includes('pork') ||
      searchText.includes('свинин') || searchText.includes('ветчин') || searchText.includes('ham') ||
      searchText.includes('сосис') || searchText.includes('frankfurter') || searchText.includes('бекон') ||
      searchText.includes('bacon') || searchText.includes('фарш') || searchText.includes('minced') ||
      searchText.includes('индейк') || searchText.includes('turkey') || searchText.includes('утк') ||
      searchText.includes('duck') || searchText.includes('рыб') || searchText.includes('fish') ||
      searchText.includes('seafood') || searchText.includes('морепродукт') || searchText.includes('креветк') ||
      searchText.includes('shrimp') || searchText.includes('лосось') || searchText.includes('salmon') ||
      searchText.includes('тунец') || searchText.includes('tuna') || searchText.includes('сельдь') ||
      searchText.includes('herring') || searchText.includes('паштет') || searchText.includes('pate')) {
    console.log('Matched: meat');
    return 'meat';
  }
  
  // Напитки
  if (searchText.includes('beverage') || searchText.includes('drink') || searchText.includes('juice') || 
      searchText.includes('напит') || searchText.includes('сок') || searchText.includes('вода') || 
      searchText.includes('water') || searchText.includes('cola') || searchText.includes('лимонад') ||
      searchText.includes('tea') || searchText.includes('чай') || searchText.includes('coffee') ||
      searchText.includes('кофе') || searchText.includes('газиров') || searchText.includes('carbonated') ||
      searchText.includes('энергет') || searchText.includes('energy') || searchText.includes('морс') ||
      searchText.includes('компот') || searchText.includes('квас') || searchText.includes('пиво') ||
      searchText.includes('beer') || searchText.includes('вино') || searchText.includes('wine')) {
    console.log('Matched: beverages');
    return 'beverages';
  }
  
  // Выпечка
  if (searchText.includes('bread') || searchText.includes('bakery') || searchText.includes('хлеб') || 
      searchText.includes('выпечк') || searchText.includes('булк') || searchText.includes('батон') ||
      searchText.includes('багет') || searchText.includes('пирог') || searchText.includes('cake') ||
      searchText.includes('торт') || searchText.includes('круассан') || searchText.includes('croissant') ||
      searchText.includes('пончик') || searchText.includes('donut') || searchText.includes('кекс') ||
      searchText.includes('muffin') || searchText.includes('рулет') || searchText.includes('roll') ||
      searchText.includes('сдоб') || searchText.includes('pastry') || searchText.includes('лаваш') ||
      searchText.includes('пита') || searchText.includes('pita') || searchText.includes('тост') ||
      searchText.includes('toast')) {
    console.log('Matched: bakery');
    return 'bakery';
  }
  
  // Снеки
  if (searchText.includes('snack') || searchText.includes('chips') || searchText.includes('чипс') || 
      searchText.includes('cookie') || searchText.includes('печень') || searchText.includes('конфет') || 
      searchText.includes('шоколад') || searchText.includes('chocolate') || searchText.includes('candy') ||
      searchText.includes('вафл') || searchText.includes('cracker') || searchText.includes('крекер') ||
      searchText.includes('орех') || searchText.includes('nut') || searchText.includes('семечк') ||
      searchText.includes('seed') || searchText.includes('сухарик') || searchText.includes('попкорн') ||
      searchText.includes('popcorn') || searchText.includes('батончик') || searchText.includes('bar') ||
      searchText.includes('мармелад') || searchText.includes('зефир') || searchText.includes('пастил') ||
      searchText.includes('халва') || searchText.includes('козинак')) {
    console.log('Matched: snacks');
    return 'snacks';
  }
  
  // Замороженные
  if (searchText.includes('frozen') || searchText.includes('замороженн') || searchText.includes('мороженое') || 
      searchText.includes('ice cream') || searchText.includes('пельмен') || searchText.includes('варени') ||
      searchText.includes('полуфабрикат') || searchText.includes('котлет') || searchText.includes('блинчик') ||
      searchText.includes('наггетс') || searchText.includes('nuggets') || searchText.includes('пицца') ||
      searchText.includes('pizza')) {
    console.log('Matched: frozen');
    return 'frozen';
  }
  
  console.log('No match found, returning: other');
  return 'other';
};

// Типичные сроки годности по категориям (в днях)
const DEFAULT_EXPIRY_DAYS: Record<ProductCategory, number> = {
  fruits: 7,
  vegetables: 7,
  dairy: 14,  // Молочные продукты - 14 дней
  meat: 5,
  beverages: 180,
  bakery: 5,
  snacks: 90,
  frozen: 180,
  other: 30,
};

// Более точные сроки для молочных продуктов
const getDairyExpiryDays = (productName: string): number => {
  const name = productName.toLowerCase();
  
  if (name.includes('молоко') || name.includes('milk')) return 7;
  if (name.includes('кефир')) return 14;
  if (name.includes('йогурт') || name.includes('yogurt')) return 21;
  if (name.includes('сметан')) return 14;
  if (name.includes('творог')) return 7;
  if (name.includes('сыр') || name.includes('cheese')) return 30;
  if (name.includes('масло') || name.includes('butter')) return 30;
  if (name.includes('сливки') || name.includes('cream')) return 7;
  
  return 14; // По умолчанию для молочки
};

// Получить дату истечения срока (сегодня + дни)
const getDefaultExpiryDate = (
  category: ProductCategory,
  productName: string = '',
  manufactureDate?: string
): string => {
  const baseDate = parseProductDate(manufactureDate) || new Date();
  const date = new Date(baseDate);
  
  // Для молочных продуктов используем более точные сроки
  let days = DEFAULT_EXPIRY_DAYS[category];
  if (category === 'dairy' && productName) {
    days = getDairyExpiryDays(productName);
  }
  
  date.setDate(date.getDate() + days);
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return normalizeExpiryDate(`${day}.${month}.${year}`);
};

const extractManufactureDate = (product: Record<string, any>): string => {
  const candidates = [
    product.production_date,
    product.manufacturing_date,
    product.production_datetime,
    product.packaging_date,
  ];

  for (const candidate of candidates) {
    const normalized = formatApiDate(candidate);
    if (normalized) {
      return normalized;
    }
  }

  return '';
};

export const OpenFoodFactsAPI = {
  async getProductByBarcode(rawBarcode: string): Promise<ProductData | null> {
    try {
      const barcode = normalizeScannedBarcode(rawBarcode);
      if (!barcode) {
        return null;
      }

      console.log('Fetching product:', barcode);
      const response = await fetch(`https://world.openfoodfacts.org/api/v3/product/${barcode}.json`);
      const data = await response.json();
      
      console.log('API Response status:', data.status);
      console.log('Full API response:', JSON.stringify(data.product, null, 2).substring(0, 2000));
      
      if (data?.status === 1 && data.product) {
        const product = data.product;
        const productName =
          product.product_name_ru ||
          product.product_name ||
          product.product_name_en ||
          'Неизвестный продукт';
        
        // Собираем все возможные категории для определения
        const categoriesText = [
          product.categories || '',
          product.categories_tags?.join(' ') || '',
          product.categories_hierarchy?.join(' ') || '',
          product.pnns_groups_1 || '',
          product.pnns_groups_2 || '',
          product.food_groups || '',
          product.food_groups_tags?.join(' ') || '',
        ].join(' ');
        
        console.log('Categories text for mapping:', categoriesText);
        
        const category = mapCategory(categoriesText, productName);
        
        console.log('Product name:', productName);
        console.log('Mapped category:', category);
        
        const manufactureDate = extractManufactureDate(product);
        let manufactureDateSource: ProductDateSource | undefined = manufactureDate
          ? 'api'
          : undefined;
        let expiryDate = '';
        let expiryDateSource: ProductDateSource = 'manual';
        
        // Пробуем найти срок годности в разных полях API
        if (product.expiration_date) {
          console.log('Found expiration_date:', product.expiration_date);
          expiryDate = formatApiDate(product.expiration_date);
          expiryDateSource = expiryDate ? 'api' : 'manual';
        } else if (product.best_before_date) {
          console.log('Found best_before_date:', product.best_before_date);
          expiryDate = formatApiDate(product.best_before_date);
          expiryDateSource = expiryDate ? 'api' : 'manual';
        } else if (manufactureDate) {
          expiryDate = getDefaultExpiryDate(category, productName, manufactureDate);
          expiryDateSource = expiryDate ? 'calculated' : 'manual';
        }
        
        // Магазины из API - проверяем несколько полей
        let purchaseLocation = '';
        if (product.stores) {
          purchaseLocation = formatStores(product.stores);
          console.log('Found stores:', purchaseLocation);
        } else if (product.stores_tags && product.stores_tags.length > 0) {
          purchaseLocation = formatStores(product.stores_tags.join(', '));
          console.log('Found stores_tags:', purchaseLocation);
        } else if (product.purchase_places) {
          purchaseLocation = formatStores(product.purchase_places);
          console.log('Found purchase_places:', purchaseLocation);
        }
        
        console.log('Final expiry date:', expiryDate);
        console.log('Final purchase location:', purchaseLocation);
        
        return {
          name: productName,
          brand: product.brands || '',
          category,
          expiryDate,
          expiryDateSource,
          manufactureDate: manufactureDate || undefined,
          manufactureDateSource,
          imageUrl: product.image_url || product.image_front_url || '',
          isFromApi: true,
          purchaseLocation,
        };
      }
      console.log('Product not found in API');
      return null;
    } catch (error) {
      console.error('OpenFoodFacts API error:', error);
      return null;
    }
  },
  
  // Получить дефолтный срок годности для категории
  getDefaultExpiryForCategory(
    category: ProductCategory,
    manufactureDate?: string,
    productName: string = ''
  ): string {
    return getDefaultExpiryDate(category, productName, manufactureDate);
  },
};

// Форматирование списка магазинов
const formatStores = (stores: string): string => {
  if (!stores) return '';
  
  // Разбиваем по запятым и берем первый магазин (или форматируем список)
  const storeList = stores.split(',').map(s => s.trim()).filter(s => s);
  
  if (storeList.length === 0) return '';
  
  // Возвращаем первый магазин (обычно основной)
  // Приводим к более читаемому виду
  let store = storeList[0];
  
  // Убираем лишние символы и форматируем
  store = store.replace(/[-_]/g, ' ');
  
  // Капитализация первой буквы
  store = store.charAt(0).toUpperCase() + store.slice(1).toLowerCase();
  
  return store;
};

// Форматирование даты из API в DD.MM.YYYY
const formatApiDate = (dateStr: string): string => {
  if (!dateStr) return '';
  
  // Пробуем разные форматы
  // YYYY-MM-DD
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return normalizeExpiryDate(dateStr);
  }
  
  // DD/MM/YYYY
  if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    return normalizeExpiryDate(dateStr.replace(/\//g, '.'));
  }
  
  // DD.MM.YYYY - уже в нужном формате
  if (dateStr.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
    return normalizeExpiryDate(dateStr);
  }
  
  return normalizeExpiryDate(dateStr);
};

