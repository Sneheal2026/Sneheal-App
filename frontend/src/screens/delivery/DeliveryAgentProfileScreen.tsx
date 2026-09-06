import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import LogoutConfirmModal from '@/components/settings/LogoutConfirmModal';
import { deliveryTheme } from '@/components/delivery';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { getLanguageNativeLabel } from '@/constants/languages';
import type { AuthStackParamList } from '@/navigation/types';
import theme from '@/styles/theme';
import { formatPhoneNumber } from '@/utils';
import { toLocalPhone } from '@/utils/phone';
import { clearAllUserData } from '@/utils/logout';

const { spacing, typography, borderRadius, shadows } = theme;

type IoniconName = keyof typeof Ionicons.glyphMap;

type InfoRow = {
  icon: IoniconName;
  label: string;
  value: string;
};

type AccountItem = {
  id: string;
  icon: IoniconName;
  label: string;
  destructive?: boolean;
  trailing?: string;
};

const DeliveryAgentProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { user, signOut } = useAuth();
  const { language } = useLanguage();
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0,
  );

  const displayName = user?.username?.trim() || t('delivery.partnerDefault');
  const displayPhone = user?.phone
    ? formatPhoneNumber(toLocalPhone(user.phone))
    : t('delivery.profilePhoneUnavailable');
  const languageLabel = getLanguageNativeLabel(language);
  const partnerId = user?.id != null ? `DA-${String(user.id).padStart(5, '0')}` : '—';
  const memberSince = useMemo(() => {
    if (!user?.createdAt) return t('delivery.profileMemberSinceUnknown');
    const date = new Date(user.createdAt);
    if (Number.isNaN(date.getTime())) return t('delivery.profileMemberSinceUnknown');
    return date.toLocaleDateString(i18n.language, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, [i18n.language, t, user?.createdAt]);

  const infoRows: InfoRow[] = [
    { icon: 'person-outline', label: t('delivery.profileFullName'), value: displayName },
    { icon: 'call-outline', label: t('delivery.profileMobile'), value: displayPhone },
    { icon: 'bicycle-outline', label: t('delivery.profileRole'), value: t('auth.roleDeliveryAgent') },
    { icon: 'language-outline', label: t('delivery.profileLanguage'), value: languageLabel },
    { icon: 'id-card-outline', label: t('delivery.profilePartnerId'), value: partnerId },
    { icon: 'calendar-outline', label: t('delivery.profileMemberSince'), value: memberSince },
  ];

  const documentRows: InfoRow[] = [
    {
      icon: 'card-outline',
      label: t('delivery.profileAadhaar'),
      value: t('delivery.profileDocSubmitted'),
    },
    {
      icon: 'car-outline',
      label: t('delivery.profileLicense'),
      value: t('delivery.profileDocSubmitted'),
    },
  ];

  const accountItems: AccountItem[] = [
    {
      id: 'language',
      icon: 'language-outline',
      label: t('settings.languageSettings'),
      trailing: languageLabel,
    },
    { id: 'about', icon: 'information-circle-outline', label: t('settings.aboutSneheal') },
    { id: 'privacy', icon: 'shield-checkmark-outline', label: t('settings.privacyPolicy') },
    { id: 'logout', icon: 'log-out-outline', label: t('settings.logOut'), destructive: true },
  ];

  const handleAccountPress = (id: string) => {
    if (id === 'language') navigation.navigate('LanguageSettings');
    else if (id === 'about') navigation.navigate('AboutSneheal');
    else if (id === 'privacy') navigation.navigate('PrivacyPolicy');
    else if (id === 'logout') setLogoutVisible(true);
  };

  const handleConfirmLogout = useCallback(async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await clearAllUserData();
      await signOut();
      navigation.reset({
        index: 0,
        routes: [{ name: 'PhoneNumber' }],
      });
    } catch {
      setLoggingOut(false);
      setLogoutVisible(false);
      Alert.alert(t('settings.logOutFailedTitle'), t('settings.logOutFailedMessage'));
    }
  }, [loggingOut, navigation, signOut, t]);

  const handleCancelLogout = useCallback(() => {
    if (loggingOut) return;
    setLogoutVisible(false);
  }, [loggingOut]);

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={deliveryTheme.primary}
        translucent={Platform.OS === 'android'}
      />

      <View style={[styles.header, { paddingTop: topInset + spacing.md }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <Ionicons name="arrow-back" size={22} color={deliveryTheme.textOnDark} />
        </Pressable>

        <View style={styles.identity}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials || 'DA'}</Text>
          </View>
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.phone}>{displayPhone}</Text>
          <View style={styles.roleBadge}>
            <Ionicons name="bicycle" size={14} color={deliveryTheme.accent} />
            <Text style={styles.roleBadgeText}>{t('delivery.partnerDefault')}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.lg,
          paddingBottom: insets.bottom + spacing.xxl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>{t('delivery.profileDetails')}</Text>
        <View style={styles.card}>
          {infoRows.map((row, index) => (
            <View
              key={row.label}
              style={[styles.infoRow, index < infoRows.length - 1 && styles.infoRowBorder]}
            >
              <View style={styles.infoIcon}>
                <Ionicons name={row.icon} size={18} color={deliveryTheme.accent} />
              </View>
              <View style={styles.infoCopy}>
                <Text style={styles.infoLabel}>{row.label}</Text>
                <Text style={styles.infoValue}>{row.value}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.sectionLabel}>{t('delivery.profileDocuments')}</Text>
        <View style={styles.card}>
          <View style={styles.verificationBanner}>
            <View style={styles.verificationIcon}>
              <Ionicons name="time-outline" size={18} color="#B45309" />
            </View>
            <View style={styles.infoCopy}>
              <Text style={styles.verificationTitle}>{t('delivery.profileVerificationPending')}</Text>
              <Text style={styles.verificationSub}>{t('delivery.profileVerificationHint')}</Text>
            </View>
          </View>
          {documentRows.map((row, index) => (
            <View
              key={row.label}
              style={[styles.infoRow, index < documentRows.length - 1 && styles.infoRowBorder]}
            >
              <View style={styles.infoIcon}>
                <Ionicons name={row.icon} size={18} color={deliveryTheme.accent} />
              </View>
              <View style={styles.infoCopy}>
                <Text style={styles.infoLabel}>{row.label}</Text>
                <Text style={styles.infoValue}>{row.value}</Text>
              </View>
              <Ionicons name="checkmark-circle" size={20} color={deliveryTheme.online} />
            </View>
          ))}
        </View>

        <Text style={styles.sectionLabel}>{t('settings.accountSupport')}</Text>
        <View style={styles.card}>
          {accountItems.map((item, index) => (
            <Pressable
              key={item.id}
              onPress={() => handleAccountPress(item.id)}
              style={({ pressed }) => [
                styles.accountRow,
                index < accountItems.length - 1 && styles.infoRowBorder,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={item.label}
            >
              <View style={[styles.infoIcon, item.destructive && styles.logoutIcon]}>
                <Ionicons
                  name={item.icon}
                  size={18}
                  color={item.destructive ? theme.colors.error : deliveryTheme.accent}
                />
              </View>
              <Text style={[styles.accountLabel, item.destructive && styles.logoutLabel]}>
                {item.label}
              </Text>
              {item.trailing ? (
                <Text style={styles.accountTrailing}>{item.trailing}</Text>
              ) : null}
              <Ionicons
                name="chevron-forward"
                size={16}
                color={item.destructive ? theme.colors.error : theme.colors.textMuted}
              />
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <LogoutConfirmModal
        visible={logoutVisible}
        loading={loggingOut}
        onCancel={handleCancelLogout}
        onConfirm={handleConfirmLogout}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: deliveryTheme.background,
  },
  header: {
    backgroundColor: deliveryTheme.primary,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  identity: {
    alignItems: 'center',
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: deliveryTheme.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: deliveryTheme.accent,
  },
  avatarText: {
    ...typography.h3,
    color: deliveryTheme.accent,
    fontWeight: '800',
  },
  name: {
    ...typography.h3,
    color: deliveryTheme.textOnDark,
    fontWeight: '700',
    marginBottom: 4,
  },
  phone: {
    ...typography.bodySmall,
    color: deliveryTheme.textMutedOnDark,
    marginBottom: spacing.md,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(217,119,6,0.18)',
  },
  roleBadgeText: {
    ...typography.caption,
    fontWeight: '700',
    color: deliveryTheme.accentLight,
  },
  scroll: {
    flex: 1,
  },
  sectionLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  card: {
    backgroundColor: deliveryTheme.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: deliveryTheme.border,
    overflow: 'hidden',
    ...shadows.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  infoRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: deliveryTheme.border,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: deliveryTheme.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCopy: {
    flex: 1,
  },
  infoLabel: {
    ...typography.caption,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  verificationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#FFFBEB',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: deliveryTheme.border,
  },
  verificationIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: deliveryTheme.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verificationTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: '#92400E',
  },
  verificationSub: {
    ...typography.caption,
    color: '#B45309',
    marginTop: 2,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
  },
  accountLabel: {
    ...typography.bodySmall,
    flex: 1,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  accountTrailing: {
    ...typography.caption,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  logoutIcon: {
    backgroundColor: theme.colors.errorLight,
  },
  logoutLabel: {
    color: theme.colors.error,
  },
  pressed: {
    opacity: 0.88,
  },
});

export default DeliveryAgentProfileScreen;
