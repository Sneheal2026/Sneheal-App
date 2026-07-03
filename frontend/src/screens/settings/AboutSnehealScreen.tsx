import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import Constants from 'expo-constants';
import theme from '@/styles/theme';

const { colors, spacing, typography, borderRadius, shadows, moderateScale } = theme;

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';
const APP_ICON = require('../../../assets/images/icon.png');

const STATS = [
  { value: '24/7', label: 'Support' },
  { value: '100%', label: 'Genuine meds' },
  { value: 'Fast', label: 'Delivery' },
];

const HIGHLIGHTS = [
  {
    icon: 'flash' as const,
    title: 'Lightning delivery',
    desc: 'Medicines at your doorstep, often within hours.',
    gradient: ['#FEF3C7', '#FFFBEB'] as const,
    accent: colors.warning,
  },
  {
    icon: 'scan' as const,
    title: 'Smart Rx scan',
    desc: 'Upload prescriptions and order in a few taps.',
    gradient: ['#DBEAFE', '#EFF6FF'] as const,
    accent: colors.primary,
  },
  {
    icon: 'shield-checkmark' as const,
    title: 'Trusted & safe',
    desc: 'Genuine medicines from verified pharmacies.',
    gradient: ['#D1FAE5', '#ECFDF5'] as const,
    accent: colors.success,
  },
  {
    icon: 'heart' as const,
    title: 'Care first',
    desc: 'Built around your health, not just orders.',
    gradient: ['#F3E8FF', '#FAF5FF'] as const,
    accent: colors.accentPurple,
  },
];

const VALUES = [
  { icon: 'people' as const, text: 'Healthcare accessible for every family' },
  { icon: 'lock-closed' as const, text: 'Patient safety and privacy come first' },
  { icon: 'rocket' as const, text: 'Technology that simplifies medicine ordering' },
];

const AboutSnehealScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={['#0F766E', '#1A73E8', '#4A9CF5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        >
          <View style={styles.heroOrb1} />
          <View style={styles.heroOrb2} />

          <SafeAreaView edges={['top']}>
            <View style={styles.header}>
              <Pressable
                onPress={() => navigation.goBack()}
                style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
                hitSlop={8}
                accessibilityLabel="Go back"
                accessibilityRole="button"
              >
                <Ionicons name="arrow-back" size={20} color={colors.white} />
              </Pressable>
              <Text style={styles.headerTitle}>About Sneheal</Text>
              <View style={styles.headerSpacer} />
            </View>

            <Animated.View entering={FadeInDown.duration(450)} style={styles.brandBlock}>
              <View style={styles.iconGlow}>
                <View style={styles.iconRing}>
                  <Image source={APP_ICON} style={styles.appIcon} resizeMode="contain" />
                </View>
              </View>
              <Text style={styles.brandName}>sneheal</Text>
              <Text style={styles.brandTagline}>Your trusted health companion</Text>
              <View style={styles.versionPill}>
                <Text style={styles.versionPillText}>v{APP_VERSION}</Text>
              </View>
            </Animated.View>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.body}>
          <Animated.View entering={FadeInDown.delay(60).duration(450)} style={styles.statsRow}>
            {STATS.map((stat) => (
              <View key={stat.label} style={styles.statCard}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100).duration(450)} style={styles.missionCard}>
            <View style={styles.missionAccent} />
            <Text style={styles.missionQuoteMark}>"</Text>
            <Text style={styles.missionTitle}>Our mission</Text>
            <Text style={styles.missionText}>
              Sneheal brings pharmacy care closer to home — helping you order medicines, manage
              prescriptions, and stay on top of your health without long waits or confusing steps.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(140).duration(450)}>
            <Text style={styles.sectionLabel}>What we offer</Text>
            <View style={styles.highlightsGrid}>
              {HIGHLIGHTS.map((item, index) => (
                <Animated.View
                  key={item.title}
                  entering={FadeIn.delay(180 + index * 50).duration(350)}
                  style={styles.highlightCard}
                >
                  <LinearGradient
                    colors={[...item.gradient]}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.highlightContent}>
                    <View style={[styles.highlightIcon, { backgroundColor: `${item.accent}22` }]}>
                      <Ionicons name={item.icon} size={22} color={item.accent} />
                    </View>
                    <Text style={styles.highlightTitle}>{item.title}</Text>
                    <Text style={styles.highlightDesc}>{item.desc}</Text>
                  </View>
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(450)} style={styles.valuesCard}>
            <Text style={styles.valuesTitle}>What we believe in</Text>
            {VALUES.map((item) => (
              <View key={item.text} style={styles.valueRow}>
                <LinearGradient
                  colors={[colors.secondary, colors.primary]}
                  style={styles.valueIconWrap}
                >
                  <Ionicons name={item.icon} size={16} color={colors.white} />
                </LinearGradient>
                <Text style={styles.valueText}>{item.text}</Text>
              </View>
            ))}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(240).duration(450)} style={styles.footer}>
            <View style={styles.footerHeart}>
              <Ionicons name="heart" size={14} color={colors.secondary} />
              <Text style={styles.footerBrand}>Made with care in India</Text>
            </View>
            <Text style={styles.footerCopy}>
              © {new Date().getFullYear()} Sneheal. All rights reserved.
            </Text>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxxxxl,
  },
  heroGradient: {
    paddingBottom: spacing.xxxl,
    borderBottomLeftRadius: borderRadius.xxl,
    borderBottomRightRadius: borderRadius.xxl,
    overflow: 'hidden',
  },
  heroOrb1: {
    position: 'absolute',
    top: -30,
    right: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  heroOrb2: {
    position: 'absolute',
    bottom: 20,
    left: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: moderateScale(17),
    fontWeight: '700',
    color: colors.white,
  },
  headerSpacer: {
    width: 40,
  },
  brandBlock: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  iconGlow: {
    padding: 8,
    borderRadius: borderRadius.xxl,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginBottom: spacing.xs,
  },
  iconRing: {
    padding: 6,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.white,
    ...shadows.lg,
  },
  appIcon: {
    width: 76,
    height: 76,
    borderRadius: 18,
  },
  brandName: {
    fontSize: moderateScale(32),
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -1.2,
  },
  brandTagline: {
    ...typography.bodySmall,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  versionPill: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  versionPillText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.5,
  },
  body: {
    paddingHorizontal: spacing.xl,
    marginTop: -spacing.lg,
    gap: spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    ...shadows.md,
  },
  statValue: {
    fontSize: moderateScale(16),
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.3,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  missionCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    overflow: 'hidden',
    ...shadows.sm,
  },
  missionAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.secondary,
    borderTopLeftRadius: borderRadius.xl,
    borderBottomLeftRadius: borderRadius.xl,
  },
  missionQuoteMark: {
    fontSize: 48,
    fontWeight: '800',
    color: `${colors.primary}18`,
    lineHeight: 48,
    marginBottom: -spacing.md,
  },
  missionTitle: {
    ...typography.bodySmall,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    letterSpacing: -0.2,
  },
  missionText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 23,
    fontWeight: '500',
  },
  sectionLabel: {
    fontSize: moderateScale(13),
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  highlightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  highlightCard: {
    width: '48%',
    flexGrow: 1,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    minHeight: 140,
    ...shadows.sm,
  },
  highlightContent: {
    padding: spacing.md,
    gap: spacing.xs,
    flex: 1,
  },
  highlightIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxs,
  },
  highlightTitle: {
    ...typography.bodySmall,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  highlightDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 17,
    fontWeight: '500',
  },
  valuesCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.sm,
  },
  valuesTitle: {
    ...typography.bodySmall,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  valueIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: {
    flex: 1,
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 22,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  footerHeart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  footerBrand: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  footerCopy: {
    ...typography.caption,
    color: colors.textMuted,
  },
  pressed: {
    opacity: 0.7,
  },
});

export default AboutSnehealScreen;
