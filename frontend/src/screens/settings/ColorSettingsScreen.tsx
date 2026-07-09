import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  COLOR_THEME_OPTIONS,
  type ColorThemeId,
} from '@/constants/colorThemes';
import { useTheme } from '@/hooks/useTheme';

const ColorSettingsScreen = () => {
  const navigation = useNavigation();
  const { colors, spacing, typography, borderRadius, shadows, moderateScale, gradients, colorThemeId, setColorTheme } =
    useTheme();
  const [selected, setSelected] = useState<ColorThemeId | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          backgroundColor: colors.surfaceSecondary,
        },
        heroGradient: {
          paddingBottom: spacing.xl,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.sm,
          marginBottom: spacing.lg,
        },
        backBtn: {
          width: moderateScale(40),
          height: moderateScale(40),
          borderRadius: moderateScale(20),
          backgroundColor: colors.white,
          alignItems: 'center',
          justifyContent: 'center',
          ...shadows.sm,
        },
        headerTitle: {
          ...typography.h4,
          fontSize: moderateScale(18),
          fontWeight: '700',
          color: colors.textPrimary,
        },
        headerSpacer: {
          width: moderateScale(40),
        },
        pressed: {
          opacity: 0.75,
        },
        heroCard: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          marginHorizontal: spacing.xl,
          padding: spacing.lg,
          backgroundColor: 'rgba(255,255,255,0.92)',
          borderRadius: borderRadius.lg,
          borderWidth: 1,
          borderColor: colors.primaryBorder,
          ...shadows.sm,
        },
        heroIconWrap: {
          width: moderateScale(52),
          height: moderateScale(52),
          borderRadius: moderateScale(16),
          backgroundColor: colors.infoLight,
          alignItems: 'center',
          justifyContent: 'center',
        },
        heroTextBlock: {
          flex: 1,
          gap: spacing.xxs,
        },
        heroTitle: {
          ...typography.bodySmall,
          fontWeight: '800',
          color: colors.textPrimary,
          fontSize: moderateScale(15),
        },
        heroSubtitle: {
          ...typography.caption,
          color: colors.textSecondary,
          lineHeight: moderateScale(18),
        },
        scroll: {
          flex: 1,
          marginTop: -spacing.md,
        },
        scrollContent: {
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.md,
          paddingBottom: spacing.xxl,
          gap: spacing.md,
        },
        loadingWrap: {
          paddingVertical: spacing.xxl,
          alignItems: 'center',
        },
        optionsList: {
          gap: spacing.md,
        },
        optionCard: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          backgroundColor: colors.white,
          borderRadius: borderRadius.lg,
          padding: spacing.lg,
          borderWidth: 1.5,
          borderColor: colors.border,
          ...shadows.sm,
        },
        optionCardSelected: {
          borderColor: colors.primary,
          backgroundColor: colors.primarySurface,
          ...shadows.md,
        },
        swatch: {
          width: moderateScale(48),
          height: moderateScale(48),
          borderRadius: moderateScale(14),
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 2,
          borderColor: colors.white,
          ...shadows.sm,
        },
        optionTextBlock: {
          flex: 1,
          minWidth: 0,
          gap: 2,
        },
        optionLabel: {
          fontSize: moderateScale(17),
          fontWeight: '800',
          color: colors.textPrimary,
          letterSpacing: -0.2,
        },
        optionLabelSelected: {
          color: colors.primary,
        },
        optionDescription: {
          ...typography.caption,
          color: colors.textMuted,
          marginTop: 2,
        },
        colorCode: {
          ...typography.caption,
          fontWeight: '600',
          color: colors.textSecondary,
          marginTop: 2,
        },
        radioOuter: {
          width: moderateScale(24),
          height: moderateScale(24),
          borderRadius: moderateScale(12),
          borderWidth: 2,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
        },
        radioOuterSelected: {
          borderColor: colors.primary,
          backgroundColor: colors.primary,
        },
        footerNote: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: spacing.sm,
          marginTop: spacing.sm,
          padding: spacing.md,
          backgroundColor: colors.white,
          borderRadius: borderRadius.lg,
          borderWidth: 1,
          borderColor: colors.borderLight,
        },
        footerText: {
          flex: 1,
          ...typography.caption,
          color: colors.textMuted,
          lineHeight: moderateScale(18),
        },
      }),
    [borderRadius, colors, moderateScale, shadows, spacing, typography],
  );

  useFocusEffect(
    useCallback(() => {
      setSelected(colorThemeId);
      setLoading(false);
    }, [colorThemeId]),
  );

  const handleSelect = async (themeId: ColorThemeId) => {
    if (saving || selected === themeId) return;

    setSaving(true);
    setSelected(themeId);

    try {
      await setColorTheme(themeId);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={gradients.settingsHero}
        locations={[0, 0.55, 1]}
        style={styles.heroGradient}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
              hitSlop={8}
              accessibilityLabel="Go back"
              accessibilityRole="button"
            >
              <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
            </Pressable>
            <Text style={styles.headerTitle}>Color theme</Text>
            <View style={styles.headerSpacer} />
          </View>

          <Animated.View entering={FadeInDown.duration(400)} style={styles.heroCard}>
            <View style={styles.heroIconWrap}>
              <Ionicons name="color-palette" size={26} color={colors.primary} />
            </View>
            <View style={styles.heroTextBlock}>
              <Text style={styles.heroTitle}>Personalize Sneheal</Text>
              <Text style={styles.heroSubtitle}>
                Pick an accent color. It updates buttons, headers, and highlights across the app.
              </Text>
            </View>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : (
          <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.optionsList}>
            {COLOR_THEME_OPTIONS.map((option, index) => {
              const isSelected = selected === option.id;

              return (
                <Animated.View
                  key={option.id}
                  entering={FadeInDown.delay(100 + index * 60).duration(400)}
                >
                  <Pressable
                    onPress={() => void handleSelect(option.id)}
                    disabled={saving}
                    style={({ pressed }) => [
                      styles.optionCard,
                      isSelected && styles.optionCardSelected,
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`${option.label}, ${option.primary}`}
                  >
                    <View style={[styles.swatch, { backgroundColor: option.primary }]}>
                      {isSelected ? (
                        <Ionicons name="checkmark" size={20} color={colors.white} />
                      ) : null}
                    </View>

                    <View style={styles.optionTextBlock}>
                      <Text
                        style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}
                      >
                        {option.label}
                      </Text>
                      <Text style={styles.optionDescription}>{option.description}</Text>
                      <Text style={styles.colorCode}>{option.primary}</Text>
                    </View>

                    <View
                      style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}
                    >
                      {isSelected ? (
                        <Ionicons name="checkmark" size={14} color={colors.white} />
                      ) : null}
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(320).duration(400)} style={styles.footerNote}>
          <Ionicons name="information-circle-outline" size={18} color={colors.textMuted} />
          <Text style={styles.footerText}>
            Your color choice is saved on this device and applied automatically next time you open
            Sneheal.
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

export default ColorSettingsScreen;
