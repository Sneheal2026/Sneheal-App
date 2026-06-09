import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import theme from '@/styles/theme';

const { colors, spacing, typography, borderRadius, shadows, moderateScale } = theme;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const H_MARGIN = spacing.xl;
const INNER_PADDING = spacing.sm;
const GRID_GAP = spacing.sm;
const NUM_COLUMNS = 4;
const GRID_WIDTH =
  SCREEN_WIDTH - H_MARGIN * 2 - INNER_PADDING * 2;
const CARD_WIDTH =
  (GRID_WIDTH - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;
const CARD_HEIGHT = moderateScale(88);
const ICON_SIZE = moderateScale(36);

interface CategoryItem {
  id: string;
  name: string;
  imageUri: string;
}

const CATEGORIES: CategoryItem[] = [
  {
    id: '1',
    name: 'Pain Relief',
    imageUri: 'https://cdn-icons-png.flaticon.com/512/2966/2966333.png',
  },
  {
    id: '2',
    name: 'Vitamins',
    imageUri: 'https://cdn-icons-png.flaticon.com/512/2920/2920306.png',
  },
  {
    id: '3',
    name: 'First Aid',
    imageUri: 'https://cdn-icons-png.flaticon.com/512/2913/2913133.png',
  },
  {
    id: '4',
    name: 'Cold & Flu',
    imageUri: 'https://cdn-icons-png.flaticon.com/512/2966/2966326.png',
  },
  {
    id: '5',
    name: 'Skincare',
    imageUri: 'https://cdn-icons-png.flaticon.com/512/2913/2913310.png',
  },
  {
    id: '6',
    name: 'Baby Care',
    imageUri: 'https://cdn-icons-png.flaticon.com/512/2910/2910653.png',
  },
  {
    id: '7',
    name: 'Personal Care',
    imageUri: 'https://cdn-icons-png.flaticon.com/512/2910/2910788.png',
  },
  {
    id: '8',
    name: 'More',
    imageUri: 'https://cdn-icons-png.flaticon.com/512/1828/1828765.png',
  },
];

const CategoriesGrid = () => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Categories</Text>

      <View style={styles.grid}>
        {CATEGORIES.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.gridItem}
            activeOpacity={0.72}
          >
            <View style={styles.card}>
              <Image
                source={{ uri: item.imageUri }}
                style={styles.icon}
                resizeMode="contain"
              />
              <Text style={styles.itemName} numberOfLines={2}>
                {item.name}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginHorizontal: H_MARGIN,
    marginBottom: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    paddingHorizontal: INNER_PADDING,
    backgroundColor: '#FEF8F4',
    borderRadius: borderRadius.xl,
  },
  sectionTitle: {
    ...typography.h4,
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  gridItem: {
    width: CARD_WIDTH,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    ...shadows.sm,
  },
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    marginBottom: spacing.xs,
  },
  itemName: {
    ...typography.caption,
    fontSize: moderateScale(10.5),
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: moderateScale(13),
  },
});

export default CategoriesGrid;
