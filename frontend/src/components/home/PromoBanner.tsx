import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import theme from '@/styles/theme';

const { colors, spacing, typography, borderRadius } = theme;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PromoBanner = () => {
  return (
    <View style={styles.container}>
      <View style={styles.bannerCard}>
        {/* Left: Promo Info */}
        <View style={styles.leftContent}>
          <View style={styles.tealBadge}>
            <Text style={styles.tealBadgeText}>FOR LIMITED PERIOD</Text>
          </View>
          <Text style={styles.promoTitle}>BUY 1 GET 1</Text>
          <Text style={styles.promoSubtitle}>on Full Body Checkups</Text>
        </View>

        {/* Right: Pocket Easy Badge */}
        <View style={styles.rightBadge}>
          <LinearGradient
            colors={[colors.accentTeal, '#006B5E']}
            style={styles.pocketBadgeGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            <Ionicons name="wallet-outline" size={16} color={colors.white} />
            <Text style={styles.pocketBadgeLabel}>POCKET</Text>
            <Text style={styles.pocketBadgeLabel}>EASY+</Text>
          </LinearGradient>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  leftContent: {
    flex: 1,
  },
  tealBadge: {
    backgroundColor: colors.accentTeal,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  tealBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.white,
    letterSpacing: 0.5,
  },
  promoTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.accentPurple,
    letterSpacing: 0.3,
  },
  promoSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
  },
  rightBadge: {
    marginLeft: spacing.md,
  },
  pocketBadgeGradient: {
    width: 64,
    height: 72,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  pocketBadgeLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.white,
    letterSpacing: 0.3,
    marginTop: spacing.xxs,
  },
});

export default PromoBanner;
