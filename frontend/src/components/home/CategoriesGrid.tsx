import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  Animated,
} from 'react-native';
import theme from '@/styles/theme';

const { colors, spacing, typography, moderateScale } = theme;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const HORIZONTAL_PADDING = spacing.md;
const GRID_GAP = spacing.sm + 2;
const NUM_COLUMNS = 4;
const GRID_WIDTH = SCREEN_WIDTH - HORIZONTAL_PADDING * 2;
const CARD_WIDTH = (GRID_WIDTH - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;
const IMAGE_BOX_SIZE = CARD_WIDTH;

const CARD_BG = '#D9E5F3';
const OFFER_GREEN = '#1F9D55';

interface CategoryItem {
  id: string;
  name: string;
  imageUri: string;
  offerLabel?: string;
}

const CATEGORIES: CategoryItem[] = [
  {
    id: '1',
    name: 'Skin Care',
    imageUri: 'https://images.unsplash.com/photo-1570172619644-d3b0d63d584c?w=400&h=400&fit=crop&q=80',
  },
  {
    id: '2',
    name: 'Sexual Wellness',
    imageUri: 'https://images.unsplash.com/photo-1505751172879-3b926a3939a7?w=400&h=400&fit=crop&q=80',
  },
  {
    id: '3',
    name: 'Oral Care',
    imageUri: 'https://images.unsplash.com/photo-1622372738946-62e02505feb3?w=400&h=400&fit=crop&q=80',
  },
  {
    id: '4',
    name: 'Hair Care',
    imageUri: 'https://images.unsplash.com/photo-1527799820374-dcf8d9a4e0f2?w=400&h=400&fit=crop&q=80',
  },
  {
    id: '5',
    name: 'Feminine Hygiene',
    imageUri: 'https://images.unsplash.com/photo-1585386959984-a4155223163e?w=400&h=400&fit=crop&q=80',
    offerLabel: 'UP TO 50% OFF',
  },
  {
    id: '6',
    name: 'Diaper & Wipes',
    imageUri: 'https://images.unsplash.com/photo-1584515933487-779824d29309?w=400&h=400&fit=crop&q=80',
  },
  {
    id: '7',
    name: 'Feeding Essentials',
    imageUri: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400&h=400&fit=crop&q=80',
  },
  {
    id: '8',
    name: 'Baby Skin & Bath',
    imageUri: 'https://images.unsplash.com/photo-1515488042361-ee00e8170dc4?w=400&h=400&fit=crop&q=80',
    offerLabel: 'UP TO 55% OFF',
  },
  {
    id: '9',
    name: 'Fitness Essentials',
    imageUri: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&h=400&fit=crop&q=80',
  },
  {
    id: '10',
    name: 'Vitamins & Minerals',
    imageUri: 'https://images.unsplash.com/photo-1584308664894-6d09c1f84d07?w=400&h=400&fit=crop&q=80',
  },
  {
    id: '11',
    name: 'Nutritional Drinks',
    imageUri: 'https://images.unsplash.com/photo-1571171637578-41bc2dd41cd7?w=400&h=400&fit=crop&q=80',
  },
  {
    id: '12',
    name: 'Ayurveda Essentials',
    imageUri: 'https://images.unsplash.com/photo-1607619056574-7b8d3ee197b0?w=400&h=400&fit=crop&q=80',
  },
  {
    id: '13',
    name: 'Health Devices',
    imageUri: 'https://images.unsplash.com/photo-1579684272160-0ff8e7f458f1?w=400&h=400&fit=crop&q=80',
  },
  {
    id: '14',
    name: 'Home Essentials',
    imageUri: 'https://images.unsplash.com/photo-1563453393397-3414fa577d22?w=400&h=400&fit=crop&q=80',
  },
  {
    id: '15',
    name: 'Pain Relief',
    imageUri: 'https://images.unsplash.com/photo-1471864190281-a93fc2b1c0ff?w=400&h=400&fit=crop&q=80',
  },
  {
    id: '16',
    name: 'Fever & Cold',
    imageUri: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=400&fit=crop&q=80',
  },
];

const CategoryImage = React.memo(({ uri }: { uri: string }) => {
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
      source={{ uri }}
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
      <CategoryImage uri={item.imageUri} />
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

const CategoriesGrid = () => {
  useEffect(() => {
    CATEGORIES.forEach((item) => {
      Image.prefetch(item.imageUri).catch(() => {});
    });
  }, []);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Categories</Text>
      <View style={styles.grid}>
        {CATEGORIES.map((item) => (
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
