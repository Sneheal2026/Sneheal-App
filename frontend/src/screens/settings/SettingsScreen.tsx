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
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';
import SettingsListItem from '@/components/settings/SettingsListItem';
import SettingsQuickAction from '@/components/settings/SettingsQuickAction';
import theme from '@/styles/theme';
import type { AuthStackParamList } from '@/navigation/types';
import { getLanguageNativeLabel } from '@/constants/languages';
import { getColorThemeOption, getColorThemeSwatch } from '@/constants/colorThemes';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/context/AuthContext';
import { formatPhoneNumber } from '@/utils';
import { toLocalPhone } from '@/utils/phone';

const { colors, spacing, typography, borderRadius, shadows } = theme;

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';
const ACCOUNT_AVATAR = require('../../../assets/images/Male_picture.webp');

const QUICK_ACTIONS = [
  { id: 'orders', icon: 'receipt-outline' as const, labelKey: 'settings.myOrders' },
  { id: 'prescriptions', icon: 'document-text-outline' as const, labelKey: 'settings.prescriptions' },
  { id: 'help', icon: 'chatbubble-ellipses-outline' as const, labelKey: 'settings.needHelp' },
];

const YOUR_INFO_ITEMS = [
  { id: 'addresses', icon: 'location-outline' as const, labelKey: 'settings.savedAddresses' },
  { id: 'reminders', icon: 'alarm-outline' as const, labelKey: 'settings.medicineReminders' },
  { id: 'lab-reports', icon: 'flask-outline' as const, labelKey: 'settings.labReports' },
  { id: 'family', icon: 'people-outline' as const, labelKey: 'settings.familyMembers' },
];

const HEALTH_ITEMS = [
  { id: 'order-history', icon: 'time-outline' as const, labelKey: 'settings.orderHistory' },
  { id: 'upload-rx', icon: 'cloud-upload-outline' as const, labelKey: 'settings.uploadPrescription' },
  { id: 'emergency', icon: 'medkit-outline' as const, labelKey: 'settings.emergencyContacts' },
];

const ACCOUNT_ITEMS = [
  { id: 'share', icon: 'share-outline' as const, labelKey: 'settings.shareApp' },
  { id: 'about', icon: 'information-circle-outline' as const, labelKey: 'settings.aboutSneheal' },
  { id: 'language', icon: 'language-outline' as const, labelKey: 'settings.languageSettings' },
  { id: 'color', icon: 'color-palette-outline' as const, labelKey: 'settings.colorTheme' },
  { id: 'logout', icon: 'log-out-outline' as const, labelKey: 'settings.logOut', destructive: true },
];

const DEMO_ORDER = {
  orderId: '#SNH-4821',
  customerAddress: 'Nizamabad Bus Stop, Nizamabad, Telangana',
  customerCoords: { latitude: 18.6725, longitude: 78.0941 },
} as const;

const SettingsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { colors: themeColors, gradients, colorThemeId, customPrimary } = useTheme();
  const currentLanguageLabel = getLanguageNativeLabel(language);
  const currentColorLabel = getColorThemeOption(colorThemeId).label;
  const currentColorSwatch = getColorThemeSwatch(
    getColorThemeOption(colorThemeId),
    customPrimary,
  );
  const displayName = user?.username?.trim() || t('common.yourAccount');
  const displayPhone = user?.phone
    ? formatPhoneNumber(toLocalPhone(user.phone))
    : null;

  const handleItemPress = (id: string) => {
    if (id === 'addresses') {
      navigation.navigate('SavedAddresses' as never);
    } else if (id === 'reminders') {
      navigation.navigate('MedicineReminders' as never);
    } else if (id === 'family') {
      navigation.navigate('FamilyMembers');
    } else if (id === 'emergency') {
      navigation.navigate('EmergencyContacts');
    } else if (id === 'prescriptions' || id === 'upload-rx') {
      navigation.navigate('Prescriptions');
    } else if (id === 'help') {
      navigation.navigate('HelpAndSupport' as never);
    } else if (id === 'share') {
      navigation.navigate('ShareApp' as never);
    } else if (id === 'about') {
      navigation.navigate('AboutSneheal' as never);
    } else if (id === 'language') {
      navigation.navigate('LanguageSettings');
    } else if (id === 'color') {
      navigation.navigate('ColorSettings');
    }
  };

  const demoNavigateCustomer = () => {
    navigation.navigate('CustomerTracking', {
      orderId: DEMO_ORDER.orderId,
      customerCoords: DEMO_ORDER.customerCoords,
      customerAddress: DEMO_ORDER.customerAddress,
    });
  };

  const demoNavigateDelivery = () => {
    navigation.navigate('DeliveryNavigation', {
      orderId: DEMO_ORDER.orderId,
      customerAddress: DEMO_ORDER.customerAddress,
      customerCoords: DEMO_ORDER.customerCoords,
    });
  };

  const demoNavigateDoctor = () => {
    navigation.navigate('DoctorMain');
  };

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces
      >
        <LinearGradient
          colors={gradients.settingsHero}
          locations={[0, 0.45, 1]}
          style={styles.heroGradient}
        >
          <SafeAreaView edges={['top']}>
            <View style={styles.heroInner}>
              <Pressable
                onPress={() => navigation.goBack()}
                style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel={t('common.back')}
                accessibilityRole="button"
              >
                <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
              </Pressable>

              <Animated.View entering={FadeInDown.duration(400)} style={styles.profileBlock}>
                <View style={styles.avatarRing}>
                  <Image
                    source={ACCOUNT_AVATAR}
                    style={styles.avatar}
                    resizeMode="cover"
                    accessibilityLabel={t('settings.profilePhotoA11y')}
                  />
                </View>
                <Text style={styles.accountTitle}>{displayName}</Text>
                {displayPhone ? (
                  <Text style={styles.phoneText}>{displayPhone}</Text>
                ) : null}
              </Animated.View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.body}>
          <Animated.View
            entering={FadeInDown.delay(60).duration(400)}
            style={styles.quickActionsRow}
          >
            {QUICK_ACTIONS.map((action) => (
              <SettingsQuickAction
                key={action.id}
                icon={action.icon}
                label={t(action.labelKey)}
                onPress={() => handleItemPress(action.id)}
              />
            ))}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(180).duration(400)}>
            <Text style={styles.sectionHeading}>{t('settings.yourInformation')}</Text>
            <View style={styles.card}>
              {YOUR_INFO_ITEMS.map((item, index) => (
                <SettingsListItem
                  key={item.id}
                  icon={item.icon}
                  label={t(item.labelKey)}
                  onPress={() => handleItemPress(item.id)}
                  showDivider={index < YOUR_INFO_ITEMS.length - 1}
                />
              ))}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(220).duration(400)}>
            <View style={styles.card}>
              <Text style={styles.cardSectionTitle}>{t('settings.myHealth')}</Text>
              {HEALTH_ITEMS.map((item, index) => (
                <SettingsListItem
                  key={item.id}
                  icon={item.icon}
                  label={t(item.labelKey)}
                  onPress={() => handleItemPress(item.id)}
                  showDivider={index < HEALTH_ITEMS.length - 1}
                />
              ))}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(260).duration(400)}>
            <View style={styles.card}>
              <Text style={styles.cardSectionTitle}>{t('settings.accountSupport')}</Text>
              {ACCOUNT_ITEMS.map((item, index) => (
                <SettingsListItem
                  key={item.id}
                  icon={item.icon}
                  label={t(item.labelKey)}
                  onPress={() => handleItemPress(item.id)}
                  showDivider={index < ACCOUNT_ITEMS.length - 1}
                  destructive={'destructive' in item && item.destructive}
                  trailing={
                    item.id === 'language' ? (
                      <View style={styles.languageTrailing}>
                        <Text style={styles.languageTrailingText}>{currentLanguageLabel}</Text>
                        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                      </View>
                    ) : item.id === 'color' ? (
                      <View style={styles.languageTrailing}>
                        <View
                          style={[
                            styles.colorSwatch,
                            { backgroundColor: currentColorSwatch },
                          ]}
                        />
                        <Text style={styles.languageTrailingText}>{currentColorLabel}</Text>
                        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                      </View>
                    ) : undefined
                  }
                />
              ))}

              <View style={styles.demoActionsBlock}>
                <View style={styles.demoActions}>
                  <Pressable onPress={demoNavigateCustomer} style={[styles.demoCustomerBtn, { backgroundColor: themeColors.primary }]}>
                    <Ionicons name="bicycle" size={18} color="#fff" />
                    <Text style={styles.demoBtnText}>{t('settings.demoCustomer')}</Text>
                  </Pressable>

                  <Pressable
                    onPress={demoNavigateDelivery}
                    style={[styles.demoDeliveryBtn, { borderColor: themeColors.primary }]}
                  >
                    <Ionicons name="navigate" size={18} color={themeColors.primary} />
                    <Text style={[styles.demoBtnText, { color: themeColors.primary }]}>
                      {t('settings.demoDeliveryAgent')}
                    </Text>
                  </Pressable>
                </View>

                <Pressable
                  onPress={demoNavigateDoctor}
                  style={[styles.demoDoctorBtn, { borderColor: themeColors.primary }]}
                  accessibilityRole="button"
                  accessibilityLabel={t('settings.shiftToDoctor')}
                >
                  <Ionicons name="medkit-outline" size={18} color={themeColors.primary} />
                  <Text style={[styles.demoBtnText, { color: themeColors.primary }]}>
                    {t('settings.shiftToDoctorBtn')}
                  </Text>
                </Pressable>
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.footer}>
            <Text style={styles.brandName}>sneheal</Text>
            <Text style={styles.versionText}>v{APP_VERSION}</Text>
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
    paddingBottom: spacing.xxl,
  },
  heroInner: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
    marginBottom: spacing.lg,
  },
  backBtnPressed: {
    opacity: 0.7,
  },
  profileBlock: {
    alignItems: 'center',
  },
  avatarRing: {
    padding: 4,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.6)',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.white,
    overflow: 'hidden',
    ...shadows.sm,
  },
  accountTitle: {
    ...typography.h3,
    fontSize: 22,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  phoneText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  body: {
    paddingHorizontal: spacing.xl,
    marginTop: -spacing.md,
    gap: spacing.lg,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sectionHeading: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    marginLeft: spacing.xxs,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  cardSectionTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.textPrimary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xs,
  },
  footer: {
    alignItems: 'center',
    paddingTop: spacing.md,
    gap: spacing.xxs,
  },
  brandName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.border,
    letterSpacing: -0.5,
  },
  versionText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  languageTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  languageTrailingText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  colorSwatch: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: colors.border,
  },

  demoActionsBlock: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    marginTop: spacing.lg,
  },
  demoActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  demoCustomerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  demoDeliveryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  demoDoctorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
    ...shadows.sm,
  },
  demoBtnText: {
    ...typography.button,
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});

export default SettingsScreen;
