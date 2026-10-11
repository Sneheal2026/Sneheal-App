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
import DoctorAccountMenuItem from '@/components/doctor/DoctorAccountMenuItem';
import LogoutConfirmModal from '@/components/settings/LogoutConfirmModal';
import { doctorTheme } from '@/components/doctor/doctorTheme';
import { useAuth } from '@/context/AuthContext';
import type { AuthStackParamList } from '@/navigation/types';
import theme from '@/styles/theme';
import { clearAllUserData } from '@/utils/logout';
import { formatPhoneNumber } from '@/utils';
import { toLocalPhone } from '@/utils/phone';

const { spacing, typography, borderRadius } = theme;

type MenuId =
  | 'dashboard'
  | 'patients'
  | 'prescriptions'
  | 'alerts'
  | 'reports'
  | 'settings'
  | 'logout';

const DoctorAccountScreen = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { user, signOut } = useAuth();
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0,
  );

  const displayName = user?.username ? `Dr. ${user.username}` : t('doctor.accountDefaultName');
  const displayPhone = user?.phone
    ? formatPhoneNumber(toLocalPhone(user.phone))
    : null;

  const initials = useMemo(
    () =>
      displayName
        .replace(/^Dr\.\s*/i, '')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('') || 'DR',
    [displayName],
  );

  const showComingSoon = useCallback(() => {
    Alert.alert(t('doctor.accountComingSoonTitle'), t('doctor.accountComingSoonBody'));
  }, [t]);

  const onMenuPress = (id: MenuId) => {
    if (id === 'dashboard') {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('DoctorMain');
      }
      return;
    }
    if (id === 'patients') {
      navigation.navigate('DoctorPatients');
      return;
    }
    if (id === 'logout') {
      setLogoutVisible(true);
      return;
    }
    if (id === 'settings') {
      navigation.navigate('LanguageSettings');
      return;
    }
    showComingSoon();
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

  const menuItems: {
    id: MenuId;
    icon: keyof typeof Ionicons.glyphMap;
    labelKey: string;
    destructive?: boolean;
  }[] = [
    { id: 'dashboard', icon: 'home-outline', labelKey: 'doctor.menuDashboard' },
    { id: 'patients', icon: 'people-outline', labelKey: 'doctor.menuMyPatients' },
    { id: 'prescriptions', icon: 'document-text-outline', labelKey: 'doctor.menuPrescriptions' },
    { id: 'alerts', icon: 'pulse-outline', labelKey: 'doctor.menuAlerts' },
    { id: 'reports', icon: 'bar-chart-outline', labelKey: 'doctor.menuReports' },
    { id: 'settings', icon: 'settings-outline', labelKey: 'doctor.menuSettings' },
    { id: 'logout', icon: 'log-out-outline', labelKey: 'doctor.menuLogout', destructive: true },
  ];

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={doctorTheme.surface}
        translucent={Platform.OS === 'android'}
      />

      <View style={[styles.topBar, { paddingTop: topInset + spacing.sm }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <Ionicons name="close" size={22} color={doctorTheme.textPrimary} />
        </Pressable>
        <Text style={styles.topTitle}>{t('doctor.accountTitle')}</Text>
        <View style={styles.topBarSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingBottom: insets.bottom + spacing.xxl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileInitials}>{initials}</Text>
          </View>
          <View style={styles.profileText}>
            <Text style={styles.profileName} numberOfLines={1}>{displayName}</Text>
            {displayPhone ? (
              <Text style={styles.profilePhone}>{displayPhone}</Text>
            ) : null}
            <View style={styles.roleChip}>
              <Ionicons name="medkit-outline" size={14} color={doctorTheme.primary} />
              <Text style={styles.roleChipText}>{t('doctor.accountRole')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.menuBlock}>
          {menuItems.map((item) => (
            <DoctorAccountMenuItem
              key={item.id}
              icon={item.icon}
              label={t(item.labelKey)}
              destructive={item.destructive}
              onPress={() => onMenuPress(item.id)}
            />
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
    backgroundColor: doctorTheme.surface,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: doctorTheme.border,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: doctorTheme.background,
  },
  topTitle: {
    flex: 1,
    textAlign: 'center',
    ...typography.h4,
    fontWeight: '700',
    color: doctorTheme.textPrimary,
  },
  topBarSpacer: {
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    backgroundColor: doctorTheme.background,
    borderWidth: 1,
    borderColor: doctorTheme.border,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    backgroundColor: doctorTheme.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitials: {
    fontSize: 18,
    fontWeight: '800',
    color: doctorTheme.primary,
  },
  profileText: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    ...typography.h4,
    fontWeight: '700',
    color: doctorTheme.textPrimary,
  },
  profilePhone: {
    ...typography.bodySmall,
    color: doctorTheme.textSecondary,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    backgroundColor: doctorTheme.surface,
  },
  roleChipText: {
    ...typography.caption,
    fontWeight: '600',
    color: doctorTheme.primary,
  },
  menuBlock: {
    paddingTop: spacing.sm,
    gap: spacing.xxs,
  },
  pressed: {
    opacity: 0.8,
  },
});

export default DoctorAccountScreen;
