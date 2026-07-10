import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Platform,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ConditionDonut from '@/components/doctor/ConditionDonut';
import { doctorTheme } from '@/components/doctor/doctorTheme';
import {
  getDoctorPatientById,
  type ConditionSeverity,
  type PatientMedicineOrder,
  type PatientTestReport,
} from '@/constants/doctorPatients';
import type { AuthStackParamList } from '@/navigation/types';
import { openPatientReportPdf } from '@/utils/openPatientReportPdf';
import theme from '@/styles/theme';

const { spacing, typography, borderRadius } = theme;

const severityColor = (severity: ConditionSeverity) => {
  if (severity === 'severe') return doctorTheme.severitySevere;
  if (severity === 'moderate') return doctorTheme.severityModerate;
  return doctorTheme.severityMild;
};

const severityLabel = (severity: ConditionSeverity) =>
  severity.charAt(0).toUpperCase() + severity.slice(1);

const MedicineOrderRow = ({ order }: { order: PatientMedicineOrder }) => {
  const isDelivered = order.status === 'Delivered';
  return (
    <View style={styles.orderRow}>
      <View style={styles.orderTop}>
        <View style={styles.orderIds}>
          <Text style={styles.orderId}>{order.orderId}</Text>
          <Text style={styles.orderDate}>{order.dateLabel}</Text>
        </View>
        <View
          style={[
            styles.statusPill,
            {
              backgroundColor: isDelivered
                ? 'rgba(5,150,105,0.1)'
                : 'rgba(148,163,184,0.15)',
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              {
                color: isDelivered
                  ? doctorTheme.orderDelivered
                  : doctorTheme.orderCancelled,
              },
            ]}
          >
            {order.status}
          </Text>
        </View>
      </View>
      <View style={styles.medList}>
        {order.medicines.map((med) => (
          <Text key={`${order.id}-${med.name}`} style={styles.medLine}>
            {med.name}
            <Text style={styles.medQty}> × {med.quantity}</Text>
          </Text>
        ))}
      </View>
    </View>
  );
};

const TestReportRow = ({
  report,
  opening,
  onOpen,
}: {
  report: PatientTestReport;
  opening: boolean;
  onOpen: () => void;
}) => (
  <Pressable
    onPress={onOpen}
    disabled={opening}
    style={({ pressed }) => [styles.reportRow, pressed && styles.pressed]}
    accessibilityRole="button"
    accessibilityLabel={`Open ${report.title}`}
  >
    <View style={styles.reportIcon}>
      <Ionicons name="document-text" size={22} color={doctorTheme.reportAccent} />
    </View>
    <View style={styles.reportInfo}>
      <Text style={styles.reportTitle}>{report.title}</Text>
      <Text style={styles.reportMeta}>
        {report.dateLabel} · PDF
      </Text>
    </View>
    {opening ? (
      <ActivityIndicator size="small" color={doctorTheme.reportAccent} />
    ) : (
      <View style={styles.viewBtn}>
        <Ionicons name="eye-outline" size={16} color={doctorTheme.reportAccent} />
        <Text style={styles.viewBtnText}>View</Text>
      </View>
    )}
  </Pressable>
);

const PatientDetailsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<AuthStackParamList, 'PatientDetails'>>();
  const patient = getDoctorPatientById(route.params.patientId);
  const [openingReportId, setOpeningReportId] = useState<string | null>(null);

  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0,
  );

  const sexLabel = useMemo(() => {
    if (!patient) return '';
    if (patient.sex === 'F') return 'Female';
    if (patient.sex === 'M') return 'Male';
    return 'Other';
  }, [patient]);

  const handleOpenReport = useCallback(async (report: PatientTestReport) => {
    if (openingReportId) return;
    setOpeningReportId(report.id);
    try {
      await openPatientReportPdf(report.asset, report.fileName);
    } finally {
      setOpeningReportId(null);
    }
  }, [openingReportId]);

  if (!patient) {
    return (
      <View style={[styles.root, { paddingTop: topInset + spacing.lg }]}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={doctorTheme.primary}
          translucent={Platform.OS === 'android'}
        />
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={22} color={doctorTheme.textOnDark} />
          </Pressable>
          <Text style={styles.headerTitle}>Patient profile</Text>
        </View>
        <View style={styles.missing}>
          <Text style={styles.missingText}>Patient not found.</Text>
        </View>
      </View>
    );
  }

  const activeConditions = patient.conditions.filter((c) => c.name !== 'Other');

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={doctorTheme.primary}
        translucent={Platform.OS === 'android'}
      />

      <View style={[styles.header, { paddingTop: topInset + spacing.sm }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color={doctorTheme.textOnDark} />
        </Pressable>
        <Text style={styles.headerTitle}>Patient profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingBottom: insets.bottom + spacing.xxl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Identity */}
        <View style={styles.identityBlock}>
          <View style={styles.identityAvatar}>
            <Text style={styles.identityInitials}>{patient.initials}</Text>
          </View>
          <Text style={styles.patientName}>{patient.name}</Text>
          <Text style={styles.patientMeta}>
            {patient.age} yrs · {sexLabel} · Blood {patient.bloodGroup}
          </Text>
          <Text style={styles.lastVisit}>Last visit · {patient.lastVisitLabel}</Text>
        </View>

        {/* Vitals */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Vitals</Text>
          <View style={styles.vitalsStrip}>
            {patient.vitals.map((vital, index) => (
              <React.Fragment key={vital.id}>
                {index > 0 ? <View style={styles.vitalDivider} /> : null}
                <View style={styles.vitalCell}>
                  <Text style={styles.vitalValue}>{vital.value}</Text>
                  <Text style={styles.vitalLabel}>{vital.label}</Text>
                  {vital.unit ? (
                    <Text style={styles.vitalUnit}>{vital.unit}</Text>
                  ) : null}
                </View>
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Condition mix */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Condition mix</Text>
          <Text style={styles.sectionHint}>
            Share of care focus across active conditions
          </Text>
          <View style={styles.chartBlock}>
            <ConditionDonut conditions={patient.conditions} />
          </View>

          <View style={styles.conditionList}>
            {activeConditions.map((condition) => (
              <View key={condition.id} style={styles.conditionRow}>
                <View style={styles.conditionLeft}>
                  <View
                    style={[styles.conditionDot, { backgroundColor: condition.color }]}
                  />
                  <Text style={styles.conditionName}>{condition.name}</Text>
                </View>
                <View
                  style={[
                    styles.severityPill,
                    { backgroundColor: `${severityColor(condition.severity)}18` },
                  ]}
                >
                  <Text
                    style={[
                      styles.severityText,
                      { color: severityColor(condition.severity) },
                    ]}
                  >
                    {severityLabel(condition.severity)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Lab / test reports */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, styles.reportSectionLabel]}>Lab reports</Text>
          <Text style={[styles.sectionHint, styles.reportSectionHint]}>
            Uploaded test PDFs — tap to view or save
          </Text>
          <View style={styles.reportsList}>
            {patient.testReports.map((report) => (
              <TestReportRow
                key={report.id}
                report={report}
                opening={openingReportId === report.id}
                onOpen={() => {
                  void handleOpenReport(report);
                }}
              />
            ))}
          </View>
        </View>

        {/* Past medicine orders */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Past medicine orders</Text>
          <View style={styles.ordersList}>
            {patient.medicineOrders.map((order) => (
              <MedicineOrderRow key={order.id} order={order} />
            ))}
          </View>
        </View>

        {/* Contact — last */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, styles.contactSectionLabel]}>Contact</Text>
          <View style={styles.contactCard}>
            <Pressable
              onPress={() => {
                void (async () => {
                  const url = `tel:${patient.phone.replace(/\s/g, '')}`;
                  try {
                    const ok = await Linking.canOpenURL(url);
                    if (!ok) {
                      Alert.alert('Unable to call', 'Calling is not supported on this device.');
                      return;
                    }
                    await Linking.openURL(url);
                  } catch {
                    Alert.alert('Unable to call', 'Please try again.');
                  }
                })();
              }}
              style={({ pressed }) => [styles.contactRow, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={`Call ${patient.phone}`}
            >
              <View style={styles.contactIcon}>
                <Ionicons name="call-outline" size={18} color={doctorTheme.contactAccent} />
              </View>
              <View style={styles.contactText}>
                <Text style={styles.contactLabel}>Phone</Text>
                <Text style={styles.contactValue}>{patient.phone}</Text>
              </View>
            </Pressable>

            <View style={styles.contactDivider} />

            <Pressable
              onPress={() => {
                void (async () => {
                  const url = `mailto:${patient.email}`;
                  try {
                    const ok = await Linking.canOpenURL(url);
                    if (!ok) {
                      Alert.alert('Unable to email', 'Email is not set up on this device.');
                      return;
                    }
                    await Linking.openURL(url);
                  } catch {
                    Alert.alert('Unable to email', 'Please try again.');
                  }
                })();
              }}
              style={({ pressed }) => [styles.contactRow, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={`Email ${patient.email}`}
            >
              <View style={styles.contactIcon}>
                <Ionicons name="mail-outline" size={18} color={doctorTheme.contactAccent} />
              </View>
              <View style={styles.contactText}>
                <Text style={styles.contactLabel}>Email</Text>
                <Text style={styles.contactValue}>{patient.email}</Text>
              </View>
            </Pressable>

            <View style={styles.contactDivider} />

            <View style={styles.contactRow}>
              <View style={styles.contactIcon}>
                <Ionicons name="location-outline" size={18} color={doctorTheme.contactAccent} />
              </View>
              <View style={styles.contactText}>
                <Text style={styles.contactLabel}>Address</Text>
                <Text style={styles.contactValue}>{patient.address}</Text>
              </View>
            </View>

            {patient.emergencyContact ? (
              <>
                <View style={styles.contactDivider} />
                <Pressable
                  onPress={() => {
                    void (async () => {
                      const phone = patient.emergencyContact!.phone.replace(/\s/g, '');
                      const url = `tel:${phone}`;
                      try {
                        const ok = await Linking.canOpenURL(url);
                        if (!ok) {
                          Alert.alert('Unable to call', 'Calling is not supported on this device.');
                          return;
                        }
                        await Linking.openURL(url);
                      } catch {
                        Alert.alert('Unable to call', 'Please try again.');
                      }
                    })();
                  }}
                  style={({ pressed }) => [styles.contactRow, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel={`Call emergency contact ${patient.emergencyContact!.name}`}
                >
                  <View style={styles.contactIcon}>
                    <Ionicons name="people-outline" size={18} color={doctorTheme.contactAccent} />
                  </View>
                  <View style={styles.contactText}>
                    <Text style={styles.contactLabel}>
                      Emergency · {patient.emergencyContact.relation}
                    </Text>
                    <Text style={styles.contactValue}>
                      {patient.emergencyContact.name} · {patient.emergencyContact.phone}
                    </Text>
                  </View>
                </Pressable>
              </>
            ) : null}
          </View>
        </View>
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
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: doctorTheme.textOnDark,
  },
  headerSpacer: {
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  identityBlock: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  identityAvatar: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.xl,
    backgroundColor: doctorTheme.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  identityInitials: {
    fontSize: 20,
    fontWeight: '800',
    color: doctorTheme.primary,
  },
  patientName: {
    fontSize: 22,
    fontWeight: '800',
    color: doctorTheme.textPrimary,
    letterSpacing: -0.3,
    marginBottom: spacing.xxs,
  },
  patientMeta: {
    ...typography.bodySmall,
    color: doctorTheme.textSecondary,
    marginBottom: spacing.xs,
  },
  lastVisit: {
    ...typography.caption,
    color: doctorTheme.primarySoft,
    fontWeight: '600',
  },
  contactSectionLabel: {
    color: doctorTheme.contactMuted,
  },
  contactCard: {
    backgroundColor: doctorTheme.contactBg,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: doctorTheme.contactBorder,
    overflow: 'hidden',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  contactIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: doctorTheme.contactIconBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  contactText: {
    flex: 1,
  },
  contactLabel: {
    ...typography.caption,
    color: doctorTheme.contactAccentSoft,
    marginBottom: 2,
  },
  contactValue: {
    ...typography.bodySmall,
    color: doctorTheme.contactMuted,
    fontWeight: '600',
    lineHeight: 20,
  },
  contactDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: doctorTheme.contactBorder,
    marginLeft: spacing.md + 36 + spacing.md,
  },
  section: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: doctorTheme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  sectionHint: {
    ...typography.caption,
    color: doctorTheme.textSecondary,
    marginBottom: spacing.md,
    marginTop: -spacing.xs,
  },
  vitalsStrip: {
    flexDirection: 'row',
    backgroundColor: doctorTheme.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: doctorTheme.border,
    paddingVertical: spacing.md,
  },
  vitalCell: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  vitalDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: doctorTheme.border,
    alignSelf: 'stretch',
  },
  vitalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: doctorTheme.textPrimary,
    marginBottom: 2,
  },
  vitalLabel: {
    ...typography.caption,
    color: doctorTheme.textSecondary,
    textAlign: 'center',
  },
  vitalUnit: {
    fontSize: 10,
    color: doctorTheme.textSecondary,
    marginTop: 1,
  },
  chartBlock: {
    backgroundColor: doctorTheme.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: doctorTheme.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  conditionList: {
    gap: spacing.sm,
  },
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: doctorTheme.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: doctorTheme.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  conditionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  conditionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  conditionName: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: doctorTheme.textPrimary,
  },
  severityPill: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  severityText: {
    fontSize: 11,
    fontWeight: '700',
  },
  ordersList: {
    gap: spacing.sm,
  },
  reportsList: {
    gap: spacing.sm,
  },
  reportSectionLabel: {
    color: doctorTheme.reportMuted,
  },
  reportSectionHint: {
    color: doctorTheme.reportAccentSoft,
  },
  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: doctorTheme.reportBg,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: doctorTheme.reportBorder,
    padding: spacing.md,
    gap: spacing.md,
  },
  reportIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: doctorTheme.reportIconBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: doctorTheme.reportMuted,
    marginBottom: 2,
  },
  reportMeta: {
    ...typography.caption,
    color: doctorTheme.reportAccentSoft,
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: doctorTheme.reportIconBg,
    borderWidth: 1,
    borderColor: doctorTheme.reportBorder,
  },
  viewBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: doctorTheme.reportAccent,
  },
  orderRow: {
    backgroundColor: doctorTheme.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: doctorTheme.border,
    padding: spacing.md,
  },
  orderTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  orderIds: {
    flex: 1,
    marginRight: spacing.sm,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '700',
    color: doctorTheme.textPrimary,
    marginBottom: 2,
  },
  orderDate: {
    ...typography.caption,
    color: doctorTheme.textSecondary,
  },
  statusPill: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  medList: {
    gap: 4,
  },
  medLine: {
    ...typography.bodySmall,
    color: doctorTheme.textPrimary,
    fontWeight: '500',
  },
  medQty: {
    color: doctorTheme.textSecondary,
    fontWeight: '400',
  },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  missingText: {
    ...typography.body,
    color: doctorTheme.textSecondary,
  },
  pressed: {
    opacity: 0.85,
  },
});

export default PatientDetailsScreen;
