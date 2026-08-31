import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { SUPPORT_CONTACT } from '@/constants/helpFaq';
import { useTheme } from '@/hooks/useTheme';

type PharmacyAssistVariant = 'hero' | 'compact';

interface PharmacyAssistCardProps {
  variant?: PharmacyAssistVariant;
  query?: string;
}

const STEPS: { icon: 'call-outline' | 'list-outline' | 'bicycle-outline'; labelKey: string }[] = [
  { icon: 'call-outline', labelKey: 'search.stepCall' },
  { icon: 'list-outline', labelKey: 'search.stepShare' },
  { icon: 'bicycle-outline', labelKey: 'search.stepDeliver' },
];

const PharmacyAssistCard: React.FC<PharmacyAssistCardProps> = ({
  variant = 'hero',
  query,
}) => {
  const { t } = useTranslation();
  const { colors, spacing, typography, borderRadius, shadows, moderateScale } = useTheme();
  const phone = SUPPORT_CONTACT.pharmacyPhone;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        hero: {
          borderRadius: borderRadius.xl,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.primaryBorder,
          ...shadows.md,
        },
        heroInner: {
          padding: spacing.lg,
          gap: spacing.md,
        },
        liveRow: {
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'flex-start',
          gap: spacing.xs,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
          borderRadius: borderRadius.full,
          backgroundColor: colors.successLight,
        },
        liveDot: {
          width: moderateScale(7),
          height: moderateScale(7),
          borderRadius: moderateScale(4),
          backgroundColor: colors.success,
        },
        liveText: {
          ...typography.caption,
          fontWeight: '700',
          color: colors.success,
          letterSpacing: 0.2,
        },
        heroCopy: {
          gap: spacing.xs,
        },
        heroTitle: {
          ...typography.body,
          fontWeight: '800',
          color: colors.textPrimary,
        },
        heroSubtitle: {
          ...typography.caption,
          color: colors.textSecondary,
          lineHeight: moderateScale(18),
        },
        callBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          paddingVertical: spacing.md,
          borderRadius: borderRadius.full,
          backgroundColor: colors.primary,
        },
        callBtnPressed: {
          opacity: 0.85,
        },
        callBtnText: {
          ...typography.bodySmall,
          fontWeight: '800',
          color: colors.textInverse,
        },
        phoneText: {
          ...typography.caption,
          fontWeight: '700',
          color: colors.primary,
          textAlign: 'center',
          letterSpacing: 0.3,
        },
        stepsRow: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingTop: spacing.xs,
        },
        step: {
          flex: 1,
          alignItems: 'center',
          gap: spacing.xs,
        },
        stepIcon: {
          width: moderateScale(36),
          height: moderateScale(36),
          borderRadius: moderateScale(18),
          backgroundColor: colors.white,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: colors.primaryBorder,
        },
        stepLabel: {
          ...typography.caption,
          fontWeight: '700',
          color: colors.textSecondary,
          textAlign: 'center',
        },
        stepChevron: {
          marginBottom: moderateScale(16),
        },
        compact: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          backgroundColor: colors.surface,
          borderRadius: borderRadius.lg,
          padding: spacing.md,
          borderWidth: 1,
          borderColor: colors.primaryBorder,
          ...shadows.sm,
        },
        compactPressed: {
          opacity: 0.85,
        },
        compactIcon: {
          width: moderateScale(44),
          height: moderateScale(44),
          borderRadius: moderateScale(22),
          backgroundColor: colors.primarySurface,
          alignItems: 'center',
          justifyContent: 'center',
        },
        compactText: {
          flex: 1,
          minWidth: 0,
          gap: 2,
        },
        compactTitle: {
          ...typography.bodySmall,
          fontWeight: '800',
          color: colors.textPrimary,
        },
        compactSubtitle: {
          ...typography.caption,
          color: colors.textSecondary,
          lineHeight: moderateScale(16),
        },
        compactCta: {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: borderRadius.full,
          backgroundColor: colors.primary,
        },
        compactCtaText: {
          ...typography.caption,
          fontWeight: '800',
          color: colors.textInverse,
        },
      }),
    [borderRadius, colors, moderateScale, shadows, spacing, typography],
  );

  const handleCall = useCallback(async () => {
    const url = `tel:${phone.replace(/\s/g, '')}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(t('emergency.unableToCall'), t('search.callingUnsupported'));
    }
  }, [phone, t]);

  if (variant === 'compact') {
    return (
      <Pressable
        onPress={() => void handleCall()}
        style={({ pressed }) => [styles.compact, pressed && styles.compactPressed]}
        accessibilityRole="button"
        accessibilityLabel={t('search.callA11y', { phone })}
      >
        <View style={styles.compactIcon}>
          <Ionicons name="call" size={moderateScale(20)} color={colors.primary} />
        </View>
        <View style={styles.compactText}>
          <Text style={styles.compactTitle} numberOfLines={1}>
            {t('search.compactTitle')}
          </Text>
          <Text style={styles.compactSubtitle} numberOfLines={2}>
            {t('search.compactSubtitle')}
          </Text>
        </View>
        <View style={styles.compactCta}>
          <Text style={styles.compactCtaText}>{t('search.compactCta')}</Text>
        </View>
      </Pressable>
    );
  }

  const trimmedQuery = query?.trim();

  return (
    <Animated.View entering={FadeInDown.delay(80).duration(360)} style={styles.hero}>
      <LinearGradient
        colors={[colors.primarySurface, colors.surface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroInner}
      >
        <View style={styles.liveRow}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>{t('search.assistEyebrow')}</Text>
        </View>

        <View style={styles.heroCopy}>
          <Text style={styles.heroTitle}>{t('search.assistTitle')}</Text>
          <Text style={styles.heroSubtitle}>
            {trimmedQuery
              ? t('search.assistSubtitleWithQuery', { query: trimmedQuery })
              : t('search.assistSubtitle')}
          </Text>
        </View>

        <Pressable
          onPress={() => void handleCall()}
          style={({ pressed }) => [styles.callBtn, pressed && styles.callBtnPressed]}
          accessibilityRole="button"
          accessibilityLabel={t('search.callA11y', { phone })}
        >
          <Ionicons name="call" size={moderateScale(18)} color={colors.textInverse} />
          <Text style={styles.callBtnText}>{t('search.callCta')}</Text>
        </Pressable>

        <Text style={styles.phoneText}>{phone}</Text>

        <View style={styles.stepsRow}>
          {STEPS.map((step, index) => (
            <React.Fragment key={step.labelKey}>
              <View style={styles.step}>
                <View style={styles.stepIcon}>
                  <Ionicons name={step.icon} size={moderateScale(16)} color={colors.primary} />
                </View>
                <Text style={styles.stepLabel}>{t(step.labelKey)}</Text>
              </View>
              {index < STEPS.length - 1 ? (
                <Ionicons
                  name="chevron-forward"
                  size={moderateScale(14)}
                  color={colors.textMuted}
                  style={styles.stepChevron}
                />
              ) : null}
            </React.Fragment>
          ))}
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

export default PharmacyAssistCard;
