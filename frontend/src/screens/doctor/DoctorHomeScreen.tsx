import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Platform,
  Pressable,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import DevResetStorageButton from '@/components/common/DevResetStorageButton';
import { doctorTheme } from '@/components/doctor/doctorTheme';
import { DOCTOR_PATIENTS } from '@/constants/doctorPatients';
import type { AuthStackParamList } from '@/navigation/types';
import theme from '@/styles/theme';

const { spacing, typography, borderRadius } = theme;

const DoctorHomeScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { user } = useAuth();
  const patient = DOCTOR_PATIENTS[0];

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

  const displayName = user?.username ? `Dr. ${user.username}` : 'Doctor';

  const shiftToCustomer = () => {
    navigation.navigate('Main');
  };

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

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.xl,
          paddingBottom: insets.bottom + spacing.xxl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>Your patient</Text>

        <Pressable
          onPress={() => navigation.navigate('PatientDetails', { patientId: patient.id })}
          style={({ pressed }) => [styles.patientRow, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`Open profile for ${patient.name}`}
        >
          <View style={styles.patientAvatar}>
            <Text style={styles.patientInitials}>{patient.initials}</Text>
          </View>
          <View style={styles.patientInfo}>
            <Text style={styles.patientName}>{patient.name}</Text>
            <Text style={styles.patientMeta}>
              {patient.age} · {patient.sex} · Last visit {patient.lastVisitLabel}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={doctorTheme.textSecondary} />
        </Pressable>

        <Pressable
          onPress={shiftToCustomer}
          style={({ pressed }) => [styles.shiftToCustomerBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Shift to customer screen"
        >
          <Ionicons name="swap-horizontal" size={18} color={doctorTheme.primary} />
          <Text style={styles.shiftToCustomerText}>Shift to Customer</Text>
        </Pressable>

        <DevResetStorageButton />
      </ScrollView>
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
  scroll: {
    flex: 1,
  },
  shiftToCustomerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: doctorTheme.primary,
    backgroundColor: doctorTheme.surface,
  },
  shiftToCustomerText: {
    ...typography.button,
    fontSize: 14,
    fontWeight: '700',
    color: doctorTheme.primary,
  },
  sectionLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: doctorTheme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.md,
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: doctorTheme.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: doctorTheme.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  patientAvatar: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: doctorTheme.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientInitials: {
    fontSize: 15,
    fontWeight: '800',
    color: doctorTheme.primary,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '700',
    color: doctorTheme.textPrimary,
    marginBottom: 2,
  },
  patientMeta: {
    ...typography.caption,
    color: doctorTheme.textSecondary,
  },
  pressed: {
    opacity: 0.88,
  },
});

export default DoctorHomeScreen;
