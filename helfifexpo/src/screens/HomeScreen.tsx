import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BarcodeScanner from '../components/BarcodeScanner';
import { OpenFoodFactsAPI } from '../services/OpenFoodFactsAPI';
import {
  CATEGORY_ICONS,
  CATEGORY_NAMES,
  ProductCategory,
  ProductDateSource,
} from '../types/Product';
import { normalizeScannedBarcode } from '../utils/barcode';
import { formatExpiryDateForDisplay } from '../utils/productDate';

const HomeScreen: React.FC = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [productInfo, setProductInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [lastBarcode, setLastBarcode] = useState('');

  const handleScan = async (rawBarcode: string) => {
    const normalizedBarcode = normalizeScannedBarcode(rawBarcode);
    const barcode = normalizedBarcode || rawBarcode.trim();
    setShowScanner(false);

    if (!barcode) {
      setProductInfo({
        name: 'Код не распознан',
        brand: '',
        category: 'other',
        expiryDate: '',
        error: true,
      });
      setLastBarcode(rawBarcode);
      return;
    }

    setLoading(true);
    setLastBarcode(barcode);

    try {
      const data = normalizedBarcode
        ? await OpenFoodFactsAPI.getProductByBarcode(normalizedBarcode)
        : null;

      if (data) {
        setProductInfo(data);
      } else {
        setProductInfo({
          name: 'Продукт не найден',
          brand: '',
          category: 'other',
          expiryDate: '',
          expiryDateSource: 'manual',
          notFound: true,
        });
      }
    } catch (error) {
      console.error('Scan error:', error);
      setProductInfo({
        name: 'Ошибка загрузки',
        brand: '',
        category: 'other',
        expiryDate: '',
        expiryDateSource: 'manual',
        error: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.overline}>Быстрая проверка</Text>
          <Text style={styles.title}>Сканируйте продукт без добавления в холодильник</Text>
          <Text style={styles.subtitle}>
            Здесь можно быстро посмотреть карточку товара, дату изготовления и
            доступную информацию из базы.
          </Text>
        </View>

        {!productInfo && !loading ? (
          <View style={styles.heroCard}>
            <View style={styles.heroIconWrap}>
              <Ionicons name="barcode-outline" size={30} color="#5FAF8F" />
            </View>
            <Text style={styles.heroTitle}>Проверить продукт</Text>
            <Text style={styles.heroText}>
              Подходит, если вы хотите быстро посмотреть данные о товаре, не сохраняя
              его в холодильник.
            </Text>
            <TouchableOpacity style={styles.primaryButton} onPress={() => setShowScanner(true)}>
              <Ionicons name="scan" size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Проверить продукт</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#5FAF8F" />
            <Text style={styles.loadingText}>Ищем информацию о продукте...</Text>
          </View>
        ) : null}

        {productInfo && !loading ? (
          <View style={styles.resultCard}>
            <View style={styles.resultIconWrap}>
              <Text style={styles.resultIcon}>
                {CATEGORY_ICONS[productInfo.category as ProductCategory] || CATEGORY_ICONS.other}
              </Text>
            </View>

            <Text style={styles.resultTitle}>{productInfo.name}</Text>

            {productInfo.brand ? (
              <Text style={styles.resultBrand}>{productInfo.brand}</Text>
            ) : null}

            <InfoItem
              label="Категория"
              value={
                CATEGORY_NAMES[productInfo.category as ProductCategory] || 'Другое'
              }
            />

            <InfoItem
              label="Дата изготовления"
              value={formatExpiryDateForDisplay(productInfo.manufactureDate) || 'Нет данных'}
            />

            <InfoItem
              label={getExpiryLabel(productInfo.expiryDateSource)}
              value={formatExpiryDateForDisplay(productInfo.expiryDate) || 'Введите вручную в холодильнике'}
            />

            {lastBarcode ? (
              <View style={styles.barcodeRow}>
                <Ionicons name="barcode-outline" size={16} color="#737B86" />
                <Text style={styles.barcodeText}>{lastBarcode}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                setProductInfo(null);
                setLastBarcode('');
              }}
            >
              <Text style={styles.secondaryButtonText}>Сканировать еще раз</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>

      <Modal visible={showScanner} animationType="slide">
        <BarcodeScanner
          isActive={showScanner}
          onScanned={handleScan}
          onClose={() => setShowScanner(false)}
          title="Проверить продукт"
          subtitle="Сканирование покажет информацию о товаре без сохранения"
        />
      </Modal>
    </SafeAreaView>
  );
};

const InfoItem = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <View style={styles.infoItem}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const getExpiryLabel = (source?: ProductDateSource) => {
  if (source === 'api') return 'Срок годности';
  return 'Рекомендуется употребить до';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 22,
  },
  overline: {
    fontSize: 14,
    fontWeight: '600',
    color: '#737B86',
    marginBottom: 8,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    color: '#17191C',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: '#737B86',
  },
  heroCard: {
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  heroIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#EAF5F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#17191C',
    marginBottom: 12,
  },
  heroText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#737B86',
    marginBottom: 24,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    gap: 10,
    borderRadius: 26,
    backgroundColor: '#17191C',
    paddingHorizontal: 22,
    paddingVertical: 15,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  loadingCard: {
    marginTop: 24,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    paddingVertical: 30,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#737B86',
  },
  resultCard: {
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 26,
  },
  resultIconWrap: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#F7F8FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  resultIcon: {
    fontSize: 28,
  },
  resultTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    color: '#17191C',
  },
  resultBrand: {
    marginTop: 8,
    marginBottom: 18,
    fontSize: 15,
    color: '#737B86',
  },
  infoItem: {
    borderRadius: 22,
    backgroundColor: '#F7F8FA',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5A6471',
    marginBottom: 6,
  },
  infoValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#17191C',
  },
  barcodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 22,
  },
  barcodeText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#737B86',
  },
  secondaryButton: {
    borderRadius: 24,
    backgroundColor: '#17191C',
    alignItems: 'center',
    paddingVertical: 15,
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default HomeScreen;
