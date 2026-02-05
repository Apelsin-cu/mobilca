import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product, ProductCategory, CATEGORY_ICONS, CATEGORY_NAMES } from '../types/Product';
import { OpenFoodFactsAPI } from '../services/OpenFoodFactsAPI';

interface AddProductModalProps {
  initialData?: Partial<Product> & { isFromApi?: boolean };
  barcode: string;
  onSave: (product: Omit<Product, 'id'>) => void;
  onClose: () => void;
}

const CATEGORIES: ProductCategory[] = [
  'fruits', 'vegetables', 'dairy', 'meat', 
  'beverages', 'bakery', 'snacks', 'frozen', 'other'
];

const AddProductModal: React.FC<AddProductModalProps> = ({
  initialData,
  barcode,
  onSave,
  onClose,
}) => {
  // Логируем входные данные для отладки
  console.log('AddProductModal initialData:', JSON.stringify(initialData, null, 2));
  
  const isFromApi = initialData?.isFromApi || false;
  const isManualEntry = barcode.startsWith('MANUAL-'); // Ручной ввод без штрих-кода
  const [isManualMode, setIsManualMode] = useState(!isFromApi || isManualEntry);
  
  const [name, setName] = useState(initialData?.name || '');
  const [category, setCategory] = useState<ProductCategory>(
    initialData?.category as ProductCategory || (isManualEntry ? 'vegetables' : 'other')
  );
  const [expiryDate, setExpiryDate] = useState(initialData?.expiryDate || '');
  const [quantity, setQuantity] = useState(initialData?.quantity?.toString() || '1');
  const [purchaseLocation, setPurchaseLocation] = useState(initialData?.purchaseLocation || '');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Обновляем данные когда initialData меняется
  useEffect(() => {
    if (initialData) {
      console.log('Updating from initialData:', initialData);
      if (initialData.name) setName(initialData.name);
      if (initialData.category) setCategory(initialData.category as ProductCategory);
      if (initialData.expiryDate) setExpiryDate(initialData.expiryDate);
      if (initialData.purchaseLocation) setPurchaseLocation(initialData.purchaseLocation);
    }
  }, [initialData]);

  // Обновляем срок годности при смене категории в ручном режиме
  useEffect(() => {
    if ((isManualMode || isManualEntry) && !initialData?.expiryDate) {
      setExpiryDate(OpenFoodFactsAPI.getDefaultExpiryForCategory(category));
    }
  }, [category, isManualMode, isManualEntry]);

  const handleSave = () => {
    if (!name.trim()) {
      alert('Введите название продукта');
      return;
    }
    if (!expiryDate) {
      alert('Введите срок годности');
      return;
    }

    onSave({
      name: name.trim(),
      barcode,
      category,
      expiryDate: convertToISO(expiryDate),
      quantity: parseInt(quantity) || 1,
      imageUrl: initialData?.imageUrl,
      brand: initialData?.brand,
      purchaseLocation: purchaseLocation.trim() || undefined,
      addedAt: new Date().toISOString(),
    });
  };

  const formatDateInput = (text: string) => {
    // Автоформатирование даты: DD.MM.YYYY
    const cleaned = text.replace(/\D/g, '');
    let formatted = '';
    
    if (cleaned.length > 0) {
      formatted = cleaned.slice(0, 2);
    }
    if (cleaned.length > 2) {
      formatted += '.' + cleaned.slice(2, 4);
    }
    if (cleaned.length > 4) {
      formatted += '.' + cleaned.slice(4, 8);
    }
    
    setExpiryDate(formatted);
  };

  const convertToISO = (dateStr: string): string => {
    const parts = dateStr.split('.');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>
          {isManualEntry ? 'Добавить вручную' : isFromApi ? 'Продукт найден' : 'Добавить продукт'}
        </Text>
        <TouchableOpacity onPress={handleSave}>
          <Ionicons name="checkmark" size={28} color="#E07A5F" />
        </TouchableOpacity>
      </View>

      {/* Баннер статуса */}
      {isManualEntry ? (
        <View style={[styles.statusBanner, { backgroundColor: '#E3F2FD' }]}>
          <Ionicons name="create" size={20} color="#2196F3" />
          <Text style={styles.statusText}>Ручной ввод — для овощей, фруктов и других продуктов</Text>
        </View>
      ) : isFromApi && !isManualMode ? (
        <View style={styles.statusBanner}>
          <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
          <Text style={styles.statusText}>Данные загружены автоматически</Text>
          <TouchableOpacity onPress={() => setIsManualMode(true)}>
            <Text style={styles.editLink}>Изменить</Text>
          </TouchableOpacity>
        </View>
      ) : !isFromApi ? (
        <View style={[styles.statusBanner, { backgroundColor: '#FFF3E0' }]}>
          <Ionicons name="hand-left" size={20} color="#FF9800" />
          <Text style={styles.statusText}>Продукт не найден — заполните вручную</Text>
        </View>
      ) : null}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Название */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Название</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Введите название продукта"
            placeholderTextColor="#999"
          />
        </View>

        {/* Штрих-код - показываем только если это сканирование */}
        {!isManualEntry && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Штрих-код</Text>
            <View style={styles.barcodeContainer}>
              <Text style={styles.barcodeText}>{barcode}</Text>
            </View>
          </View>
        )}

        {/* Категория */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Категория</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.categoriesRow}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryButton,
                    category === cat && styles.categoryButtonActive,
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={styles.categoryIcon}>{CATEGORY_ICONS[cat]}</Text>
                  <Text
                    style={[
                      styles.categoryText,
                      category === cat && styles.categoryTextActive,
                    ]}
                  >
                    {CATEGORY_NAMES[cat]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Срок годности */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Срок годности</Text>
          <TextInput
            style={styles.input}
            value={expiryDate}
            onChangeText={formatDateInput}
            placeholder="ДД.ММ.ГГГГ"
            placeholderTextColor="#999"
            keyboardType="numeric"
            maxLength={10}
          />
        </View>

        {/* Количество */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Количество</Text>
          <View style={styles.quantityRow}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => setQuantity(Math.max(1, parseInt(quantity) - 1).toString())}
            >
              <Ionicons name="remove" size={24} color="#E07A5F" />
            </TouchableOpacity>
            <TextInput
              style={styles.quantityInput}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => setQuantity((parseInt(quantity) + 1).toString())}
            >
              <Ionicons name="add" size={24} color="#E07A5F" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Место покупки - необязательное поле */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Где куплен <Text style={styles.optionalLabel}>(необязательно)</Text></Text>
          <TextInput
            style={styles.input}
            value={purchaseLocation}
            onChangeText={setPurchaseLocation}
            placeholder="Магнит, Пятёрочка, Ашан..."
            placeholderTextColor="#999"
          />
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Сохранить в холодильник</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  optionalLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: '#999',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  barcodeContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  barcodeText: {
    fontSize: 16,
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  categoriesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  categoryButton: {
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    minWidth: 80,
  },
  categoryButtonActive: {
    backgroundColor: '#E07A5F',
    borderColor: '#E07A5F',
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
  },
  categoryTextActive: {
    color: '#fff',
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  quantityButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E07A5F',
  },
  quantityInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    minWidth: 80,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  saveButton: {
    backgroundColor: '#E07A5F',
    marginHorizontal: 20,
    marginBottom: Platform.OS === 'ios' ? 40 : 20,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  statusText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  editLink: {
    fontSize: 14,
    color: '#E07A5F',
    fontWeight: '600',
  },
  autoFilledField: {
    backgroundColor: '#F0F8F0',
    borderColor: '#4CAF50',
  },
});

export default AddProductModal;
