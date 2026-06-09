import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import theme from '@/styles/theme';

const { colors, spacing, typography, borderRadius } = theme;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_WIDTH = (SCREEN_WIDTH - spacing.xl * 2 - spacing.md * 2) / 3;

interface CategoryItem {
  id: string;
  name: string;
  imageUri: string;
  bgGradient: [string, string];
}

const CATEGORIES: CategoryItem[] = [
  {
    id: '1',
    name: 'Vitamins',
    imageUri: 'https://cdn-icons-png.flaticon.com/512/2920/2920306.png',
    bgGradient: ['#E3F2FD', '#BBDEFB'],
  },
  {
    id: '2',
    name: 'Pain Relief',
    imageUri: 'https://cdn-icons-png.flaticon.com/512/2964/2964514.png',
    bgGradient: ['#FFF3E0', '#FFE0B2'],
  },
  {
    id: '3',
    name: 'Diabetes',
    imageUri: 'https://cdn-icons-png.flaticon.com/512/3174/3174780.png',
    bgGradient: ['#E8F5E9', '#C8E6C9'],
  },
  {
    id: '4',
    name: 'Heart Care',
    imageUri: 'https://cdn-icons-png.flaticon.com/512/2920/2920306.png',
    bgGradient: ['#FCE4EC', '#F8BBD0'],
  },
  {
    id: '5',
    name: 'Skin Care',
    imageUri: 'https://cdn-icons-png.flaticon.com/512/2964/2964514.png',
    bgGradient: ['#F3E5F5', '#E1BEE7'],
  },
  {
    id: '6',
    name: 'Baby Care',
    imageUri: 'https://cdn-icons-png.flaticon.com/512/3174/3174780.png',
    bgGradient: ['#E0F7FA', '#B2EBF2'],
  },
];

const CategoriesGrid = () => {
  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Shop by Category</Text>
        <TouchableOpacity>
          <Text style={styles.seeAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      {/* Grid */}
      <View style={styles.grid}>
        {CATEGORIES.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.gridItem, { width: ITEM_WIDTH }]}
            activeOpacity={0.75}
          >
            <LinearGradient
              colors={item.bgGradient}
              style={styles.imageWrapper}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Image source={{ uri: item.imageUri }} style={styles.gridImage} resizeMode="contain" />
            </LinearGradient>
            <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h4,
    fontSize: 17,
    color: colors.textPrimary,
  },
  seeAllText: {
    ...typography.bodySmall,
    color: colors.accentTeal,
    fontWeight: 'bold',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    justifyContent: 'flex-start',
  },
  gridItem: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  imageWrapper: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH * 0.85,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  gridImage: {
    width: ITEM_WIDTH * 0.52,
    height: ITEM_WIDTH * 0.52,
  },
  itemName: {
    ...typography.caption,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});

export default CategoriesGrid;
