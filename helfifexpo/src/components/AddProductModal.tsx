import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  CATEGORY_ICONS,
  CATEGORY_NAMES,
  Product,
  ProductCategory,
  ProductDateSource,
  PRODUCT_DATE_SOURCE_LABELS,
} from '../types/Product';
import DateScannerModal, { buildDetectedDateSummary } from './DateScannerModal';
import { DateOcrService, OcrScanResult } from '../services/DateOcrService';
import { OpenFoodFactsAPI } from '../services/OpenFoodFactsAPI';
import { ProductDateValidationService } from '../services/ProductDateValidationService';
import {
  formatExpiryDateForDisplay,
  normalizeExpiryDate,
} from '../utils/productDate';

interface AddProductModalProps {
  initialData?: Partial<Product> & { isFromApi?: boolean };
  barcode: string;
  onSave: (product: Omit<Product, 'id'>) => void;
  onClose: () => void;
  submitLabel?: string;
  title?: string;
}

const CATEGORIES: ProductCategory[] = [
  'fruits',
  'vegetables',
  'dairy',
  'meat',
  'beverages',
  'bakery',
  'snacks',
  'frozen',
  'other',
];

const AddProductModal: React.FC<AddProductModalProps> = ({
  initialData,
  barcode,
  onSave,
  onClose,
  submitLabel = 'Сохранить',
  title,
}) => {
  const isFromApi = initialData?.isFromApi || false;
  const isManualEntry = barcode.startsWith('MANUAL-');
  const isEditing = Boolean(initialData?.id);
  const [name, setName] = useState(initialData?.name || '');
  const [category, setCategory] = useState<ProductCategory>(
    (initialData?.category as ProductCategory) ||
      (isManualEntry ? 'vegetables' : 'other')
  );
  const [manufactureDate, setManufactureDate] = useState(
    formatDateForInput(initialData?.manufactureDate || '')
  );
  const [expiryDate, setExpiryDate] = useState(
    formatDateForInput(initialData?.expiryDate || '')
  );
  const [quantity, setQuantity] = useState(initialData?.quantity?.toString() || '1');
  const [showDateScanner, setShowDateScanner] = useState(false);
  const [ocrSummary, setOcrSummary] = useState('');
  const [hasAutoOpenedOcr, setHasAutoOpenedOcr] = useState(false);
  const [manufactureDateSource, setManufactureDateSource] = useState<
    ProductDateSource | undefined
  >(initialData?.manufactureDateSource);
  const [expiryDateSource, setExpiryDateSource] = useState<ProductDateSource>(
    initialData?.expiryDateSource || 'manual'
  );
  const validation = useMemo(
    () =>
      ProductDateValidationService.validate({
        category,
        manufactureDate: convertToISO(manufactureDate),
        expiryDate: convertToISO(expiryDate),
        manufactureDateSource,
        expiryDateSource,
        apiManufactureDate: initialData?.manufactureDate,
        apiExpiryDate: initialData?.expiryDate,
      }),
    [
      category,
      expiryDate,
      expiryDateSource,
      initialData?.expiryDate,
      initialData?.manufactureDate,
      manufactureDate,
      manufactureDateSource,
    ]
  );

  useEffect(() => {
    const nextCategory =
      (initialData?.category as ProductCategory) ||
      (isManualEntry ? 'vegetables' : 'other');

    setName(initialData?.name || '');
    setCategory(nextCategory);
    setManufactureDate(formatDateForInput(initialData?.manufactureDate || ''));
    setExpiryDate(formatDateForInput(initialData?.expiryDate || ''));
    setQuantity(initialData?.quantity?.toString() || '1');
    setOcrSummary('');
    setHasAutoOpenedOcr(false);
    setManufactureDateSource(initialData?.manufactureDateSource);
    setExpiryDateSource(initialData?.expiryDateSource || 'manual');
  }, [initialData, isManualEntry]);

  useEffect(() => {
    if (isManualEntry || isEditing || hasAutoOpenedOcr || !DateOcrService.isSupported) {
      return;
    }

    setShowDateScanner(true);
    setHasAutoOpenedOcr(true);
  }, [hasAutoOpenedOcr, isEditing, isManualEntry]);

  const handleManufactureDateChange = (text: string) => {
    setManufactureDate(formatDateString(text));
    setManufactureDateSource('manual');
  };

  const handleExpiryDateChange = (text: string) => {
    setExpiryDate(formatDateString(text));
    setExpiryDateSource('manual');
  };

  const handleCalculateExpiry = () => {
    if (!manufactureDate.trim()) {
      alert('Введите дату изготовления или укажите ее вручную на упаковке');
      return;
    }

    const calculated = OpenFoodFactsAPI.getDefaultExpiryForCategory(
      category,
      convertToISO(manufactureDate),
      name.trim()
    );

    if (!calculated) {
      alert('Не удалось рассчитать дату. Введите ее вручную.');
      return;
    }

    setExpiryDate(formatDateForInput(calculated));
    setExpiryDateSource('calculated');
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert('Введите название продукта');
      return;
    }

    if (!expiryDate.trim()) {
      alert('Введите дату "Рекомендуется употребить до"');
      return;
    }

    if (
      expiryDateSource === 'ocr' &&
      initialData?.expiryDateSource === 'api' &&
      initialData?.expiryDate &&
      convertToISO(expiryDate) !== initialData.expiryDate
    ) {
      Alert.alert(
        'Подтвердите срок годности',
        `На упаковке считано ${formatDateForInput(convertToISO(expiryDate))}, а в API указано ${formatDateForInput(initialData.expiryDate)}. Подтвердите срок годности или исправьте дату вручную.`,
        [
          {
            text: 'Исправить',
            style: 'cancel',
          },
          {
            text: 'Подтвердить',
            onPress: saveProduct,
          },
        ]
      );
      return;
    }

    saveProduct();
  };

  const saveProduct = () => {
    onSave({
      name: name.trim(),
      barcode,
      category,
      manufactureDate: convertToISO(manufactureDate),
      manufactureDateSource: manufactureDate.trim()
        ? manufactureDateSource || 'manual'
        : undefined,
      expiryDate: convertToISO(expiryDate),
      expiryDateSource,
      quantity: Math.max(1, parseInt(quantity, 10) || 1),
      imageUrl: initialData?.imageUrl,
      brand: initialData?.brand,
      purchaseLocation: initialData?.purchaseLocation,
      addedAt: initialData?.addedAt || new Date().toISOString(),
    });
  };

  const handleDetectedDates = (result: OcrScanResult) => {
    if (result.manufactureDate?.isoDate) {
      setManufactureDate(formatDateForInput(result.manufactureDate.isoDate));
      setManufactureDateSource('ocr');
    }

    if (result.expiryDate?.isoDate) {
      setExpiryDate(formatDateForInput(result.expiryDate.isoDate));
      setExpiryDateSource('ocr');
    }

    setOcrSummary(buildDetectedDateSummary(result));
    setShowDateScanner(false);
  };

  const computedTitle =
    title ||
    (isEditing
      ? 'Редактирование'
      : isManualEntry
        ? 'Добавить вручную'
        : isFromApi
          ? 'Проверьте данные'
          : 'Новый продукт');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.iconButton}>
          <Ionicons name="close" size={24} color="#17191C" />
        </TouchableOpacity>
        <Text style={styles.title}>{computedTitle}</Text>
        <TouchableOpacity onPress={handleSave} style={styles.iconButton}>
          <Ionicons name="checkmark" size={24} color="#5FAF8F" />
        </TouchableOpacity>
      </View>

      {isManualEntry ? (
        <Banner
          icon="add-circle-outline"
          text="Для ручного добавления укажите реальные даты с упаковки."
          tone="soft"
        />
      ) : null}

      {manufactureDateSource && manufactureDate ? (
        <Banner
          icon="calendar-outline"
          text={`Дата изготовления: ${PRODUCT_DATE_SOURCE_LABELS[manufactureDateSource]}`}
        />
      ) : null}

      {expiryDateSource === 'api' && expiryDate ? (
        <Banner
          icon="checkmark-circle-outline"
          text='Поле "Рекомендуется употребить до" пришло из API.'
        />
      ) : null}

      {ocrSummary ? (
        <Banner
          icon="scan-outline"
          text={`Считано с упаковки: ${ocrSummary}`}
          tone="soft"
        />
      ) : null}

      {!ocrSummary && expiryDateSource === 'api' && expiryDate ? (
        <Banner
          icon="cloud-download-outline"
          text="Р”Р°С‚Р° СЃ СѓРїР°РєРѕРІРєРё РЅРµ СЂР°СЃРїРѕР·РЅР°РЅР°, РїРѕСЌС‚РѕРјСѓ РёСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ Р·РЅР°С‡РµРЅРёРµ РёР· API."
          tone="soft"
        />
      ) : null}

      {!ocrSummary && !expiryDate ? (
        <Banner
          icon="create-outline"
          text="Р”Р°С‚Р° РЅРµ РЅР°Р№РґРµРЅР° РЅРё РЅР° СѓРїР°РєРѕРІРєРµ, РЅРё РІ API. Р’РІРµРґРёС‚Рµ РµС‘ РІСЂСѓС‡РЅСѓСЋ."
          tone="warning"
        />
      ) : null}

      <Banner
        icon={
          validation.confidence === 'high'
            ? 'shield-checkmark-outline'
            : validation.confidence === 'medium'
              ? 'shield-half-outline'
              : 'warning-outline'
        }
        text={
          validation.confidence === 'high'
            ? 'Уровень доверия к дате: высокий.'
            : validation.confidence === 'medium'
              ? 'Уровень доверия к дате: средний.'
              : 'Уровень доверия к дате: низкий.'
        }
        tone={validation.confidence === 'low' ? 'warning' : 'soft'}
      />

      {validation.messages.map((message) => (
        <Banner
          key={message.text}
          icon={message.severity === 'warning' ? 'alert-circle-outline' : 'information-circle-outline'}
          text={message.text}
          tone={message.severity === 'warning' ? 'warning' : 'soft'}
        />
      ))}

      {expiryDateSource === 'calculated' && expiryDate ? (
        <Banner
          icon="sparkles-outline"
          text='Поле "Рекомендуется употребить до" рассчитано примерно. Лучше проверить упаковку.'
          tone="warning"
        />
      ) : null}

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <Field label="Название">
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Введите название продукта"
            placeholderTextColor="#9AA2AE"
          />
        </Field>

        {!isManualEntry ? (
          <Field label="Штрихкод">
            <View style={styles.infoField}>
              <Text style={styles.infoFieldText}>{barcode}</Text>
            </View>
          </Field>
        ) : null}

        <Field label="Категория">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.categoriesRow}>
              {CATEGORIES.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.categoryButton,
                    category === item && styles.categoryButtonActive,
                  ]}
                  onPress={() => setCategory(item)}
                >
                  <Text style={styles.categoryIcon}>{CATEGORY_ICONS[item]}</Text>
                  <Text
                    style={[
                      styles.categoryText,
                      category === item && styles.categoryTextActive,
                    ]}
                  >
                    {CATEGORY_NAMES[item]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </Field>

        <Field label="Дата изготовления">
          <TextInput
            style={styles.input}
            value={manufactureDate}
            onChangeText={handleManufactureDateChange}
            placeholder="ДД.ММ.ГГГГ"
            placeholderTextColor="#9AA2AE"
            keyboardType="numeric"
            maxLength={10}
          />
        </Field>

        <Field label="Рекомендуется употребить до">
          <TextInput
            style={styles.input}
            value={expiryDate}
            onChangeText={handleExpiryDateChange}
            placeholder="ДД.ММ.ГГГГ"
            placeholderTextColor="#9AA2AE"
            keyboardType="numeric"
            maxLength={10}
          />
        </Field>

        {DateOcrService.isSupported ? (
          <TouchableOpacity
            style={styles.ocrButton}
            onPress={() => setShowDateScanner(true)}
          >
            <Ionicons name="camera-outline" size={18} color="#17191C" />
            <Text style={styles.ocrButtonText}>Считать даты с упаковки</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={styles.calculateButton}
          onPress={handleCalculateExpiry}
        >
          <Ionicons name="calculator-outline" size={18} color="#17191C" />
          <Text style={styles.calculateButtonText}>Рассчитать примерно</Text>
        </TouchableOpacity>

        <Text style={styles.helpText}>
          Если точной даты нет, проверьте упаковку. Расчет подходит только как
          подсказка.
        </Text>

        <Field label="Количество">
          <View style={styles.quantityRow}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() =>
                setQuantity(Math.max(1, (parseInt(quantity, 10) || 1) - 1).toString())
              }
            >
              <Ionicons name="remove" size={22} color="#17191C" />
            </TouchableOpacity>
            <TextInput
              style={styles.quantityInput}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => setQuantity(((parseInt(quantity, 10) || 1) + 1).toString())}
            >
              <Ionicons name="add" size={22} color="#17191C" />
            </TouchableOpacity>
          </View>
        </Field>
      </ScrollView>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>{submitLabel}</Text>
      </TouchableOpacity>

      <Modal visible={showDateScanner} animationType="slide">
        <DateScannerModal
          onClose={() => setShowDateScanner(false)}
          onDetected={handleDetectedDates}
        />
      </Modal>
    </View>
  );
};

