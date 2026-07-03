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
import theme from '@/styles/theme';

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

interface CategoryItem {
  id: string;
  name: string;
  image: ImageSourcePropType;
  offerLabel?: string;
}

const CATEGORIES: CategoryItem[] = [
  { id: '1', name: 'Skin Care', image: CATEGORY_IMAGES.skinCare },
  { id: '2', name: 'Sexual Wellness', image: CATEGORY_IMAGES.sexualWellness },
  { id: '3', name: 'Oral Care', image: CATEGORY_IMAGES.oralCare },
  { id: '4', name: 'Hair Care', image: CATEGORY_IMAGES.hairCare },
  {
    id: '5',
    name: 'Feminine Hygiene',
    image: CATEGORY_IMAGES.feminineHygiene,
   
  },
  {
    id: '6',
    name: 'Diaper & Wipes',
    image: CATEGORY_IMAGES.feverCold,
  },
  {
    id: '7',
    name: 'Feeding Essentials',
    image: CATEGORY_IMAGES.feverCold,
  },
  {
    id: '8',
    name: 'Baby Skin & Bath',
    image: CATEGORY_IMAGES.feminineHygiene,
  },
  { id: '9', name: 'Fitness Essentials', image: CATEGORY_IMAGES.fitness },
  { id: '10', name: 'Vitamins & Minerals', image: CATEGORY_IMAGES.vitaminsMinerals },
  { id: '11', name: 'Nutritional Drinks', image: CATEGORY_IMAGES.nutritionDrinks },
  { id: '12', name: 'Ayurveda Essentials', image: CATEGORY_IMAGES.ayurveda },
  {
    id: '13',
    name: 'Health Devices',
    image: CATEGORY_IMAGES.feverCold,
  },
  {
    id: '14',
    name: 'Home Essentials',
    image: CATEGORY_IMAGES.feverCold,
  },
  { id: '15', name: 'Pain Relief', image: CATEGORY_IMAGES.painRelief },
  { id: '16', name: 'Fever & Cold', image: CATEGORY_IMAGES.feverCold },
];

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

const CategoryCard = React.memo(({ item }: { item: CategoryItem }) => (
  <TouchableOpacity style={styles.gridItem} activeOpacity={0.85}>
    <View style={styles.imageBox}>
      <CategoryImage source={item.image} />
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

const CategoriesGrid = () => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Categories</Text>
    <View style={styles.grid}>
      {CATEGORIES.map((item) => (
        <CategoryCard key={item.id} item={item} />
      ))}
    </View>
  </View>
);

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
