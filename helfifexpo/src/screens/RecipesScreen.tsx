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
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ProductArtwork from '../components/ProductArtwork';
import { FirebaseService } from '../services/FirebaseService';
import { GeneratedRecipeService } from '../services/GeneratedRecipeService';
import { GeneratedRecipe } from '../types/GeneratedRecipe';
import { CATEGORY_NAMES, Product, ProductCategory } from '../types/Product';
import {
  formatExpiryDateForDisplay,
  getDaysUntilExpiry,
} from '../utils/productDate';

const RECIPE_CARD_COLORS = ['#FFE7D6', '#E8F2FF', '#EEE5FF'];

interface RecipeDetailData {
  prepMinutes: number;
  cookMinutes: number;
  difficulty: string;
  calories: number;
  proteins: number;
  fats: number;
  carbs: number;
  ingredients: string[];
  tips: string[];
  steps: { title: string; description: string }[];
}

const RecipesScreen: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [generatedRecipes, setGeneratedRecipes] = useState<GeneratedRecipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<GeneratedRecipe | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      const data = await FirebaseService.getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error loading recipes source products:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить продукты для рецептов');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [loadProducts])
  );

  const sortedProducts = useMemo(() => {
    return [...products].sort((first, second) => {
      const firstDays = getDaysUntilExpiry(first.expiryDate);
      const secondDays = getDaysUntilExpiry(second.expiryDate);

      if (Number.isNaN(firstDays) && Number.isNaN(secondDays)) return 0;
      if (Number.isNaN(firstDays)) return 1;
      if (Number.isNaN(secondDays)) return -1;

      return firstDays - secondDays;
    });
  }, [products]);

  const priorityProducts = useMemo(() => {
    const soon = sortedProducts.filter((product) => {
      const days = getDaysUntilExpiry(product.expiryDate);
      return !Number.isNaN(days) && days >= 0 && days <= 3;
    });

    if (soon.length) {
      return soon;
    }

    return sortedProducts
      .filter((product) => !Number.isNaN(getDaysUntilExpiry(product.expiryDate)))
      .slice(0, 6);
  }, [sortedProducts]);

  useEffect(() => {
    let cancelled = false;

    const loadRecipeSet = async () => {
      if (!priorityProducts.length) {
        setGeneratedRecipes([]);
        return;
      }

      try {
        const recipeSet = await GeneratedRecipeService.getOrCreateRecipeSet(priorityProducts);
        if (!cancelled) {
          setGeneratedRecipes(recipeSet.recipes);
        }
      } catch (error) {
        console.error('Error loading generated recipes:', error);
        if (!cancelled) {
          setGeneratedRecipes([]);
        }
      }
    };

    loadRecipeSet();

    return () => {
      cancelled = true;
    };
  }, [priorityProducts]);

  const productsByName = useMemo(() => {
    return new Map(
      priorityProducts.map((product) => [product.name.trim().toLowerCase(), product] as const)
    );
  }, [priorityProducts]);

  const selectedRecipeProducts = useMemo(() => {
    if (!selectedRecipe) return [];

    return selectedRecipe.matchedProductNames
      .map((name) => productsByName.get(name.trim().toLowerCase()))
      .filter((product): product is Product => Boolean(product));
  }, [productsByName, selectedRecipe]);

  const selectedRecipeDetail = useMemo(() => {
    if (!selectedRecipe) return null;
    return buildRecipeDetailData(selectedRecipe);
  }, [selectedRecipe]);

  const categorySections = useMemo(() => {
    const grouped = new Map<ProductCategory, Product[]>();

    priorityProducts.forEach((product) => {
      const category = (product.category as ProductCategory) || 'other';
      const current = grouped.get(category) || [];
      grouped.set(category, [...current, product]);
    });

    return Array.from(grouped.entries()).map(([category, items]) => ({
      category,
      title: CATEGORY_NAMES[category] || 'Другое',
      items: items.slice(0, 6),
    }));
  }, [priorityProducts]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadProducts();
            }}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.overline}>Рецепты</Text>
          <Text style={styles.title}>
            Что приготовить из продуктов, которые скоро испортятся
          </Text>
          <Text style={styles.subtitle}>
            Сначала экран проверяет ваше API с уже сохранёнными рецептами для
            такого набора продуктов, а затем показывает подходящие карточки.
          </Text>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Ionicons name="sparkles-outline" size={22} color="#17191C" />
          </View>
          <Text style={styles.heroTitle}>Ваши рецепты с кэшем по продуктам</Text>
          <Text style={styles.heroText}>
            Если набор продуктов уже встречался, приложение возьмёт рецепты из
            Firestore и не будет создавать тот же результат повторно.
          </Text>

          <View style={styles.heroStats}>
            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatValue}>{priorityProducts.length}</Text>
              <Text style={styles.heroStatLabel}>Продуктов в приоритете</Text>
            </View>
            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatValue}>{generatedRecipes.length}</Text>
              <Text style={styles.heroStatLabel}>Рецептов в выдаче</Text>
            </View>
          </View>
        </View>

        {priorityProducts.length ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Использовать в первую очередь</Text>
              <Text style={styles.sectionSubtitle}>
                Продукты с ближайшим сроком годности
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {priorityProducts.map((product) => {
                const days = getDaysUntilExpiry(product.expiryDate);

                return (
                  <View key={product.id} style={styles.productCard}>
                    <View style={styles.productArtworkWrap}>
                      <ProductArtwork
                        category={(product.category as ProductCategory) || 'other'}
                        title={product.name}
                        imageUrl={product.imageUrl}
                      />
                    </View>

                    <View style={styles.productBody}>
                      <Text style={styles.productName} numberOfLines={2}>
                        {product.name}
                      </Text>
                      <Text style={styles.productMeta}>
                        {days === 0
                          ? 'Истекает сегодня'
                          : days === 1
                            ? 'Остался 1 день'
                            : `Осталось ${days} дн.`}
                      </Text>
                      <Text style={styles.productDate}>
                        До {formatExpiryDateForDisplay(product.expiryDate) || 'дата не указана'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="leaf-outline" size={28} color="#5FAF8F" />
            <Text style={styles.emptyTitle}>Пока нечего подбирать</Text>
            <Text style={styles.emptyText}>
              Добавьте продукты в холодильник, и здесь появятся рецепты для
              набора, который нужно использовать первым.
            </Text>
          </View>
        )}

        {generatedRecipes.length ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Подходящие рецепты</Text>
              <Text style={styles.sectionSubtitle}>
                Нажмите на карточку, чтобы открыть подробный рецепт
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {generatedRecipes.map((recipe, index) => (
                <TouchableOpacity
                  key={recipe.id}
                  activeOpacity={0.92}
                  onPress={() => setSelectedRecipe(recipe)}
                  style={[
                    styles.recipeCard,
                    {
                      backgroundColor:
                        RECIPE_CARD_COLORS[index % RECIPE_CARD_COLORS.length],
                    },
                  ]}
                >
                  <View style={styles.recipeIllustration}>
                    <View style={styles.recipeBlobLarge} />
                    <View style={styles.recipeBlobSmall} />
                    <Ionicons name="restaurant-outline" size={26} color="#17191C" />
                  </View>

                  <Text style={styles.recipeCardTitle} numberOfLines={3}>
                    {recipe.title}
                  </Text>
                  <Text style={styles.recipeCardText} numberOfLines={4}>
                    {recipe.summary}
                  </Text>
                  <Text style={styles.recipeCardProducts} numberOfLines={2}>
                    {recipe.matchedProductNames.join(', ')}
                  </Text>
                  <View style={styles.recipeCardAction}>
                    <Text style={styles.recipeCardActionText}>Открыть рецепт</Text>
                    <Ionicons name="arrow-forward" size={16} color="#17191C" />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {categorySections.map((section) => (
          <View key={section.category} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionSubtitle}>
                Продукты этой категории, которые стоит использовать раньше
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {section.items.map((product) => (
                <View key={product.id} style={styles.smallCard}>
                  <View style={styles.smallCardArtwork}>
                    <ProductArtwork
                      category={(product.category as ProductCategory) || 'other'}
                      title={product.name}
                      imageUrl={product.imageUrl}
                    />
                  </View>
                  <Text style={styles.smallCardTitle} numberOfLines={2}>
                    {product.name}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        ))}
      </ScrollView>

      <Modal visible={Boolean(selectedRecipe)} animationType="slide">
        {selectedRecipe && selectedRecipeDetail ? (
          <SafeAreaView style={styles.detailScreen}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.detailContent}
            >
              <View style={styles.detailTopBar}>
                <TouchableOpacity
                  style={styles.detailIconButton}
                  onPress={() => setSelectedRecipe(null)}
                >
                  <Ionicons name="arrow-back" size={22} color="#17191C" />
                </TouchableOpacity>
                <View style={styles.detailBadge}>
                  <Ionicons name="leaf-outline" size={15} color="#5FAF8F" />
                  <Text style={styles.detailBadgeText}>Из вашего API</Text>
                </View>
              </View>

              <View style={styles.detailHero}>
                <View style={styles.detailHeroArtwork}>
                  <ProductArtwork
                    category={
                      ((selectedRecipeProducts[0]?.category as ProductCategory) || 'other')
                    }
                    title={selectedRecipe.title}
                    imageUrl={selectedRecipe.mainImageUrl || selectedRecipeProducts[0]?.imageUrl}
                  />
                </View>

                <View style={styles.detailHeroBody}>
                  <View style={styles.detailChipRow}>
                    <View style={styles.detailChip}>
                      <Text style={styles.detailChipText}>Рецепт дня</Text>
                    </View>
                    <View style={styles.detailChipMuted}>
                      <Text style={styles.detailChipMutedText}>
                        {selectedRecipe.source === 'cache'
                          ? 'Уже сохранён в вашем API'
                          : selectedRecipe.source === 'generated'
                            ? 'Сгенерирован и сохранён'
                            : 'Сохранён как новый рецепт'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.detailTitle}>{selectedRecipe.title}</Text>
                  <Text style={styles.detailDescription}>{selectedRecipe.summary}</Text>
                </View>
              </View>

              <View style={styles.metricsGrid}>
                <MetricCard
                  label="Готово через"
                  value={`${selectedRecipeDetail.prepMinutes + selectedRecipeDetail.cookMinutes} мин`}
                />
                <MetricCard
                  label="На кухне"
                  value={`${selectedRecipeDetail.cookMinutes} мин`}
                />
                <MetricCard label="Сложность" value={selectedRecipeDetail.difficulty} />
                <MetricCard label="Калории" value={`${selectedRecipeDetail.calories} ккал`} />
              </View>

              <View style={styles.detailPanel}>
                <Text style={styles.detailPanelTitle}>Что понадобится</Text>
                {selectedRecipeDetail.ingredients.map((ingredient) => (
                  <View key={ingredient} style={styles.ingredientRow}>
                    <View style={styles.ingredientDot} />
                    <Text style={styles.ingredientText}>{ingredient}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.nutritionRow}>
                <NutritionCard label="Белки" value={`${selectedRecipeDetail.proteins} г`} />
                <NutritionCard label="Жиры" value={`${selectedRecipeDetail.fats} г`} />
                <NutritionCard label="Углеводы" value={`${selectedRecipeDetail.carbs} г`} />
              </View>

              <View style={styles.detailPanel}>
                <Text style={styles.detailPanelTitle}>Пошагово</Text>
                {selectedRecipeDetail.steps.map((step, index) => (
                  <View key={`${step.title}-${index}`} style={styles.stepCard}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                    <Text style={styles.stepDescription}>{step.description}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.detailPanel}>
                <Text style={styles.detailPanelTitle}>Советы</Text>
                {selectedRecipeDetail.tips.map((tip) => (
                  <View key={tip} style={styles.tipRow}>
                    <Ionicons name="checkmark-circle" size={18} color="#5FAF8F" />
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </SafeAreaView>
        ) : null}
      </Modal>
    </SafeAreaView>
  );
};

const MetricCard = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.metricCard}>
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={styles.metricValue}>{value}</Text>
  </View>
);

const NutritionCard = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.nutritionCard}>
    <Text style={styles.nutritionLabel}>{label}</Text>
    <Text style={styles.nutritionValue}>{value}</Text>
  </View>
);

const buildRecipeDetailData = (recipe: GeneratedRecipe): RecipeDetailData => {
  const ingredients = recipe.ingredients.map((item) => item.trim());

  return {
    prepMinutes: recipe.prepMinutes,
    cookMinutes: recipe.cookMinutes,
    difficulty: recipe.difficulty,
    calories: recipe.nutrition.calories,
    proteins: recipe.nutrition.proteins,
    fats: recipe.nutrition.fats,
    carbs: recipe.nutrition.carbs,
    ingredients: recipe.matchedProductNames.length
      ? ingredients.map((item) => highlightMatchedIngredient(item, recipe.matchedProductNames))
      : ingredients,
    tips: recipe.tips,
    steps: recipe.steps,
  };
};

const highlightMatchedIngredient = (ingredient: string, matchedProductNames: string[]) => {
  const lowerIngredient = ingredient.toLowerCase();
  const matched = matchedProductNames.find((name) =>
    lowerIngredient.includes(name.toLowerCase())
  );

  if (!matched) {
    return ingredient;
  }

  return `${ingredient}  •  есть в холодильнике`;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6F8',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  overline: {
    fontSize: 14,
    fontWeight: '700',
    color: '#737B86',
    marginBottom: 8,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    color: '#17191C',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: '#6F7884',
  },
  heroCard: {
    borderRadius: 32,
    backgroundColor: '#DDF3EA',
    padding: 22,
    marginBottom: 26,
  },
  heroBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    color: '#17191C',
    marginBottom: 10,
  },
  heroText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#44505D',
  },
  heroStats: {
    flexDirection: 'row',
    marginTop: 18,
  },
  heroStatCard: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginRight: 10,
  },
  heroStatValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#17191C',
    marginBottom: 4,
  },
  heroStatLabel: {
    fontSize: 13,
    lineHeight: 18,
    color: '#5A6471',
  },
  section: {
    marginBottom: 26,
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
  horizontalList: {
    paddingRight: 20,
  },
  productCard: {
    width: 248,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    marginRight: 14,
    overflow: 'hidden',
  },
  productArtworkWrap: {
    height: 200,
  },
  productBody: {
    padding: 16,
  },
  productName: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '800',
    color: '#17191C',
  },
  productMeta: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '700',
    color: '#9C6700',
  },
  productDate: {
    marginTop: 6,
    fontSize: 14,
    color: '#5A6471',
  },
  recipeCard: {
    width: 230,
    borderRadius: 28,
    padding: 18,
    marginRight: 14,
    minHeight: 320,
  },
  recipeIllustration: {
    height: 118,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.55)',
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  recipeBlobLarge: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.45)',
    top: -10,
    right: -6,
  },
  recipeBlobSmall: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.32)',
    bottom: -10,
    left: -8,
  },
  recipeCardTitle: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '800',
    color: '#17191C',
    marginBottom: 10,
  },
  recipeCardText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#44505D',
  },
  recipeCardProducts: {
    marginTop: 14,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: '#17191C',
  },
  recipeCardAction: {
    marginTop: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.72)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recipeCardActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#17191C',
  },
  smallCard: {
    width: 168,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    padding: 10,
    marginRight: 12,
  },
  smallCardArtwork: {
    height: 120,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 12,
  },
  smallCardTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    color: '#17191C',
  },
  emptyCard: {
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    paddingVertical: 30,
    paddingHorizontal: 22,
    alignItems: 'center',
    marginBottom: 26,
  },
  emptyTitle: {
    marginTop: 14,
    fontSize: 22,
    fontWeight: '800',
    color: '#17191C',
  },
  emptyText: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    color: '#6F7884',
  },
  detailScreen: {
    flex: 1,
    backgroundColor: '#F5F6F8',
  },
  detailContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 36,
  },
  detailTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  detailIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    backgroundColor: '#EAF5F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  detailBadgeText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '700',
    color: '#245640',
  },
  detailHero: {
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    marginBottom: 18,
  },
  detailHeroArtwork: {
    height: 260,
  },
  detailHeroBody: {
    padding: 20,
  },
  detailChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  detailChip: {
    borderRadius: 999,
    backgroundColor: '#17191C',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  detailChipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  detailChipMuted: {
    borderRadius: 999,
    backgroundColor: '#F0F2F4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  detailChipMutedText: {
    color: '#5A6471',
    fontSize: 12,
    fontWeight: '700',
  },
  detailTitle: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    color: '#17191C',
    marginBottom: 12,
  },
  detailDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: '#5A6471',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  metricCard: {
    width: '48%',
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 12,
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6F7884',
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#17191C',
  },
  detailPanel: {
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 18,
  },
  detailPanelTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#17191C',
    marginBottom: 16,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ingredientDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#5FAF8F',
    marginRight: 10,
  },
  ingredientText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: '#17191C',
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  nutritionCard: {
    width: '31%',
    borderRadius: 24,
    backgroundColor: '#FFF3C9',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  nutritionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7B6212',
    marginBottom: 10,
    textAlign: 'center',
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#17191C',
    textAlign: 'center',
  },
  stepCard: {
    borderRadius: 24,
    backgroundColor: '#F7F8FA',
    padding: 16,
    marginBottom: 12,
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EAF5F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#245640',
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#17191C',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 15,
    lineHeight: 23,
    color: '#5A6471',
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    lineHeight: 22,
    color: '#44505D',
  },
});

export default RecipesScreen;