const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    {children}
  </View>
);

const Banner = ({
  icon,
  text,
  tone = 'default',
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  tone?: 'default' | 'soft' | 'warning';
}) => (
  <View
    style={[
      styles.banner,
      tone === 'soft' && styles.bannerSoft,
      tone === 'warning' && styles.bannerWarning,
    ]}
  >
    <Ionicons name={icon} size={18} color="#5FAF8F" />
    <Text style={styles.bannerText}>{text}</Text>
  </View>
);

const formatDateString = (text: string) => {
  const cleaned = text.replace(/\D/g, '');
  let formatted = '';

  if (cleaned.length > 0) {
    formatted = cleaned.slice(0, 2);
  }
  if (cleaned.length > 2) {
    formatted += `.${cleaned.slice(2, 4)}`;
  }
  if (cleaned.length > 4) {
    formatted += `.${cleaned.slice(4, 8)}`;
  }

  return formatted;
};

const formatDateForInput = (value: string) => formatExpiryDateForDisplay(value);

const convertToISO = (dateStr: string) => normalizeExpiryDate(dateStr);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 18,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#17191C',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  bannerSoft: {
    backgroundColor: '#EAF5F0',
  },
  bannerWarning: {
    backgroundColor: '#FFF4E6',
  },
  bannerText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#4F5A67',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  inputGroup: {
    marginBottom: 22,
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '700',
    color: '#4F5A67',
  },
  input: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#17191C',
  },
  infoField: {
    borderRadius: 18,
    backgroundColor: '#EAF0F5',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  infoFieldText: {
    fontSize: 16,
    color: '#4F5A67',
  },
  categoriesRow: {
    flexDirection: 'row',
    paddingRight: 16,
  },
  categoryButton: {
    alignItems: 'center',
    minWidth: 92,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginRight: 10,
  },
  categoryButtonActive: {
    backgroundColor: '#17191C',
  },
  categoryIcon: {
    fontSize: 22,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    color: '#4F5A67',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  calculateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    borderRadius: 18,
    backgroundColor: '#EAF5F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 10,
    gap: 8,
  },
  ocrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    gap: 8,
  },
  ocrButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#17191C',
  },
  calculateButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#17191C',
  },
  helpText: {
    marginBottom: 22,
    fontSize: 13,
    lineHeight: 19,
    color: '#737B86',
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityInput: {
    flex: 1,
    marginHorizontal: 12,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#17191C',
  },
  saveButton: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 20,
    borderRadius: 26,
    backgroundColor: '#17191C',
    paddingVertical: 18,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default AddProductModal;
