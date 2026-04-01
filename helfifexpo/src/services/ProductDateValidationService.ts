import { ProductCategory, ProductDateSource } from '../types/Product';
import { getDaysUntilExpiry, parseProductDate } from '../utils/productDate';

export type DateConfidence = 'high' | 'medium' | 'low';
export type DateValidationSeverity = 'info' | 'warning';

export interface DateValidationMessage {
  severity: DateValidationSeverity;
  text: string;
}

export interface ProductDateValidationResult {
  confidence: DateConfidence;
  messages: DateValidationMessage[];
}

const MAX_SHELF_LIFE_DAYS: Record<ProductCategory, number> = {
  fruits: 45,
  vegetables: 60,
  dairy: 60,
  meat: 45,
  beverages: 730,
  bakery: 30,
  snacks: 730,
  frozen: 730,
  other: 730,
};

const getConfidenceBySource = (source?: ProductDateSource): DateConfidence => {
  if (source === 'ocr') return 'high';
  if (source === 'api') return 'medium';
  return 'low';
};

export const ProductDateValidationService = {
  validate({
    category,
    manufactureDate,
    expiryDate,
    manufactureDateSource,
    expiryDateSource,
    apiManufactureDate,
    apiExpiryDate,
  }: {
    category: ProductCategory;
    manufactureDate?: string;
    expiryDate?: string;
    manufactureDateSource?: ProductDateSource;
    expiryDateSource?: ProductDateSource;
    apiManufactureDate?: string;
    apiExpiryDate?: string;
  }): ProductDateValidationResult {
    const messages: DateValidationMessage[] = [];
    const manufacture = parseProductDate(manufactureDate);
    const expiry = parseProductDate(expiryDate);

    let confidence = getConfidenceBySource(expiryDateSource || manufactureDateSource);

    if (expiryDateSource === 'manual') {
      messages.push({
        severity: 'info',
        text: 'Дата срока годности введена вручную. Проверьте упаковку перед сохранением.',
      });
    }

    if (expiryDateSource === 'api') {
      messages.push({
        severity: 'info',
        text: 'Дата из API считается подсказкой, а не подтверждением для конкретной упаковки.',
      });
    }

    if (manufacture && manufacture.getTime() > Date.now() + 1000 * 60 * 60 * 24) {
      messages.push({
        severity: 'warning',
        text: 'Дата изготовления выглядит как будущая. Проверьте распознавание или введите её вручную.',
      });
      confidence = 'low';
    }

    if (manufacture && expiry && manufacture.getTime() > expiry.getTime()) {
      messages.push({
        severity: 'warning',
        text: 'Дата изготовления позже срока годности. Одна из дат заполнена неверно.',
      });
      confidence = 'low';
    }

    if (manufacture && expiry) {
      const shelfLifeDays = Math.round(
        (expiry.getTime() - manufacture.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (shelfLifeDays > MAX_SHELF_LIFE_DAYS[category]) {
        messages.push({
          severity: 'warning',
          text: 'Разница между датой изготовления и сроком годности необычно большая для этой категории.',
        });
        if (confidence === 'high') {
          confidence = 'medium';
        } else {
          confidence = 'low';
        }
      }
    }

    if (
      expiryDateSource === 'ocr' &&
      apiExpiryDate &&
      expiryDate &&
      apiExpiryDate !== expiryDate
    ) {
      messages.push({
        severity: 'warning',
        text: 'Дата с упаковки не совпадает с датой из API. Для конкретной упаковки лучше доверять OCR.',
      });
      confidence = 'high';
    }

    if (
      manufactureDateSource === 'ocr' &&
      apiManufactureDate &&
      manufactureDate &&
      apiManufactureDate !== manufactureDate
    ) {
      messages.push({
        severity: 'warning',
        text: 'Дата изготовления с упаковки не совпадает с датой из API.',
      });
    }

    const expiryDays = getDaysUntilExpiry(expiryDate);
    if (!Number.isNaN(expiryDays) && expiryDays < -30) {
      messages.push({
        severity: 'warning',
        text: 'Срок годности уже давно истёк. Проверьте, не была ли дата считана неверно.',
      });
      confidence = 'low';
    }

    return {
      confidence,
      messages,
    };
  },
};
