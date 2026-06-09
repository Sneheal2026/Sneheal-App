import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import theme from '@/styles/theme';
import globalStyles from '@/styles/globalStyles';

const { colors, spacing, typography, borderRadius, shadows } = theme;

const TODAY_APPOINTMENTS = [
  {
    id: '1',
    time: '10:30 AM',
    patient: 'Anita Desai',
    type: 'Follow-up',
    status: 'Confirmed',
  },
  {
    id: '2',
    time: '12:00 PM',
    patient: 'Vikram Joshi',
    type: 'New consultation',
    status: 'Confirmed',
  },
  {
    id: '3',
    time: '3:45 PM',
    patient: 'Sneha Patil',
    type: 'Prescription review',
    status: 'Pending',
  },
];

const STATS = [
  { label: 'Patients today', value: '12', icon: 'people' as const },
  { label: 'Consultations', value: '8', icon: 'chatbubbles' as const },
  { label: 'Prescriptions', value: '15', icon: 'document-text' as const },
];

const DoctorHomeScreen = () => {
  return (
    <SafeAreaView style={globalStyles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Welcome back, Doctor</Text>
              <Text style={styles.doctorName}>Dr. Sneheal Partner</Text>
            </View>
            <TouchableOpacity style={styles.profileBtn}>
              <Ionicons name="person" size={22} color={colors.textInverse} />
            </TouchableOpacity>
          </View>

          <View style={styles.clinicCard}>
            <Ionicons name="location" size={18} color={colors.accentGold} />
            <View style={styles.clinicInfo}>
              <Text style={styles.clinicLabel}>Your clinic</Text>
              <Text style={styles.clinicAddress}>
                204, Health Plaza, Shivaji Nagar, Pune — 411005
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.statsRow}>
          {STATS.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Ionicons name={stat.icon} size={20} color={colors.primary} />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today&apos;s appointments</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {TODAY_APPOINTMENTS.map((appt) => (
          <View key={appt.id} style={styles.apptCard}>
            <View style={styles.timeCol}>
              <Text style={styles.apptTime}>{appt.time}</Text>
            </View>
            <View style={styles.apptDivider} />
            <View style={styles.apptContent}>
              <Text style={styles.patientName}>{appt.patient}</Text>
              <Text style={styles.apptType}>{appt.type}</Text>
              <View
                style={[
                  styles.apptStatus,
                  appt.status === 'Pending' && styles.apptStatusPending,
                ]}
              >
                <Text
                  style={[
                    styles.apptStatusText,
                    appt.status === 'Pending' && styles.apptStatusTextPending,
                  ]}
                >
                  {appt.status}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.apptAction}>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Quick actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.quickAction} activeOpacity={0.85}>
            <View style={[styles.quickIcon, { backgroundColor: colors.infoLight }]}>
              <Ionicons name="add-circle" size={24} color={colors.primary} />
            </View>
            <Text style={styles.quickLabel}>New Rx</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} activeOpacity={0.85}>
            <View style={[styles.quickIcon, { backgroundColor: colors.successLight }]}>
              <Ionicons name="calendar" size={24} color={colors.success} />
            </View>
            <Text style={styles.quickLabel}>Schedule</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} activeOpacity={0.85}>
            <View style={[styles.quickIcon, { backgroundColor: colors.warningLight }]}>
              <Ionicons name="analytics" size={24} color={colors.warning} />
            </View>
            <Text style={styles.quickLabel}>Reports</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    borderBottomLeftRadius: borderRadius.xxl,
    borderBottomRightRadius: borderRadius.xxl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  greeting: {
    ...typography.bodySmall,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: spacing.xxs,
  },
  doctorName: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textInverse,
    letterSpacing: -0.3,
  },
  profileBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clinicCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  clinicInfo: {
    flex: 1,
  },
  clinicLabel: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.65)',
    marginBottom: 2,
  },
  clinicAddress: {
    ...typography.bodySmall,
    color: colors.textInverse,
    fontWeight: '600',
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginTop: -spacing.xl,
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.md,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  seeAll: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '700',
  },
  apptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  timeCol: {
    width: 64,
    alignItems: 'center',
  },
  apptTime: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  apptDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },
  apptContent: {
    flex: 1,
  },
  patientName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  apptType: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  apptStatus: {
    alignSelf: 'flex-start',
    backgroundColor: colors.successLight,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  apptStatusPending: {
    backgroundColor: colors.warningLight,
  },
  apptStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.success,
  },
  apptStatusTextPending: {
    color: colors.warning,
  },
  apptAction: {
    padding: spacing.xs,
  },
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  quickIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  quickLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});

export default DoctorHomeScreen;
