import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AddProductModal from '../components/AddProductModal';
import BarcodeScanner from '../components/BarcodeScanner';
import ProductArtwork from '../components/ProductArtwork';
import ProductCard from '../components/ProductCard';
import { FirebaseService } from '../services/FirebaseService';
import NotificationService from '../services/NotificationService';
import { OpenFoodFactsAPI } from '../services/OpenFoodFactsAPI';
import {
  CATEGORY_NAMES,
  Product,
  ProductCategory,
  ProductDateSource,
} from '../types/Product';
import {
  formatExpiryDateForDisplay,
  getDaysUntilExpiry,
} from '../utils/productDate';
import { normalizeScannedBarcode } from '../utils/barcode';
import { buildRecipeSuggestions } from '../utils/recipeSuggestions';

const FridgeScreen: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [scannedProduct, setScannedProduct] = useState<any>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadProducts = useCallback(async () => {
    try {
      const data = await FirebaseService.getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить продукты');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    NotificationService.requestPermissions();
    loadProducts();
  }, [loadProducts]);

  const sortedProducts = useMemo(() => {
    return [...products].sort((first, second) => {
      const firstDays = getDaysUntilExpiry(first.expiryDate);
      const secondDays = getDaysUntilExpiry(second.expiryDate);
      const firstRank = getPriorityRank(firstDays);
      const secondRank = getPriorityRank(secondDays);

      if (firstRank !== secondRank) {
        return firstRank - secondRank;
      }

      return firstDays - secondDays;
    });
  }, [products]);

  const expiredProducts = useMemo(
    () => sortedProducts.filter((product) => getDaysUntilExpiry(product.expiryDate) < 0),
    [sortedProducts]
  );

  const soonProducts = useMemo(
    () =>
      sortedProducts.filter((product) => {
        const days = getDaysUntilExpiry(product.expiryDate);
        return days >= 0 && days <= 3;
      }),
    [sortedProducts]
  );

  const freshProducts = useMemo(
    () =>
      sortedProducts.filter((product) => {
        const days = getDaysUntilExpiry(product.expiryDate);
        return Number.isNaN(days) || days > 3;
      }),
    [sortedProducts]
  );

  const recipeSuggestions = useMemo(
    () => buildRecipeSuggestions([...soonProducts, ...freshProducts]),
    [freshProducts, soonProducts]
  );

  useEffect(() => {
    if (!sortedProducts.length) {
      setSelectedProduct(null);
      return;
    }

    if (!selectedProduct) {
      setSelectedProduct(sortedProducts[0]);
      return;
    }

    const updatedSelection =
      sortedProducts.find((item) => item.id === selectedProduct.id) || sortedProducts[0];
    setSelectedProduct(updatedSelection);
  }, [selectedProduct, sortedProducts]);

  const handleProductScan = async (rawBarcode: string) => {
    const normalizedBarcode = normalizeScannedBarcode(rawBarcode);
    const fallbackBarcode = rawBarcode.trim();
    const barcode = normalizedBarcode || fallbackBarcode;
    setShowScanner(false);

    if (!barcode) {
      Alert.alert(
        'Код не распознан',
        'Попробуйте отсканировать штрихкод еще раз или добавьте продукт вручную.'
      );
      return;
    }

    setScannedBarcode(barcode);

    try {
      const data = normalizedBarcode
        ? await OpenFoodFactsAPI.getProductByBarcode(normalizedBarcode)
        : null;
      setScannedProduct(data);
    } catch (error) {
      console.error('Scan error:', error);
      setScannedProduct(null);
    }

    setEditingProduct(null);
    setShowAddModal(true);
  };

  const handleManualAdd = () => {
    setShowScanner(false);
    setEditingProduct(null);
    setScannedBarcode(`MANUAL-${Date.now()}`);
    setScannedProduct(null);
    setShowAddModal(true);
  };

  const handleSaveProduct = async (product: Omit<Product, 'id'>) => {
    try {
      if (editingProduct) {
        await FirebaseService.updateProduct(editingProduct.id, product);
        await NotificationService.cancelProductNotifications(editingProduct.id);
        await NotificationService.scheduleExpiryNotification({
          ...editingProduct,
          ...product,
          id: editingProduct.id,
        });
        Alert.alert('Готово', 'Изменения сохранены');
      } else {
        const savedProduct = await FirebaseService.addProduct(product);
        await NotificationService.scheduleExpiryNotification(savedProduct);
        setSelectedProduct(savedProduct);
        Alert.alert('Готово', 'Продукт добавлен в холодильник');
      }

      closeEditorState();
      await loadProducts();
    } catch (error) {
      console.error('Save product error:', error);
      Alert.alert('Ошибка', 'Не удалось сохранить продукт');
    }
  };

  const closeEditorState = () => {
    setShowAddModal(false);
    setEditingProduct(null);
    setScannedBarcode('');
    setScannedProduct(null);
  };

  const openSelectedProductActions = () => {
    if (!selectedProduct) return;

    Alert.alert(selectedProduct.name, 'Что сделать с продуктом?', [
      {
        text: 'Редактировать',
        onPress: () => {
          setEditingProduct(selectedProduct);
          setScannedBarcode(selectedProduct.barcode);
          setScannedProduct(selectedProduct);
          setShowAddModal(true);
        },
      },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: () => confirmDelete(selectedProduct),
      },
      {
        text: 'Отмена',
        style: 'cancel',
      },
    ]);
  };

  const confirmDelete = (product: Product) => {
    Alert.alert('Удалить продукт?', `Удалить "${product.name}" из холодильника?`, [
      {
        text: 'Отмена',
        style: 'cancel',
      },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          try {
            await NotificationService.cancelProductNotifications(product.id);
            await FirebaseService.deleteProduct(product.id);
            await loadProducts();
          } catch (error) {
            console.error('Delete product error:', error);
            Alert.alert('Ошибка', 'Не удалось удалить продукт');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            loadProducts();
          }} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerOverline}>Холодильник</Text>
            <Text style={styles.headerTitle}>Следите за сроками без путаницы</Text>
          </View>
          <TouchableOpacity style={styles.headerAction} onPress={loadProducts}>
            <Ionicons name="refresh-outline" size={22} color="#17191C" />
          </TouchableOpacity>
        </View>

        {selectedProduct ? (
          <HeroCard product={selectedProduct} onOpenActions={openSelectedProductActions} />
        ) : (
          <EmptyState onScan={() => setShowScanner(true)} onManualAdd={handleManualAdd} />
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Продукты в холодильнике</Text>
          <Text style={styles.sectionSubtitle}>Сначала самое срочное, потом остальное.</Text>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionPrimary} onPress={() => setShowScanner(true)}>
            <Ionicons name="scan" size={18} color="#FFFFFF" />
            <Text style={styles.quickActionPrimaryText}>Сканировать</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionSecondary} onPress={handleManualAdd}>
            <Ionicons name="add" size={18} color="#17191C" />
            <Text style={styles.quickActionSecondaryText}>Добавить вручную</Text>
          </TouchableOpacity>
        </View>

        <RecipeSection products={soonProducts} suggestions={recipeSuggestions} />

        <ProductSection
          title="Просроченные"
          subtitle="Проверьте их в первую очередь."
          products={expiredProducts}
          selectedProductId={selectedProduct?.id}
          tone="expired"
          onSelect={setSelectedProduct}
        />

        <ProductSection
          title="Скоро истекают"
          subtitle="Лучше использовать в ближайшие дни."
          products={soonProducts}
          selectedProductId={selectedProduct?.id}
          tone="soon"
          onSelect={setSelectedProduct}
        />

        <ProductSection
          title="Свежие"
          subtitle="Все спокойно, но даты уже сохранены."
          products={freshProducts}
          selectedProductId={selectedProduct?.id}
          tone="fresh"
          onSelect={setSelectedProduct}
        />
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowScanner(true)}
        accessibilityRole="button"
        accessibilityLabel="Сканировать продукт"
      >
        <Ionicons name="scan" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal visible={showScanner} animationType="slide">
        <BarcodeScanner
          isActive={showScanner}
          onScanned={handleProductScan}
          onClose={() => setShowScanner(false)}
          onManualAdd={handleManualAdd}
          title="Сканируйте продукт"
          subtitle="Сканирование заполнит карточку и покажет, какие даты уже известны"
        />
      </Modal>

      <Modal visible={showAddModal} animationType="slide">
        <AddProductModal
          barcode={scannedBarcode}
          initialData={
            editingProduct
              ? editingProduct
              : scannedProduct
                ? { ...scannedProduct, isFromApi: scannedProduct.isFromApi }
                : undefined
          }
          title={editingProduct ? 'Редактирование продукта' : undefined}
          submitLabel={editingProduct ? 'Сохранить изменения' : 'Сохранить'}
          onSave={handleSaveProduct}
          onClose={closeEditorState}
        />
      </Modal>
    </SafeAreaView>
  );
};

