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
        primarySoft: doctorTheme.primarySoft,
        accent: doctorTheme.accent,
        accentBg: '#E6FFFA',
        badgeBg: '#CCFBF1',
        iconName: 'medkit' as IoniconName,
        portalTitle: 'Doctor Portal',
        docLabel: 'License & Practice Details',
      }
    : {
        primary: deliveryTheme.primary,
        primarySoft: deliveryTheme.primarySoft,
        accent: deliveryTheme.accent,
        accentBg: deliveryTheme.accentLight,
        badgeBg: '#FEF3C7',
        iconName: 'bicycle' as IoniconName,
        portalTitle: 'Delivery Partner Portal',
        docLabel: 'Aadhaar & Driving License',
      };

  const handleCheckStatus = useCallback(
    async (silent = false) => {
      if (isChecking) return;
      if (!silent) setIsChecking(true);

      try {
        const freshUser = await refreshCurrentUser();
        if (freshUser?.verificationStatus === 'approved') {
          setFeedbackType('success');
          setFeedbackMessage('Account verified! Redirecting...');
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
          }, 600);
          return;
        }

        if (freshUser?.verificationStatus === 'rejected') {
          setFeedbackType('warning');
          setFeedbackMessage('Verification could not be approved. Please contact support.');
        } else if (!silent) {
          setFeedbackType('info');
          setFeedbackMessage('Verification is currently under review. Please check back shortly.');
          setTimeout(() => setFeedbackMessage(null), 4000);
        }
      } catch {
        if (!silent) {
          setFeedbackType('warning');
          setFeedbackMessage('Could not connect to server. Please try again.');
          setTimeout(() => setFeedbackMessage(null), 4000);
        }
      } finally {
        if (!silent) setIsChecking(false);
      }
    },
    [isChecking, navigation, refreshCurrentUser],
  );

  // Check automatically when app comes to foreground
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
      'Are you sure you want to sign out?',
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

  const handleContactSupport = () => {
    Alert.alert(
      'Sneheal Support',
      'Have questions regarding your verification status?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call Helpline',
          onPress: () => {
            void Linking.openURL('tel:18001234567').catch(() => {});
          },
        },
      ],
      { cancelable: true },
    );
  };

  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0,
  );

  const isRejected = user?.verificationStatus === 'rejected';

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={roleTheme.primary}
        translucent={Platform.OS === 'android'}
      />

      {/* Top Header with Portal Name & Logout */}
      <View style={[styles.header, { paddingTop: topInset + spacing.md }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.rolePill, { backgroundColor: roleTheme.primarySoft }]}>
            <Ionicons name={roleTheme.iconName} size={15} color={roleTheme.accent} />
            <Text style={styles.rolePillText}>{roleTheme.portalTitle}</Text>
          </View>
        </View>

        <Pressable
          onPress={handleConfirmLogout}
          style={({ pressed }) => [
            styles.logoutBtn,
            { backgroundColor: roleTheme.primarySoft },
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Sign Out"
        >
          <Ionicons name="log-out-outline" size={17} color="#FCA5A5" />
          <Text style={styles.logoutBtnText}>Sign Out</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + spacing.xl }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isChecking}
            onRefresh={() => handleCheckStatus(false)}
            tintColor={roleTheme.accent}
            colors={[roleTheme.primary]}
          />
        }
      >
        {/* Creative Verification Visual Card */}
        <View style={styles.heroCard}>
          <View
            style={[
              styles.iconGlowRing,
              { backgroundColor: isRejected ? '#FEE2E2' : roleTheme.accentBg },
            ]}
          >
            <View
              style={[
                styles.iconCore,
                { backgroundColor: isRejected ? '#DC2626' : roleTheme.primary },
              ]}
            >
              <Ionicons
                name={isRejected ? 'alert-circle' : 'hourglass-outline'}
                size={38}
                color={isRejected ? '#FFFFFF' : roleTheme.accent}
              />
            </View>
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: isRejected ? '#FEE2E2' : roleTheme.badgeBg },
            ]}
          >
            <Ionicons
              name={isRejected ? 'close-circle' : 'time'}
              size={14}
              color={isRejected ? '#DC2626' : isDoctor ? '#0F766E' : '#B45309'}
            />
            <Text
              style={[
                styles.statusBadgeText,
                { color: isRejected ? '#DC2626' : isDoctor ? '#0F766E' : '#B45309' },
              ]}
            >
              {isRejected ? 'Verification Declined' : 'Verification Under Process'}
            </Text>
          </View>

          <Text style={styles.title}>
            {isRejected
              ? 'Verification Update'
              : isDoctor
                ? 'Doctor Account Pending'
                : 'Partner Account Pending'}
          </Text>

          <Text style={styles.subtitle}>
            {isRejected
              ? 'Our compliance team could not verify the submitted credentials. Please contact our support team.'
              : 'Your credentials have been received. We are completing manual background verification before granting dashboard access.'}
          </Text>

          {user?.username ? (
            <View style={styles.userSnippet}>
              <Ionicons name="person-circle-outline" size={16} color="#64748B" />
              <Text style={styles.userSnippetText}>
                {isDoctor ? `Dr. ${user.username}` : user.username} • {user.phone}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Dynamic Feedback Banner if any */}
        {feedbackMessage && (
          <View
            style={[
              styles.feedbackBanner,
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
              size={18}
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

        {/* 3-Step Simple Progress Timeline */}
        <View style={styles.timelineCard}>
          <Text style={styles.sectionHeader}>Verification Status</Text>

          {/* Step 1 */}
          <View style={styles.timelineRow}>
            <View style={styles.timelineIconCol}>
              <View style={[styles.stepCircle, styles.stepCompleted]}>
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              </View>
              <View style={[styles.stepLine, styles.stepLineActive]} />
            </View>
            <View style={styles.timelineBody}>
              <Text style={styles.stepTitle}>Profile & Details Submitted</Text>
              <Text style={styles.stepSub}>Basic info and documents uploaded</Text>
            </View>
          </View>

          {/* Step 2 */}
          <View style={styles.timelineRow}>
            <View style={styles.timelineIconCol}>
              <View
                style={[
                  styles.stepCircle,
                  isRejected ? styles.stepDeclined : styles.stepInProgress,
                  { borderColor: isRejected ? '#DC2626' : roleTheme.accent },
                ]}
              >
                {isChecking ? (
                  <ActivityIndicator size="small" color={roleTheme.accent} />
                ) : (
                  <Ionicons
                    name={isRejected ? 'close' : 'sync-outline'}
                    size={14}
                    color={isRejected ? '#FFFFFF' : isDoctor ? doctorTheme.primary : deliveryTheme.accent}
                  />
                )}
              </View>
              <View style={styles.stepLine} />
            </View>
            <View style={styles.timelineBody}>
              <Text
                style={[
                  styles.stepTitle,
                  { color: isRejected ? '#DC2626' : theme.colors.textPrimary },
                ]}
              >
                {isRejected ? 'Review Not Approved' : 'Compliance & Manual Check'}
              </Text>
              <Text style={styles.stepSub}>{roleTheme.docLabel}</Text>
            </View>
          </View>

          {/* Step 3 */}
          <View style={styles.timelineRow}>
            <View style={styles.timelineIconCol}>
              <View style={[styles.stepCircle, styles.stepPending]}>
                <Ionicons name="lock-closed" size={12} color="#94A3B8" />
              </View>
            </View>
            <View style={styles.timelineBody}>
              <Text style={[styles.stepTitle, { color: '#94A3B8' }]}>
                {isDoctor ? 'Doctor Dashboard Unlocked' : 'Delivery Orders Unlocked'}
              </Text>
              <Text style={styles.stepSub}>Full system access granted upon approval</Text>
            </View>
          </View>
        </View>

        {/* Main Action Buttons */}
        <View style={styles.actionsContainer}>
          <Pressable
            onPress={() => handleCheckStatus(false)}
            disabled={isChecking}
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: roleTheme.primary },
              pressed && styles.pressed,
              isChecking && styles.disabledBtn,
            ]}
          >
            {isChecking ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="refresh" size={18} color="#FFFFFF" style={styles.btnIcon} />
                <Text style={styles.primaryBtnText}>Check Status</Text>
              </>
            )}
          </Pressable>

          <Pressable
            onPress={handleContactSupport}
            style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
          >
            <Ionicons name="chatbubbles-outline" size={17} color="#475569" style={styles.btnIcon} />
            <Text style={styles.secondaryBtnText}>Need Help? Contact Support</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
  },
  rolePillText: {
    ...typography.caption,
    color: '#F8FAFC',
    fontWeight: '600',
    fontSize: 12,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  logoutBtnText: {
    ...typography.caption,
    color: '#FCA5A5',
    fontWeight: '600',
    fontSize: 12,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconGlowRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconCore: {
    width: 66,
    height: 66,
    borderRadius: 33,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  statusBadgeText: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.3,
  },
  title: {
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
    paddingHorizontal: spacing.sm,
  },
  userSnippet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  userSnippetText: {
    ...typography.caption,
    color: '#475569',
    fontWeight: '500',
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: borderRadius.md,
    padding: spacing.md,
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
    ...typography.bodySmall,
    color: '#0369A1',
    flex: 1,
    fontSize: 13,
  },
  feedbackSuccessText: {
    color: '#047857',
  },
  feedbackWarningText: {
    color: '#B91C1C',
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeader: {
    ...typography.subtitle,
    color: '#0F172A',
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  timelineRow: {
    flexDirection: 'row',
  },
  timelineIconCol: {
    alignItems: 'center',
    width: 32,
    marginRight: spacing.sm,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  stepCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  stepInProgress: {
    backgroundColor: '#FFFFFF',
  },
  stepDeclined: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  stepPending: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  stepLine: {
    width: 2,
    flex: 1,
    minHeight: 28,
    backgroundColor: '#E2E8F0',
    marginVertical: 3,
  },
  stepLineActive: {
    backgroundColor: '#10B981',
  },
  timelineBody: {
    flex: 1,
    paddingBottom: spacing.md,
  },
  stepTitle: {
    ...typography.bodySmall,
    color: '#0F172A',
    fontWeight: '600',
  },
  stepSub: {
    ...typography.caption,
    color: '#64748B',
    marginTop: 2,
  },
  actionsContainer: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  primaryBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  primaryBtnText: {
    ...typography.button,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  btnIcon: {
    marginRight: 6,
  },
  disabledBtn: {
    opacity: 0.7,
  },
  secondaryBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 13,
    borderRadius: borderRadius.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  secondaryBtnText: {
    ...typography.bodySmall,
    color: '#475569',
    fontWeight: '600',
  },
});

export default VerificationPendingScreen;
