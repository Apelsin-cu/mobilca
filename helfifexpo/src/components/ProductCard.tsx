import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Product,
  ProductCategory,
} from '../types/Product';
import ProductArtwork from './ProductArtwork';
import {
  formatExpiryDateForDisplay,
  getDaysUntilExpiry,
} from '../utils/productDate';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  selected?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  selected = false,
}) => {
  const daysLeft = getDaysUntilExpiry(product.expiryDate);
  const isExpired = daysLeft < 0;
  const isFresh = !Number.isNaN(daysLeft) && daysLeft > 3;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        selected && styles.cardSelected,
        isExpired && styles.cardExpired,
      ]}
      onPress={onPress}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={product.name}
    >
      <View style={styles.imageWrap}>
        <ProductArtwork
          category={(product.category as ProductCategory) || 'other'}
          title={product.name}
          imageUrl={product.imageUrl}
          expired={isExpired}
        />
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>

        <View
          style={[
            styles.statusBadge,
            isExpired
              ? styles.statusBadgeExpired
              : isFresh
                ? styles.statusBadgeFresh
                : styles.statusBadgeSoon,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              isExpired
                ? styles.statusTextExpired
                : isFresh
                  ? styles.statusTextFresh
                  : styles.statusTextSoon,
            ]}
          >
            {getStatusLabel(daysLeft)}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaChip}>
            <Ionicons name="calendar-outline" size={15} color="#44505D" />
            <Text style={styles.metaText}>
              {formatExpiryDateForDisplay(product.expiryDate) || 'Без даты'}
            </Text>
          </View>

          <View style={styles.metaChip}>
            <Ionicons name="albums-outline" size={15} color="#44505D" />
            <Text style={styles.metaText}>{`${product.quantity || 1} шт`}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const getStatusLabel = (daysLeft: number): string => {
  if (Number.isNaN(daysLeft)) return 'Без даты';
  if (daysLeft < 0) return 'Просрочен';
  if (daysLeft <= 3) return 'Скоро испортится';
  return 'Свежее';
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E8EE',
    overflow: 'hidden',
    marginBottom: 12,
  },
  cardSelected: {
    borderColor: '#5FAF8F',
    shadowColor: '#5FAF8F',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 4,
  },
  cardExpired: {
    borderColor: '#D45C5C',
  },
  imageWrap: {
    width: '100%',
    height: 180,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 18,
  },
  name: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    color: '#17191C',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    marginTop: 14,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  statusBadgeExpired: {
    backgroundColor: '#F8DCDD',
  },
  statusBadgeSoon: {
    backgroundColor: '#FFF0D6',
  },
  statusBadgeFresh: {
    backgroundColor: '#DFF3E8',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '800',
  },
  statusTextExpired: {
    color: '#B33A3A',
  },
  statusTextSoon: {
    color: '#9C6700',
  },
  statusTextFresh: {
    color: '#2E7D4F',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 10,
    marginBottom: 8,
  },
  metaText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '700',
    color: '#44505D',
  },
});

export default ProductCard;
