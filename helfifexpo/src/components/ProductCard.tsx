import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Product, CATEGORY_ICONS, ProductCategory } from '../types/Product';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  onDelete?: () => void;
}

const getDaysUntilExpiry = (expiryDate: string): number => {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getExpiryColor = (days: number): string => {
  if (days <= 0) return '#FF4444';
  if (days <= 2) return '#FF6B6B';
  if (days <= 7) return '#FFB347';
  if (days <= 14) return '#98D8AA';
  return '#4CAF50';
};

const ProductCard: React.FC<ProductCardProps> = ({ product, onPress, onDelete }) => {
  const daysLeft = getDaysUntilExpiry(product.expiryDate);
  const expiryColor = getExpiryColor(daysLeft);
  const icon = CATEGORY_ICONS[product.category as ProductCategory] || CATEGORY_ICONS.other;
  
  const getDaysText = () => {
    if (daysLeft <= 0) return 'Просрочено';
    if (daysLeft === 1) return '1 день';
    if (daysLeft < 5) return `${daysLeft} дня`;
    return `${daysLeft} дней`;
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.iconContainer}>
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
        ) : (
          <Text style={styles.icon}>{icon}</Text>
        )}
        {product.quantity > 1 && (
          <View style={styles.quantityBadge}>
            <Text style={styles.quantityText}>{product.quantity}</Text>
          </View>
        )}
      </View>
      
      <View style={[styles.expiryBadge, { backgroundColor: expiryColor }]}>
        <Text style={styles.expiryText}>{getDaysText()}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    margin: 6,
    width: '45%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    width: '100%',
  },
  icon: {
    fontSize: 48,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  quantityBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#E07A5F',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  expiryBadge: {
    width: '100%',
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  expiryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ProductCard;
