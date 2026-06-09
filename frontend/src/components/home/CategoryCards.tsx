import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import theme from '@/styles/theme';

const { colors, spacing, typography, borderRadius } = theme;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - spacing.xl * 2 - spacing.md) / 2;

interface CategoryCardData {
  id: string;
  title: string;
  offerText: string;
  imageUri: string;
  gradientColors: [string, string];
}

const CATEGORY_CARDS: CategoryCardData[] = [
  {
    id: '1',
    title: 'Lab Tests',
    offerText: 'Buy-1 Get-1 FREE',
    // Placeholder image URI — replace with real assets later
    imageUri: 'https://cdn-icons-png.flaticon.com/512/3174/3174780.png',
    gradientColors: ['#E8F5E9', '#C8E6C9'],
  },
  {
    id: '2',
    title: 'Medicines',
    offerText: 'Extra Rs.50 Credits',
    imageUri: 'https://cdn-icons-png.flaticon.com/512/2964/2964514.png',
    gradientColors: ['#FFF3E0', '#FFE0B2'],
  },
];

const CategoryCards = () => {
  return (
    <View style={styles.container}>
      {CATEGORY_CARDS.map((card) => (
        <TouchableOpacity key={card.id} style={[styles.card, { width: CARD_WIDTH }]} activeOpacity={0.8}>
          <LinearGradient
            colors={card.gradientColors}
            style={styles.imageContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Image source={{ uri: card.imageUri }} style={styles.cardImage} resizeMode="contain" />
          </LinearGradient>
          <Text style={styles.cardTitle}>{card.title}</Text>
          <View style={styles.offerBadge}>
            <Text style={styles.offerText}>{card.offerText}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  imageContainer: {
    width: '100%',
    height: CARD_WIDTH * 0.75,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImage: {
    width: CARD_WIDTH * 0.55,
    height: CARD_WIDTH * 0.55,
  },
  cardTitle: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  offerBadge: {
    backgroundColor: colors.accentPink,
    marginHorizontal: spacing.sm,
    marginVertical: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  offerText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
});

export default CategoryCards;
