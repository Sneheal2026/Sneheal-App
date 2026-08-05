import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  ImageSourcePropType,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import theme from '@/styles/theme';
import Shimmer from '@/components/common/Shimmer';
import { useCategories } from '@/hooks/useCatalog';
import type { Category } from '@/types/product.types';

const { colors, spacing, typography, moderateScale } = theme;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const HORIZONTAL_PADDING = spacing.xl;
const GRID_GAP = spacing.sm + 2;
const NUM_COLUMNS = 4;
const GRID_WIDTH = SCREEN_WIDTH - HORIZONTAL_PADDING * 2;
const CARD_WIDTH = (GRID_WIDTH - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;
const IMAGE_BOX_SIZE = CARD_WIDTH;

const CARD_BG = '#D9E5F3';
const OFFER_GREEN = '#1F9D55';

const CATEGORY_IMAGES = {
  skinCare: require('../../../assets/images/Skin-Care.png'),
  sexualWellness: require('../../../assets/images/Sexual-wellness.png'),
  oralCare: require('../../../assets/images/Oral-Care.png'),
  hairCare: require('../../../assets/images/Hair-Care.png'),
  feminineHygiene: require('../../../assets/images/Feminine.png'),
  fitness: require('../../../assets/images/Fitness.png'),
  vitaminsMinerals: require('../../../assets/images/Vitamins-Minerals.png'),
  nutritionDrinks: require('../../../assets/images/Nutrition-Drinks.png'),
  ayurveda: require('../../../assets/images/Ayurveda.png'),
  painRelief: require('../../../assets/images/Pain-Relief.png'),
  feverCold: require('../../../assets/images/Fever-Cold.png'),
} as const;

// Bundled fallback art per category slug (used until real image_url values exist).
const CATEGORY_FALLBACK_BY_SLUG: Record<string, ImageSourcePropType> = {
  'skin-care': CATEGORY_IMAGES.skinCare,
  'sexual-wellness': CATEGORY_IMAGES.sexualWellness,
  'oral-care': CATEGORY_IMAGES.oralCare,
  'hair-care': CATEGORY_IMAGES.hairCare,
  'feminine-hygiene': CATEGORY_IMAGES.feminineHygiene,
  'diaper-wipes': CATEGORY_IMAGES.feverCold,
  'feeding-essentials': CATEGORY_IMAGES.feverCold,
  'baby-skin-bath': CATEGORY_IMAGES.feminineHygiene,
  'fitness-essentials': CATEGORY_IMAGES.fitness,
  'vitamins-minerals': CATEGORY_IMAGES.vitaminsMinerals,
  'nutritional-drinks': CATEGORY_IMAGES.nutritionDrinks,
  'ayurveda-essentials': CATEGORY_IMAGES.ayurveda,
  'health-devices': CATEGORY_IMAGES.feverCold,
  'home-essentials': CATEGORY_IMAGES.feverCold,
  'pain-relief': CATEGORY_IMAGES.painRelief,
  'fever-cold': CATEGORY_IMAGES.feverCold,
};

const resolveCategoryImage = (category: Category): ImageSourcePropType => {
  if (category.imageUrl && /^https?:\/\//i.test(category.imageUrl)) {
    return { uri: category.imageUrl };
  }
  return CATEGORY_FALLBACK_BY_SLUG[category.slug] ?? CATEGORY_IMAGES.vitaminsMinerals;
};

const CategoryImage = React.memo(({ source }: { source: ImageSourcePropType }) => {
  const opacity = useRef(new Animated.Value(0)).current;

  const handleLoadEnd = () => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.Image
      source={source}
      style={[styles.productImage, { opacity }]}
      resizeMode="contain"
      onLoadEnd={handleLoadEnd}
    />
  );
});

CategoryImage.displayName = 'CategoryImage';

const CategoryCard = React.memo(({ item }: { item: Category }) => (
  <TouchableOpacity style={styles.gridItem} activeOpacity={0.85}>
    <View style={styles.imageBox}>
      <CategoryImage source={resolveCategoryImage(item)} />
      {item.offerLabel ? (
        <View style={styles.offerBanner}>
          <Text style={styles.offerText} numberOfLines={1}>
            {item.offerLabel}
          </Text>
        </View>
      ) : null}
    </View>
    <Text style={styles.itemName} numberOfLines={2}>
      {item.name}
    </Text>
  </TouchableOpacity>
));

CategoryCard.displayName = 'CategoryCard';

const CategorySkeleton = () => (
  <View style={styles.gridItem}>
    <View style={styles.imageBox}>
      <Shimmer width="100%" height="100%" borderRadius={moderateScale(16)} />
    </View>
    <View style={styles.skeletonLabel}>
      <Shimmer width="80%" height={moderateScale(10)} />
    </View>
  </View>
);

const CategoriesGrid = () => {
  const { t } = useTranslation();
  const { data: categories, loading } = useCategories();

  return (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{t('home.categories')}</Text>
    <View style={styles.grid}>
      {loading && categories.length === 0
        ? Array.from({ length: 8 }).map((_, index) => (
            <CategorySkeleton key={index} />
          ))
        : categories.map((item) => (
            <CategoryCard key={item.id} item={item} />
          ))}
    </View>
  </View>
  );
};

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: HORIZONTAL_PADDING,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h4,
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
    width: GRID_WIDTH,
    alignSelf: 'center',
  },
  gridItem: {
    width: CARD_WIDTH,
  },
  skeletonLabel: {
    marginTop: spacing.xs + 2,
    alignItems: 'center',
  },
  imageBox: {
    width: IMAGE_BOX_SIZE,
    height: IMAGE_BOX_SIZE,
    borderRadius: moderateScale(16),
    backgroundColor: CARD_BG,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImage: {
    width: '88%',
    height: '88%',
  },
  offerBanner: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: OFFER_GREEN,
    paddingVertical: moderateScale(3),
    paddingHorizontal: spacing.xxs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerText: {
    fontSize: moderateScale(7.5),
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  itemName: {
    ...typography.caption,
    fontSize: moderateScale(11),
    fontWeight: '500',
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.xs + 2,
    lineHeight: moderateScale(14),
    minHeight: moderateScale(28),
  },
});

export default React.memo(CategoriesGrid);
