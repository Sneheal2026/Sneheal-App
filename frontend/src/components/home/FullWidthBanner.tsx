import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/styles/theme';

const { colors, spacing, typography, borderRadius } = theme;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FullWidthBanner = () => {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.accentPurple, '#2D6A4F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.bannerGradient}
      >
        {/* Left content */}
        <View style={styles.leftContent}>
          <Text style={styles.bannerTitle}>
            Buy 1 Full Body{'\n'}Checkup{'\n'}
            <Text style={styles.bannerHighlight}>Get 1 FREE!</Text>
          </Text>
          <TouchableOpacity style={styles.ctaBtn} activeOpacity={0.8}>
            <Text style={styles.ctaBtnText}>Book Now</Text>
          </TouchableOpacity>
        </View>

        {/* Right badge */}
        <View style={styles.rightBadgeContainer}>
          <View style={styles.liveRow}>
            <View style={styles.liveDot} />
            <Text style={styles.liveLabel}>Now Live</Text>
          </View>
          <View style={styles.pocketBadge}>
            <Ionicons name="wallet-outline" size={18} color={colors.accentGold} />
            <Text style={styles.pocketLabel}>POCKET EASY+</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  bannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    minHeight: 110,
  },
  leftContent: {
    flex: 1.4,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  bannerHighlight: {
    color: colors.accentGold,
    fontSize: 18,
  },
  ctaBtn: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
  },
  ctaBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.accentPurple,
  },
  rightBadgeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
    marginRight: spacing.xs,
  },
  liveLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.white,
    letterSpacing: 0.3,
  },
  pocketBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  pocketLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.white,
    letterSpacing: 0.5,
  },
});

export default FullWidthBanner;
