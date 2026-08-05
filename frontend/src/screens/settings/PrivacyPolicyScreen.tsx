import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/useTheme';
import { SUPPORT_CONTACT } from '@/constants/helpFaq';

const PRIVACY_SECTIONS = [
  'introduction',
  'dataWeCollect',
  'howWeUse',
  'sensitiveHealth',
  'devicePermissions',
  'sharing',
  'storageSecurity',
  'retention',
  'yourRights',
  'children',
  'changes',
  'contact',
] as const;

const PrivacyPolicyScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { colors, spacing, typography, borderRadius, shadows, moderateScale } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          backgroundColor: colors.surfaceSecondary,
        },
        safeTop: {
          backgroundColor: colors.white,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          backgroundColor: colors.white,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
        backBtn: {
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.surfaceSecondary,
        },
        headerTitle: {
          flex: 1,
          textAlign: 'center',
          ...typography.h3,
          fontSize: moderateScale(17),
          fontWeight: '700',
          color: colors.textPrimary,
        },
        headerSpacer: {
          width: 36,
        },
        scroll: {
          flex: 1,
        },
        scrollContent: {
          padding: spacing.xl,
          paddingBottom: spacing.xxxxxl,
          gap: spacing.md,
        },
        introCard: {
          backgroundColor: colors.white,
          borderRadius: borderRadius.lg,
          padding: spacing.lg,
          gap: spacing.sm,
          borderWidth: 1,
          borderColor: `${colors.primary}18`,
          ...shadows.sm,
        },
        introTitle: {
          ...typography.bodySmall,
          fontWeight: '700',
          color: colors.textPrimary,
        },
        introMeta: {
          ...typography.caption,
          color: colors.textMuted,
          fontWeight: '600',
        },
        introBody: {
          ...typography.caption,
          color: colors.textSecondary,
          lineHeight: 20,
        },
        sectionCard: {
          backgroundColor: colors.white,
          borderRadius: borderRadius.lg,
          padding: spacing.lg,
          gap: spacing.sm,
          ...shadows.sm,
        },
        sectionTitle: {
          ...typography.bodySmall,
          fontWeight: '700',
          color: colors.textPrimary,
          letterSpacing: -0.2,
        },
        sectionBody: {
          ...typography.caption,
          color: colors.textSecondary,
          lineHeight: 20,
        },
        contactRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          marginTop: spacing.xs,
        },
        contactLink: {
          ...typography.caption,
          color: colors.primary,
          fontWeight: '700',
        },
        footerNote: {
          ...typography.caption,
          color: colors.textMuted,
          textAlign: 'center',
          lineHeight: 18,
          paddingHorizontal: spacing.md,
          paddingTop: spacing.sm,
        },
        pressed: {
          opacity: 0.7,
        },
      }),
    [borderRadius, colors, moderateScale, shadows, spacing, typography],
  );

  const openEmail = () => {
    void Linking.openURL(`mailto:${SUPPORT_CONTACT.email}`);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
            hitSlop={8}
            accessibilityLabel={t('common.back')}
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('privacy.title')}</Text>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(400)} style={styles.introCard}>
          <Text style={styles.introTitle}>{t('privacy.introTitle')}</Text>
          <Text style={styles.introMeta}>{t('privacy.lastUpdated')}</Text>
          <Text style={styles.introBody}>{t('privacy.introBody')}</Text>
        </Animated.View>

        {PRIVACY_SECTIONS.map((key, index) => (
          <Animated.View
            key={key}
            entering={FadeInDown.delay(60 + index * 30).duration(400)}
            style={styles.sectionCard}
          >
            <Text style={styles.sectionTitle}>{t(`privacy.${key}Title`)}</Text>
            <Text style={styles.sectionBody}>{t(`privacy.${key}Body`)}</Text>
            {key === 'contact' ? (
              <Pressable
                onPress={openEmail}
                style={({ pressed }) => [styles.contactRow, pressed && styles.pressed]}
                accessibilityRole="link"
                accessibilityLabel={t('privacy.emailA11y', { email: SUPPORT_CONTACT.email })}
              >
                <Ionicons name="mail-outline" size={16} color={colors.primary} />
                <Text style={styles.contactLink}>{SUPPORT_CONTACT.email}</Text>
              </Pressable>
            ) : null}
          </Animated.View>
        ))}

        <Text style={styles.footerNote}>{t('privacy.footerNote')}</Text>
      </ScrollView>
    </View>
  );
};

export default PrivacyPolicyScreen;
