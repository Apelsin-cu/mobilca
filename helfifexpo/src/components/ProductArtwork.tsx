import React, { useEffect, useState } from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import {
  CATEGORY_ART,
  CATEGORY_ICONS,
  CATEGORY_NAMES,
  ProductCategory,
} from '../types/Product';

interface ProductArtworkProps {
  category: ProductCategory;
  title: string;
  imageUrl?: string;
  compact?: boolean;
  expired?: boolean;
}

const ProductArtwork: React.FC<ProductArtworkProps> = ({
  category,
  title,
  imageUrl,
  compact = false,
  expired = false,
}) => {
  const [hasImageError, setHasImageError] = useState(false);
  const theme = CATEGORY_ART[category] || CATEGORY_ART.other;
  const icon = CATEGORY_ICONS[category] || CATEGORY_ICONS.other;
  const categoryName = CATEGORY_NAMES[category] || CATEGORY_NAMES.other;

  useEffect(() => {
    setHasImageError(false);
  }, [imageUrl, title, category]);

  const content = (
    <View
      style={[
        styles.container,
        compact ? styles.compactContainer : styles.fullContainer,
        { backgroundColor: theme.background },
        expired && styles.expiredContainer,
      ]}
    >
      <View
        style={[
          styles.circleLarge,
          compact ? styles.circleLargeCompact : styles.circleLargeFull,
          { backgroundColor: theme.bubble },
        ]}
      />
      <View
        style={[
          styles.circleSmall,
          compact ? styles.circleSmallCompact : styles.circleSmallFull,
          { backgroundColor: theme.accent },
        ]}
      />

      <View style={styles.content}>
        <View style={[styles.iconWrap, compact && styles.iconWrapCompact]}>
          <Text style={[styles.icon, compact && styles.iconCompact]}>{icon}</Text>
        </View>

        {!compact ? (
          <View style={styles.labelWrap}>
            <Text style={[styles.categoryLabel, { color: theme.textOnColor }]}>
              {categoryName}
            </Text>
            <Text
              style={[styles.title, { color: theme.textOnColor }]}
              numberOfLines={2}
            >
              {title}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );

  if (imageUrl && !hasImageError) {
    return (
      <ImageBackground
        source={{ uri: imageUrl }}
        style={[
          styles.container,
          compact ? styles.compactContainer : styles.fullContainer,
          expired && styles.expiredContainer,
        ]}
        imageStyle={compact ? styles.compactImage : styles.fullImage}
        onError={() => setHasImageError(true)}
      >
        <View
          style={[
            styles.photoOverlay,
            compact ? styles.photoOverlayCompact : styles.photoOverlayFull,
            expired && styles.photoOverlayExpired,
          ]}
        />
        <View style={styles.photoBadge}>
          <Text style={styles.photoBadgeText}>{icon}</Text>
        </View>
      </ImageBackground>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  fullContainer: {
    minHeight: 292,
    borderRadius: 34,
  },
  compactContainer: {
    height: 88,
    borderRadius: 18,
  },
  fullImage: {
    borderRadius: 34,
  },
  compactImage: {
    borderRadius: 18,
  },
  expiredContainer: {
    backgroundColor: '#FCEAEA',
  },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  photoOverlayFull: {
    backgroundColor: 'rgba(20, 28, 36, 0.18)',
  },
  photoOverlayCompact: {
    backgroundColor: 'rgba(20, 28, 36, 0.12)',
  },
  photoOverlayExpired: {
    backgroundColor: 'rgba(212, 92, 92, 0.18)',
  },
  photoBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.82)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBadgeText: {
    fontSize: 18,
  },
  circleLarge: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.9,
  },
  circleLargeFull: {
    width: 220,
    height: 220,
    top: -18,
    right: -40,
  },
  circleLargeCompact: {
    width: 90,
    height: 90,
    top: -20,
    right: -18,
  },
  circleSmall: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.45,
  },
  circleSmallFull: {
    width: 150,
    height: 150,
    bottom: -42,
    left: -20,
  },
  circleSmallCompact: {
    width: 50,
    height: 50,
    bottom: -14,
    left: -10,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 18,
  },
  iconWrap: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  iconWrapCompact: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  icon: {
    fontSize: 40,
  },
  iconCompact: {
    fontSize: 24,
  },
  labelWrap: {
    maxWidth: '78%',
  },
  categoryLabel: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
  },
});

export default ProductArtwork;
