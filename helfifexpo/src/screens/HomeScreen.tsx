import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BarcodeScanner from '../components/BarcodeScanner';
import { OpenFoodFactsAPI } from '../services/OpenFoodFactsAPI';
import { CATEGORY_ICONS, CATEGORY_NAMES, ProductCategory } from '../types/Product';

const ScanScreen: React.FC = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [productInfo, setProductInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [lastBarcode, setLastBarcode] = useState('');

  const handleScan = async (barcode: string, type: string) => {
    setShowScanner(false);
    setLoading(true);
    setLastBarcode(barcode);

    try {
      const data = await OpenFoodFactsAPI.getProductByBarcode(barcode);
      
      if (data) {
        setProductInfo({
          name: data.name,
          brand: data.brand,
          category: data.category,
          expiryDate: data.expiryDate || 'Нет данных',
          imageUrl: data.imageUrl,
          barcodeType: type,
        });
      } else {
        setProductInfo({
          name: 'Продукт не найден',
          brand: '',
          category: 'other',
          expiryDate: '',
          barcodeType: type,
          notFound: true,
        });
      }
    } catch (e) {
      setProductInfo({
        name: 'Ошибка загрузки',
        brand: '',
        category: 'other',
        expiryDate: '',
        error: true,
      });
    }
    setLoading(false);
  };

  const resetScan = () => {
    setProductInfo(null);
    setLastBarcode('');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="settings-outline" size={24} color="#E07A5F" />
        <Text style={styles.headerTitle}>Сканер</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {!productInfo && !loading && (
          <View style={styles.emptyState}>
            <Ionicons name="barcode-outline" size={80} color="#E07A5F" />
            <Text style={styles.emptyTitle}>Сканируйте штрих-код</Text>
            <Text style={styles.emptySubtitle}>
              Наведите камеру на штрих-код или QR-код продукта, чтобы получить информацию
            </Text>
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => setShowScanner(true)}
            >
              <Ionicons name="scan" size={24} color="#fff" />
              <Text style={styles.scanButtonText}>Сканировать</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#E07A5F" />
            <Text style={styles.loadingText}>Ищем информацию о продукте...</Text>
          </View>
        )}

        {productInfo && !loading && (
          <View style={styles.resultContainer}>
            <View style={styles.productCard}>
              <View style={styles.productIcon}>
                <Text style={styles.productIconText}>
                  {CATEGORY_ICONS[productInfo.category as ProductCategory] || '📦'}
                </Text>
              </View>
              
              <Text style={styles.productName}>{productInfo.name}</Text>
              
              {productInfo.brand && (
                <Text style={styles.productBrand}>{productInfo.brand}</Text>
              )}
              
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Ionicons name="pricetag-outline" size={20} color="#666" />
                  <Text style={styles.infoLabel}>Категория</Text>
                  <Text style={styles.infoValue}>
                    {CATEGORY_NAMES[productInfo.category as ProductCategory] || 'Другое'}
                  </Text>
                </View>
                
                <View style={styles.infoItem}>
                  <Ionicons name="calendar-outline" size={20} color="#666" />
                  <Text style={styles.infoLabel}>Срок годности</Text>
                  <Text style={styles.infoValue}>
                    {productInfo.expiryDate || 'Не указан'}
                  </Text>
                </View>
              </View>

              <View style={styles.barcodeInfo}>
                <Ionicons name="barcode-outline" size={16} color="#999" />
                <Text style={styles.barcodeText}>{lastBarcode}</Text>
              </View>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.secondaryButton} onPress={resetScan}>
                <Text style={styles.secondaryButtonText}>Сканировать ещё</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Scanner Modal */}
      <Modal visible={showScanner} animationType="slide">
        <BarcodeScanner
          onScanned={handleScan}
          onClose={() => setShowScanner(false)}
        />
      </Modal>
    </SafeAreaView>
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
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginTop: 24,
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  scanButton: {
    flexDirection: 'row',
    backgroundColor: '#E07A5F',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
    gap: 12,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  resultContainer: {
    flex: 1,
    paddingTop: 20,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  productIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF0EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  productIconText: {
    fontSize: 40,
  },
  productName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  productBrand: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 16,
  },
  infoItem: {
    alignItems: 'center',
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
  },
  barcodeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    gap: 8,
  },
  barcodeText: {
    fontSize: 14,
    color: '#999',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  actionButtons: {
    marginTop: 24,
    gap: 12,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E07A5F',
  },
  secondaryButtonText: {
    color: '#E07A5F',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ScanScreen;