const EmptyState = ({
  onScan,
  onManualAdd,
}: {
  onScan: () => void;
  onManualAdd: () => void;
}) => (
  <View style={styles.emptyHero}>
    <View style={styles.emptyHeroBadge}>
      <Ionicons name="scan-outline" size={24} color="#5FAF8F" />
    </View>
    <Text style={styles.emptyHeroTitle}>Сканируйте продукты и храните реальные даты</Text>
    <Text style={styles.emptyHeroText}>
      Добавляйте товары по штрихкоду или вручную. Если точной даты нет, приложение
      пометит расчет отдельно.
    </Text>
    <View style={styles.emptyHeroActions}>
      <TouchableOpacity style={styles.emptyPrimaryButton} onPress={onScan}>
        <Ionicons name="scan" size={18} color="#FFFFFF" />
        <Text style={styles.emptyPrimaryButtonText}>Сканировать продукт</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.emptySecondaryButton} onPress={onManualAdd}>
        <Ionicons name="add" size={18} color="#17191C" />
        <Text style={styles.emptySecondaryButtonText}>Добавить вручную</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const HeroCard = ({
  product,
  onOpenActions,
}: {
  product: Product;
  onOpenActions: () => void;
}) => {
  const daysLeft = getDaysUntilExpiry(product.expiryDate);
  const expired = daysLeft < 0;
  const categoryName =
    CATEGORY_NAMES[(product.category as ProductCategory) || 'other'] || 'Другое';

  return (
    <View style={[styles.heroCard, expired && styles.heroCardExpired]}>
      <View style={styles.heroArtworkWrap}>
        <ProductArtwork
          category={(product.category as ProductCategory) || 'other'}
          title={product.name}
          imageUrl={product.imageUrl}
          expired={expired}
        />
      </View>

      <View style={styles.heroBody}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroMetaPill}>
            <Text style={styles.heroMetaPillText}>{categoryName}</Text>
          </View>
          <TouchableOpacity style={styles.heroMenuButton} onPress={onOpenActions}>
            <Ionicons name="ellipsis-horizontal" size={20} color="#17191C" />
          </TouchableOpacity>
        </View>

        <Text style={styles.heroTitle} numberOfLines={2}>
          {product.name}
        </Text>

        {product.brand ? (
          <Text style={styles.heroSubtitle} numberOfLines={1}>
            {product.brand}
          </Text>
        ) : null}

        <View
          style={[
            styles.heroStatusBadge,
            expired
              ? styles.heroStatusBadgeExpired
              : daysLeft <= 3
                ? styles.heroStatusBadgeSoon
                : styles.heroStatusBadgeFresh,
          ]}
        >
          <Text style={[styles.heroStatus, expired && styles.heroStatusExpired]}>
            {getStatusText(daysLeft)}
          </Text>
        </View>

        <View style={styles.heroDetailsRow}>
          <DateDetailCard
            icon="construct-outline"
            label="Дата изготовления"
            value={formatExpiryDateForDisplay(product.manufactureDate) || 'Не указана'}
          />
          <DateDetailCard
            icon="calendar-outline"
            label={getExpiryLabel(product.expiryDateSource)}
            value={formatExpiryDateForDisplay(product.expiryDate) || 'Введите вручную'}
          />
        </View>

        {product.quantity ? (
          <View style={styles.detailItem}>
            <Ionicons name="albums-outline" size={15} color="#44505D" />
            <Text style={styles.detailText}>{`${product.quantity} шт`}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const DateDetailCard = ({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) => (
  <View style={styles.dateCard}>
    <View style={styles.dateCardHeader}>
      <Ionicons name={icon} size={15} color="#44505D" />
      <Text style={styles.dateCardLabel}>{label}</Text>
    </View>
    <Text style={styles.dateCardValue}>{value}</Text>
  </View>
);

const ProductSection = ({
  title,
  subtitle,
  products,
  selectedProductId,
  tone,
  onSelect,
}: {
  title: string;
  subtitle: string;
  products: Product[];
  selectedProductId?: string;
  tone: 'expired' | 'soon' | 'fresh';
  onSelect: (product: Product) => void;
}) => {
  if (!products.length) {
    return null;
  }

  return (
    <View style={styles.groupSection}>
      <View
        style={[
          styles.groupHeader,
          tone === 'expired' && styles.groupHeaderExpired,
          tone === 'soon' && styles.groupHeaderSoon,
          tone === 'fresh' && styles.groupHeaderFresh,
        ]}
      >
        <Text style={styles.groupTitle}>{title}</Text>
        <Text style={styles.groupSubtitle}>{subtitle}</Text>
      </View>

      <View style={styles.groupGrid}>
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            selected={product.id === selectedProductId}
            onPress={() => onSelect(product)}
          />
        ))}
      </View>
    </View>
  );
};

const RecipeSection = ({
  products,
  suggestions,
}: {
  products: Product[];
  suggestions: ReturnType<typeof buildRecipeSuggestions>;
}) => {
  const productsToUseFirst = products.slice(0, 3);

  if (!productsToUseFirst.length && !suggestions.length) {
    return null;
  }

  return (
    <View style={styles.recipeSection}>
      <View style={styles.recipeHeader}>
        <Text style={styles.recipeTitle}>Что съесть в первую очередь</Text>
        <Text style={styles.recipeSubtitle}>
          Бесплатные подсказки по продуктам, которые уже есть в холодильнике.
        </Text>
      </View>

      {productsToUseFirst.length ? (
        <View style={styles.priorityRow}>
          {productsToUseFirst.map((product) => (
            <View key={product.id} style={styles.priorityChip}>
              <Ionicons name="time-outline" size={14} color="#9C6700" />
              <Text style={styles.priorityChipText} numberOfLines={1}>
                {product.name}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {suggestions.map((recipe) => (
        <View
          key={recipe.id}
          style={[
            styles.recipeCard,
            recipe.urgency === 'expired' && styles.recipeCardExpired,
            recipe.urgency === 'soon' && styles.recipeCardSoon,
            recipe.urgency === 'fresh' && styles.recipeCardFresh,
          ]}
        >
          <View style={styles.recipeCardTop}>
            <View
              style={[
                styles.recipeToneDot,
                recipe.urgency === 'expired' && styles.recipeToneDotExpired,
                recipe.urgency === 'soon' && styles.recipeToneDotSoon,
                recipe.urgency === 'fresh' && styles.recipeToneDotFresh,
              ]}
            />
            <Text style={styles.recipeCardTitle}>{recipe.title}</Text>
          </View>
          <Text style={styles.recipeCardDescription}>{recipe.description}</Text>
          <Text style={styles.recipeCardProducts}>
            Использовать: {recipe.productNames.join(', ')}
          </Text>
        </View>
      ))}
    </View>
  );
};

const getPriorityRank = (days: number): number => {
  if (Number.isNaN(days)) return 3;
  if (days < 0) return 0;
  if (days <= 3) return 1;
  return 2;
};

const getStatusText = (days: number): string => {
  if (Number.isNaN(days)) return 'Дата не указана';
  if (days < 0) return 'Уже просрочен';
  if (days === 0) return 'Истекает сегодня';
  if (days === 1) return 'Остался 1 день';
  if (days < 5) return `Осталось ${days} дня`;
  return `Осталось ${days} дней`;
};

const getExpiryLabel = (source?: ProductDateSource): string => {
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
    paddingTop: 12,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerOverline: {
    fontSize: 14,
    fontWeight: '600',
    color: '#737B86',
    marginBottom: 6,
  },
  headerTitle: {
    maxWidth: 250,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
    color: '#17191C',
  },
  headerAction: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    marginBottom: 28,
    overflow: 'hidden',
  },
  heroCardExpired: {
    borderWidth: 2,
    borderColor: '#D45C5C',
  },
  heroArtworkWrap: {
    height: 230,
  },
  heroBody: {
    padding: 20,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroMetaPill: {
    borderRadius: 999,
    backgroundColor: '#EAF5F0',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  heroMetaPillText: {
    color: '#17191C',
    fontSize: 13,
    fontWeight: '700',
  },
  heroMenuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 31,
    color: '#17191C',
  },
  heroSubtitle: {
    marginTop: 6,
    fontSize: 15,
    color: '#44505D',
  },
  heroStatusBadge: {
    alignSelf: 'flex-start',
    marginTop: 14,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  heroStatusBadgeFresh: {
    backgroundColor: 'rgba(95, 175, 143, 0.18)',
  },
  heroStatusBadgeSoon: {
    backgroundColor: 'rgba(229, 185, 106, 0.24)',
  },
  heroStatusBadgeExpired: {
    backgroundColor: 'rgba(212, 92, 92, 0.18)',
  },
  heroStatus: {
    fontSize: 18,
    fontWeight: '800',
    color: '#17191C',
  },
  heroStatusExpired: {
    color: '#A93E3E',
  },
  heroDetailsRow: {
    marginTop: 18,
  },
  dateCard: {
    borderRadius: 20,
    backgroundColor: '#F7F8FA',
    padding: 14,
    marginBottom: 10,
  },
  dateCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateCardLabel: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: '700',
    color: '#44505D',
  },
  dateCardValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#17191C',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 6,
    borderRadius: 14,
    backgroundColor: '#F7F8FA',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  detailText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '600',
    color: '#44505D',
  },
  emptyHero: {
    borderRadius: 34,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 30,
    marginBottom: 28,
  },
  emptyHeroBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EAF5F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyHeroTitle: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
    color: '#17191C',
    marginBottom: 12,
  },
  emptyHeroText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#737B86',
  },
  emptyHeroActions: {
    flexDirection: 'row',
    marginTop: 24,
  },
  emptyPrimaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#17191C',
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginRight: 12,
  },
  emptyPrimaryButtonText: {
    marginLeft: 8,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  emptySecondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#EAF5F0',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  emptySecondaryButtonText: {
    marginLeft: 8,
    color: '#17191C',
    fontSize: 15,
    fontWeight: '700',
  },
  sectionHeader: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#17191C',
  },
  sectionSubtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: '#737B86',
  },
  quickActions: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  quickActionPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#17191C',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 10,
  },
  quickActionPrimaryText: {
    marginLeft: 8,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  quickActionSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#EAF5F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  quickActionSecondaryText: {
    marginLeft: 8,
    color: '#17191C',
    fontSize: 14,
    fontWeight: '700',
  },
  groupSection: {
    marginBottom: 18,
  },
  groupHeader: {
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  groupHeaderExpired: {
    backgroundColor: '#FFF0F0',
  },
  groupHeaderSoon: {
    backgroundColor: '#FFF7E8',
  },
  groupHeaderFresh: {
    backgroundColor: '#EEF8F2',
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#17191C',
  },
  groupSubtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: '#5A6471',
  },
  groupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  recipeSection: {
    marginBottom: 20,
  },
  recipeHeader: {
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 12,
  },
  recipeTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#17191C',
  },
  recipeSubtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: '#737B86',
  },
  priorityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  priorityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#FFF7E8',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  priorityChipText: {
    marginLeft: 6,
    maxWidth: 190,
    fontSize: 13,
    fontWeight: '700',
    color: '#7A5712',
  },
  recipeCard: {
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 10,
  },
  recipeCardExpired: {
    borderWidth: 1,
    borderColor: '#E8B4B4',
  },
  recipeCardSoon: {
    borderWidth: 1,
    borderColor: '#F2D39B',
  },
  recipeCardFresh: {
    borderWidth: 1,
    borderColor: '#C6E4D5',
  },
  recipeCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recipeToneDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  recipeToneDotExpired: {
    backgroundColor: '#D45C5C',
  },
  recipeToneDotSoon: {
    backgroundColor: '#E5B96A',
  },
  recipeToneDotFresh: {
    backgroundColor: '#5FAF8F',
  },
  recipeCardTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: '#17191C',
  },
  recipeCardDescription: {
    fontSize: 14,
    lineHeight: 21,
    color: '#5A6471',
  },
  recipeCardProducts: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '700',
    color: '#44505D',
  },
  fab: {
    position: 'absolute',
    right: 22,
    bottom: 28,
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#5FAF8F',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5FAF8F',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 8,
  },
});

export default FridgeScreen;
