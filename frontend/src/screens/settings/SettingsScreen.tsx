import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Constants from 'expo-constants';
import SettingsListItem from '@/components/settings/SettingsListItem';
import SettingsQuickAction from '@/components/settings/SettingsQuickAction';
import theme from '@/styles/theme';
import type { AuthStackParamList } from '@/navigation/types';
import { getLanguageLabel } from '@/constants/languages';
import { getColorThemeOption } from '@/constants/colorThemes';
import { getAppLanguage } from '@/services/languageStorage';
import { useTheme } from '@/hooks/useTheme';

const { colors, spacing, typography, borderRadius, shadows } = theme;

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';
const ACCOUNT_AVATAR = require('../../../assets/images/Male_picture.webp');

const QUICK_ACTIONS = [
  { id: 'orders', icon: 'receipt-outline' as const, label: 'My orders' },
  { id: 'prescriptions', icon: 'document-text-outline' as const, label: 'Prescriptions' },
  { id: 'help', icon: 'chatbubble-ellipses-outline' as const, label: 'Need help?' },
];

const YOUR_INFO_ITEMS = [
  { id: 'addresses', icon: 'location-outline' as const, label: 'Saved addresses' },
  { id: 'reminders', icon: 'alarm-outline' as const, label: 'Medicine reminders' },
  { id: 'lab-reports', icon: 'flask-outline' as const, label: 'Lab reports' },
  { id: 'family', icon: 'people-outline' as const, label: 'Family members' },
];

const HEALTH_ITEMS = [
  { id: 'order-history', icon: 'time-outline' as const, label: 'Order history' },
  { id: 'upload-rx', icon: 'cloud-upload-outline' as const, label: 'Upload prescription' },
  { id: 'health-wallet', icon: 'wallet-outline' as const, label: 'Sneheal wallet' },
  { id: 'emergency', icon: 'medkit-outline' as const, label: 'Emergency contacts' },
];

const ACCOUNT_ITEMS = [
  { id: 'share', icon: 'share-outline' as const, label: 'Share the app' },
  { id: 'about', icon: 'information-circle-outline' as const, label: 'About Sneheal' },
  { id: 'language', icon: 'language-outline' as const, label: 'Language settings' },
  { id: 'color', icon: 'color-palette-outline' as const, label: 'Color theme' },
  { id: 'logout', icon: 'log-out-outline' as const, label: 'Log out', destructive: true },
];

const DEMO_ORDER = {
  orderId: '#SNH-4821',
  customerAddress: 'Nizamabad Bus Stop, Nizamabad, Telangana',
  customerCoords: { latitude: 18.6725, longitude: 78.0941 },
} as const;

const SettingsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { colors: themeColors, gradients, colorThemeId } = useTheme();
  const [currentLanguageLabel, setCurrentLanguageLabel] = useState('English');
  const currentColorLabel = getColorThemeOption(colorThemeId).label;

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadLanguage = async () => {
        const language = await getAppLanguage();
        if (active) {
          setCurrentLanguageLabel(getLanguageLabel(language));
        }
      };

      void loadLanguage();

      return () => {
        active = false;
      };
    }, []),
  );

  const handleItemPress = (id: string) => {
    if (id === 'addresses') {
      navigation.navigate('SavedAddresses' as never);
    } else if (id === 'reminders') {
      navigation.navigate('MedicineReminders' as never);
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
                accessibilityLabel="Go back"
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
                    accessibilityLabel="Account profile photo"
                  />
                </View>
                <Text style={styles.accountTitle}>Your account</Text>
                <Text style={styles.phoneText}>+91 98765 43210</Text>
              </Animated.View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.body}>
          <Animated.View entering={FadeInDown.delay(60).duration(400)}>
            <Pressable
              onPress={() => handleItemPress('health-profile')}
              style={({ pressed }) => [styles.promoBanner, pressed && styles.promoPressed]}
            >
              <View style={styles.promoTextBlock}>
                <Text style={styles.promoTitle}>Complete your health profile</Text>
                <View style={styles.promoLinkRow}>
                  <Text style={styles.promoLink}>Add details</Text>
                  <Ionicons name="arrow-forward" size={14} color={colors.secondary} />
                </View>
              </View>
              <View style={[styles.promoIconWrap, { backgroundColor: themeColors.primaryMuted }]}>
                <Ionicons name="heart-outline" size={28} color={themeColors.primary} />
              </View>
            </Pressable>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(100).duration(400)}
            style={styles.quickActionsRow}
          >
            {QUICK_ACTIONS.map((action) => (
              <SettingsQuickAction
                key={action.id}
                icon={action.icon}
                label={action.label}
                onPress={() => handleItemPress(action.id)}
              />
            ))}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(180).duration(400)}>
            <Text style={styles.sectionHeading}>Your information</Text>
            <View style={styles.card}>
              {YOUR_INFO_ITEMS.map((item, index) => (
                <SettingsListItem
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  onPress={() => handleItemPress(item.id)}
                  showDivider={index < YOUR_INFO_ITEMS.length - 1}
                />
              ))}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(220).duration(400)}>
            <View style={styles.card}>
              <Text style={styles.cardSectionTitle}>My Health</Text>
              {HEALTH_ITEMS.map((item, index) => (
                <SettingsListItem
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  onPress={() => handleItemPress(item.id)}
                  showDivider={index < HEALTH_ITEMS.length - 1}
                />
              ))}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(260).duration(400)}>
            <View style={styles.card}>
              <Text style={styles.cardSectionTitle}>Account & Support</Text>
              {ACCOUNT_ITEMS.map((item, index) => (
                <SettingsListItem
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
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
                            { backgroundColor: getColorThemeOption(colorThemeId).primary },
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
                    <Text style={styles.demoBtnText}>Customer</Text>
                  </Pressable>

                  <Pressable
                    onPress={demoNavigateDelivery}
                    style={[styles.demoDeliveryBtn, { borderColor: themeColors.primary }]}
                  >
                    <Ionicons name="navigate" size={18} color={themeColors.primary} />
                    <Text style={[styles.demoBtnText, { color: themeColors.primary }]}>
                      Delivery Agent
                    </Text>
                  </Pressable>
                </View>
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
  promoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(13, 148, 136, 0.12)',
  },
  promoPressed: {
    opacity: 0.85,
  },
  promoTextBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  promoTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  promoLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  promoLink: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.secondary,
  },
  promoIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
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
  demoBtnText: {
    ...typography.button,
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});

export default SettingsScreen;
