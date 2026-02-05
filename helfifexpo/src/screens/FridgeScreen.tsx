import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Platform,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BarcodeScanner from '../components/BarcodeScanner';
import AddProductModal from '../components/AddProductModal';
import ProductCard from '../components/ProductCard';
import { FirebaseService } from '../services/FirebaseService';
import { OpenFoodFactsAPI } from '../services/OpenFoodFactsAPI';
import NotificationService from '../services/NotificationService';
import { Product, ProductCategory, CATEGORY_NAMES } from '../types/Product';

type FilterType = 'all' | 'expiring' | 'expired';

const FridgeScreen: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [scannedProduct, setScannedProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const loadProducts = useCallback(async () => {
    try {
      const data = await FirebaseService.getProducts();
      setProducts(data);
      
      // Проверяем просроченные продукты и отправляем уведомления
      await NotificationService.checkExpiredProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить продукты');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // Запрашиваем разрешения на уведомления при первом запуске
    NotificationService.requestPermissions();
    loadProducts();
  }, [loadProducts]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  const handleScan = async (barcode: string, type: string) => {
    setShowScanner(false);
    setScannedBarcode(barcode);

    try {
      const data = await OpenFoodFactsAPI.getProductByBarcode(barcode);
      setScannedProduct(data);
    } catch (error) {
      setScannedProduct(null);
    }
    
    setShowAddModal(true);
  };

  // Ручное добавление без штрих-кода (для овощей/фруктов)
  const handleManualAdd = () => {
    setShowScanner(false);
    setScannedBarcode('MANUAL-' + Date.now()); // Генерируем уникальный ID
    setScannedProduct(null);
    setShowAddModal(true);
  };

  const handleSaveProduct = async (product: Omit<Product, 'id'>) => {
    try {
      const savedProduct = await FirebaseService.addProduct(product);
      
      // Планируем уведомления о просрочке
      if (savedProduct) {
        await NotificationService.scheduleExpiryNotification(savedProduct);
      }
      
      setShowAddModal(false);
      setScannedBarcode('');
      setScannedProduct(null);
      loadProducts();
      
      Alert.alert('Успех', 'Продукт добавлен в холодильник!');
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось сохранить продукт');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    Alert.alert(
      'Удалить продукт?',
      'Вы уверены, что хотите удалить этот продукт?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await FirebaseService.deleteProduct(id);
              loadProducts();
            } catch (error) {
              Alert.alert('Ошибка', 'Не удалось удалить продукт');
            }
          },
        },
      ]
    );
  };

  const getFilteredProducts = () => {
    const now = new Date();
    
    switch (filter) {
      case 'expiring':
        return products.filter((p) => {
          const expiry = new Date(p.expiryDate);
          const diff = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
          return diff > 0 && diff <= 7;
        });
      case 'expired':
        return products.filter((p) => new Date(p.expiryDate) < now);
      default:
        return products;
    }
  };

  const filteredProducts = getFilteredProducts();
  
  const expiringCount = products.filter((p) => {
    const now = new Date();
    const expiry = new Date(p.expiryDate);
    const diff = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 7;
  }).length;

  const FILTER_NAMES: Record<FilterType, string> = {
    all: 'Все продукты',
    expiring: 'Истекает скоро',
    expired: 'Просроченные',
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="settings-outline" size={24} color="#E07A5F" />
        <Text style={styles.headerTitle}>Мой холодильник</Text>
        <TouchableOpacity onPress={() => setShowScanner(true)}>
          <Ionicons name="add-circle-outline" size={28} color="#E07A5F" />
        </TouchableOpacity>
      </View>

      {/* Alert Banner */}
      {expiringCount > 0 && (
        <View style={styles.alertBanner}>
          <View style={styles.alertIcon}>
            <Ionicons name="calendar-outline" size={24} color="#E07A5F" />
          </View>
          <Text style={styles.alertText}>
            {expiringCount} продукт(ов) истекает в течение 7 дней
          </Text>
          <TouchableOpacity onPress={() => setFilter('expiring')}>
            <Ionicons name="close" size={20} color="#999" />
          </TouchableOpacity>
        </View>
      )}

      {/* Filter */}
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setShowFilterMenu(!showFilterMenu)}
      >
        <Text style={styles.filterText}>{FILTER_NAMES[filter]}</Text>
        <Ionicons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>

      {showFilterMenu && (
        <View style={styles.filterMenu}>
          {(['all', 'expiring', 'expired'] as FilterType[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterOption, filter === f && styles.filterOptionActive]}
              onPress={() => {
                setFilter(f);
                setShowFilterMenu(false);
              }}
            >
              <Text style={[styles.filterOptionText, filter === f && styles.filterOptionTextActive]}>
                {FILTER_NAMES[f]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.productsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => handleDeleteProduct(item.id)}
              onDelete={() => handleDeleteProduct(item.id)}
            />
          )}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="cube-outline" size={64} color="#CCC" />
          <Text style={styles.emptyTitle}>Холодильник пуст</Text>
          <Text style={styles.emptySubtitle}>
            Отсканируйте штрих-код продукта, чтобы добавить его
          </Text>
        </View>
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowScanner(true)}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      {/* Scanner Modal */}
      <Modal visible={showScanner} animationType="slide">
        <BarcodeScanner
          onScanned={handleScan}
          onClose={() => setShowScanner(false)}
          onManualAdd={handleManualAdd}
        />
      </Modal>

      {/* Add Product Modal */}
      <Modal visible={showAddModal} animationType="slide">
        <AddProductModal
          barcode={scannedBarcode}
          initialData={scannedProduct || undefined}
          onSave={handleSaveProduct}
          onClose={() => {
            setShowAddModal(false);
            setScannedBarcode('');
            setScannedProduct(null);
          }}
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
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F3',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE5E0',
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  filterText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  filterMenu: {
    position: 'absolute',
    top: 160,
    left: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 100,
  },
  filterOption: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  filterOptionActive: {
    backgroundColor: '#FFF0EB',
  },
  filterOptionText: {
    fontSize: 16,
    color: '#666',
  },
  filterOptionTextActive: {
    color: '#E07A5F',
    fontWeight: '600',
  },
  productsList: {
    paddingHorizontal: 10,
    paddingBottom: 100,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E07A5F',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#E07A5F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default FridgeScreen;
