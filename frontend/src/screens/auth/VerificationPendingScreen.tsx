import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Platform,
  Pressable,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  AppState,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import type { AuthStackParamList } from '@/navigation/types';
import { resolveAuthRoute } from '@/navigation/resolveAuthRoute';
import { doctorTheme } from '@/components/doctor/doctorTheme';
import { deliveryTheme } from '@/components/delivery/deliveryTheme';
import { SUPPORT_CONTACT } from '@/constants/helpFaq';
import theme from '@/styles/theme';

const { spacing, typography, borderRadius, shadows } = theme;

type IoniconName = keyof typeof Ionicons.glyphMap;

const VerificationPendingScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { user, signOut, refreshCurrentUser } = useAuth();

  const [isChecking, setIsChecking] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'info' | 'success' | 'warning'>('info');

  const isDoctor = user?.role === 'doctor';
  const roleTheme = isDoctor
    ? {
        primary: doctorTheme.primary,
        primarySoft: '#116B74',
        accent: doctorTheme.accent,
        accentBg: '#E6FFFA',
        badgeBg: '#CCFBF1',
        iconName: 'medkit' as IoniconName,
        portalTitle: 'Doctor Portal',
      }
    : {
        primary: deliveryTheme.primary,
        primarySoft: deliveryTheme.primarySoft,
        accent: deliveryTheme.accent,
        accentBg: deliveryTheme.accentLight,
        badgeBg: '#FEF3C7',
        iconName: 'bicycle' as IoniconName,
        portalTitle: 'Partner Portal',
      };

  const handleCheckStatus = useCallback(
    async (silent = false) => {
      if (isChecking) return;
      if (!silent) setIsChecking(true);

      try {
        const freshUser = await refreshCurrentUser();
        if (freshUser?.verificationStatus === 'approved') {
          setFeedbackType('success');
          setFeedbackMessage('Account verified! Redirecting to dashboard...');
          const { route: nextRoute, params } = resolveAuthRoute(freshUser);
          setTimeout(() => {
            if (params) {
              navigation.reset({
                index: 0,
                routes: [{ name: nextRoute, params }],
              });
            } else {
              navigation.reset({
                index: 0,
                routes: [{ name: nextRoute }],
              });
            }
          }, 500);
          return;
        }

        if (freshUser?.verificationStatus === 'rejected') {
          setFeedbackType('warning');
          setFeedbackMessage('Verification could not be approved. Please contact Sneheal support.');
        } else if (!silent) {
          setFeedbackType('info');
          setFeedbackMessage('Your verification is under review. Please check back shortly.');
          setTimeout(() => setFeedbackMessage(null), 3500);
        }
      } catch {
        if (!silent) {
          setFeedbackType('warning');
          setFeedbackMessage('Unable to check status. Please check your internet connection.');
          setTimeout(() => setFeedbackMessage(null), 3500);
        }
      } finally {
        if (!silent) setIsChecking(false);
      }
    },
    [isChecking, navigation, refreshCurrentUser],
  );

  // Check automatically when user returns to app
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void handleCheckStatus(true);
      }
    });
    return () => subscription.remove();
  }, [handleCheckStatus]);

  const handleConfirmLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out from this account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
          },
        },
      ],
      { cancelable: true },
    );
  };

  const handleCallSupport = () => {
    const dialNumber = SUPPORT_CONTACT.phone.replace(/\s/g, '');
    void Linking.openURL(`tel:${dialNumber}`).catch(() => {});
  };

  const handleWhatsAppSupport = () => {
    const cleanPhone = SUPPORT_CONTACT.phone.replace(/\D/g, '');
    const message = encodeURIComponent(
      `Hello Sneheal Team, I registered as a ${isDoctor ? 'Doctor' : 'Delivery Partner'} (${user?.username || ''}, Phone: ${user?.phone || ''}) and would like to check my verification status.`,
    );
    void Linking.openURL(`https://wa.me/${cleanPhone}?text=${message}`).catch(() => {
      handleCallSupport();
    });
  };

  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0,
  );

  const isRejected = user?.verificationStatus === 'rejected';

  return (
    <View style={[styles.container, { backgroundColor: roleTheme.primary }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={roleTheme.primary}
        translucent={Platform.OS === 'android'}
      />

      {/* Top Header - Seamlessly merged into Safe Area */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: roleTheme.primary,
            paddingTop: topInset + (Platform.OS === 'android' ? spacing.sm : spacing.xs),
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <View style={[styles.brandPill, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
            <Ionicons name={roleTheme.iconName} size={15} color="#FFFFFF" />
            <Text style={styles.brandPillText}>Sneheal {roleTheme.portalTitle}</Text>
          </View>
        </View>

        <Pressable
          onPress={handleConfirmLogout}
          style={({ pressed }) => [
            styles.logoutBtn,
            { backgroundColor: 'rgba(255, 255, 255, 0.15)' },
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Sign Out"
        >
          <Ionicons name="log-out-outline" size={16} color="#FFFFFF" />
          <Text style={styles.logoutBtnText}>Sign Out</Text>
        </Pressable>
      </View>

      {/* Main Body with Clean Light Background */}
      <View style={styles.bodyWrapper}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isChecking}
              onRefresh={() => handleCheckStatus(false)}
              tintColor={roleTheme.primary}
              colors={[roleTheme.primary]}
            />
          }
        >
          {/* Main Verification Card */}
          <View style={styles.card}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: isRejected ? '#FEE2E2' : roleTheme.accentBg },
              ]}
            >
              <Ionicons
                name={isRejected ? 'alert-circle' : 'hourglass-outline'}
                size={40}
                color={isRejected ? '#DC2626' : isDoctor ? doctorTheme.primary : deliveryTheme.accent}
              />
            </View>

            <View
              style={[
                styles.statusBadge,
                { backgroundColor: isRejected ? '#FEE2E2' : '#FEF3C7' },
              ]}
            >
              <Ionicons
                name={isRejected ? 'close-circle' : 'time'}
                size={13}
                color={isRejected ? '#DC2626' : '#B45309'}
              />
              <Text
                style={[
                  styles.statusBadgeText,
                  { color: isRejected ? '#DC2626' : '#B45309' },
                ]}
              >
                {isRejected ? 'Verification Declined' : 'Verification Under Process'}
              </Text>
            </View>

            <Text style={styles.userTitle}>
              {isDoctor
                ? `Dr. ${user?.username || 'Doctor'}`
                : user?.username || 'Delivery Partner'}
            </Text>

            <Text style={styles.subtitle}>
              {isRejected
                ? 'Your registration could not be verified. Please contact our support desk below.'
                : 'Thank you for registering with Sneheal! Our team is reviewing your profile. You will get instant access to your flow as soon as you are verified.'}
            </Text>

            {/* Check Status Button */}
            <Pressable
              onPress={() => handleCheckStatus(false)}
              disabled={isChecking}
              style={({ pressed }) => [
                styles.checkBtn,
                { backgroundColor: roleTheme.primary },
                pressed && styles.pressed,
                isChecking && styles.disabledBtn,
              ]}
            >
              {isChecking ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="refresh" size={17} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.checkBtnText}>Check Verification Status</Text>
                </>
              )}
            </Pressable>

            {feedbackMessage && (
              <View
                style={[
                  styles.feedbackBox,
                  feedbackType === 'success' && styles.feedbackSuccess,
                  feedbackType === 'warning' && styles.feedbackWarning,
                ]}
              >
                <Ionicons
                  name={
                    feedbackType === 'success'
                      ? 'checkmark-circle'
                      : feedbackType === 'warning'
                        ? 'alert-circle'
                        : 'information-circle'
                  }
                  size={16}
                  color={
                    feedbackType === 'success'
                      ? '#059669'
                      : feedbackType === 'warning'
                        ? '#DC2626'
                        : '#0284C7'
                  }
                />
                <Text
                  style={[
                    styles.feedbackText,
                    feedbackType === 'success' && styles.feedbackSuccessText,
                    feedbackType === 'warning' && styles.feedbackWarningText,
                  ]}
                >
                  {feedbackMessage}
                </Text>
              </View>
            )}
          </View>

          {/* Simple Official Sneheal Support Card */}
          <View style={styles.supportCard}>
            <View style={styles.supportHeader}>
              <View style={styles.supportIconWrap}>
                <Ionicons name="headset" size={20} color={roleTheme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.supportTitle}>Need Immediate Verification?</Text>
                <Text style={styles.supportSubtitle}>
                  Contact Sneheal Support directly for express review
                </Text>
              </View>
            </View>

            <View style={styles.supportContactRow}>
              <View style={styles.contactItem}>
                <Ionicons name="call-outline" size={15} color="#475569" />
                <Text style={styles.contactText}>{SUPPORT_CONTACT.phone}</Text>
              </View>
              <View style={styles.contactItem}>
                <Ionicons name="mail-outline" size={15} color="#475569" />
                <Text style={styles.contactText}>{SUPPORT_CONTACT.email}</Text>
              </View>
            </View>

            <View style={styles.supportBtnRow}>
              <Pressable
                onPress={handleCallSupport}
                style={({ pressed }) => [styles.actionCallBtn, pressed && styles.pressed]}
              >
                <Ionicons name="call" size={15} color="#0F766E" />
                <Text style={styles.actionCallText}>Call Helpline</Text>
              </Pressable>

              <Pressable
                onPress={handleWhatsAppSupport}
                style={({ pressed }) => [styles.actionWhatsAppBtn, pressed && styles.pressed]}
              >
                <Ionicons name="logo-whatsapp" size={16} color="#FFFFFF" />
                <Text style={styles.actionWhatsAppText}>WhatsApp</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  brandPillText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  logoutBtnText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
  bodyWrapper: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    overflow: 'hidden',
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  statusBadgeText: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.2,
  },
  userTitle: {
    ...typography.h3,
    color: '#0F172A',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodySmall,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.lg,
  },
  checkBtn: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  checkBtnText: {
    ...typography.button,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  disabledBtn: {
    opacity: 0.7,
  },
  feedbackBox: {
    width: '100%',
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: borderRadius.md,
    padding: spacing.sm + 2,
  },
  feedbackSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  feedbackWarning: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  feedbackText: {
    ...typography.caption,
    color: '#0369A1',
    flex: 1,
    fontWeight: '500',
  },
  feedbackSuccessText: {
    color: '#047857',
  },
  feedbackWarningText: {
    color: '#B91C1C',
  },
  supportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  supportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  supportIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  supportTitle: {
    ...typography.bodySmall,
    color: '#0F172A',
    fontWeight: '700',
  },
  supportSubtitle: {
    ...typography.caption,
    color: '#64748B',
    marginTop: 1,
  },
  supportContactRow: {
    backgroundColor: '#F8FAFC',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    ...typography.caption,
    color: '#334155',
    fontWeight: '600',
  },
  supportBtnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionCallBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: borderRadius.md,
    backgroundColor: '#CCFBF1',
  },
  actionCallText: {
    ...typography.caption,
    color: '#0F766E',
    fontWeight: '700',
  },
  actionWhatsAppBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: borderRadius.md,
    backgroundColor: '#25D366',
  },
  actionWhatsAppText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default VerificationPendingScreen;
