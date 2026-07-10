import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import DevResetStorageButton from '@/components/common/DevResetStorageButton';
import { doctorTheme } from '@/components/doctor/doctorTheme';
import theme from '@/styles/theme';

const { spacing, typography, borderRadius } = theme;

const DoctorHomeScreen = () => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0,
  );

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const displayName = user?.username
    ? `Dr. ${user.username}`
    : 'Doctor';

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={doctorTheme.primary}
        translucent={Platform.OS === 'android'}
      />

      <View style={[styles.header, { paddingTop: topInset + spacing.md }]}>
        <View style={styles.headerRow}>
          <View style={styles.identity}>
            <View style={styles.avatar}>
              <Ionicons name="medkit" size={22} color={doctorTheme.accent} />
            </View>
            <View style={styles.identityText}>
              <Text style={styles.greeting}>{greeting}</Text>
              <Text style={styles.name} numberOfLines={1}>
                {displayName}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View
        style={[
          styles.body,
          {
            paddingBottom: insets.bottom + spacing.xxl,
          },
        ]}
      >
        <Text style={styles.placeholderTitle}>Doctor home</Text>
        <Text style={styles.placeholderBody}>
          This space is ready — tell me what to add next.
        </Text>

        <DevResetStorageButton />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: doctorTheme.background,
  },
  header: {
    backgroundColor: doctorTheme.primary,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  identityText: {
    flex: 1,
  },
  greeting: {
    ...typography.caption,
    color: doctorTheme.textMutedOnDark,
    marginBottom: 2,
  },
  name: {
    ...typography.h4,
    color: doctorTheme.textOnDark,
    fontWeight: '700',
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: doctorTheme.textPrimary,
    marginBottom: spacing.sm,
  },
  placeholderBody: {
    ...typography.body,
    color: doctorTheme.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
});

export default DoctorHomeScreen;
