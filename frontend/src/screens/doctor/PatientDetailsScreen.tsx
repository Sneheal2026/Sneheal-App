import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Platform,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ChartSection from '@/components/doctor/ChartSection';
import ImagePreviewModal from '@/components/doctor/ImagePreviewModal';
import MedicineOrderCard from '@/components/doctor/MedicineOrderCard';
import PrescriptionGallery from '@/components/doctor/PrescriptionGallery';
import ReportFileRow from '@/components/doctor/ReportFileRow';
import { doctorTheme } from '@/components/doctor/doctorTheme';
import type { AuthStackParamList } from '@/navigation/types';
import type { DoctorCustomer, DoctorOrder, DoctorPrescription } from '@/types/doctor';
import type { HealthReport } from '@/types/report';
import { ApiError } from '@/services/apiClient';
import {
  fetchDoctorCustomer,
  fetchDoctorOrders,
  fetchDoctorPrescriptions,
  fetchDoctorReports,
} from '@/services/doctorService';
import { isHealthReportImage } from '@/utils/healthReportFile';
import { downloadHealthReport } from '@/utils/downloadHealthReport';
import theme from '@/styles/theme';
import { useTranslation } from 'react-i18next';
import { formatDoctorPatientPhone } from '@/utils/doctorPatientPhone';

const { spacing, typography, borderRadius } = theme;

const formatDate = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const initialsFor = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'C';

const PatientDetailsScreen = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<AuthStackParamList, 'PatientDetails'>>();
  const userId = route.params.userId;

  const [customer, setCustomer] = useState<DoctorCustomer | null>(null);
  const [orders, setOrders] = useState<DoctorOrder[]>([]);
  const [prescriptions, setPrescriptions] = useState<DoctorPrescription[]>([]);
  const [reports, setReports] = useState<HealthReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState('');
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [reportBusyId, setReportBusyId] = useState<string | null>(null);

  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0,
  );

  const load = useCallback(
    async (mode: 'initial' | 'refresh') => {
      if (mode === 'refresh') setRefreshing(true);
      else setLoading(true);
      setError('');
      setMissing(false);

      try {
        const [profile, orderRows, rxRows, reportRows] = await Promise.all([
          fetchDoctorCustomer(userId),
          fetchDoctorOrders(userId),
          fetchDoctorPrescriptions(userId),
          fetchDoctorReports(userId),
        ]);
        setCustomer(profile);
        setOrders(orderRows ?? []);
        setPrescriptions(rxRows ?? []);
        setReports(reportRows ?? []);
      } catch (err) {
        const message = err instanceof Error ? err.message : t('doctor.couldNotLoadChart');
        if (mode === 'refresh') {
          Alert.alert(t('doctor.couldNotLoadChart'), message);
          return;
        }
        setCustomer(null);
        if (err instanceof ApiError && err.status === 404) {
          setMissing(true);
        } else {
          setError(message);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [t, userId],
  );

  useFocusEffect(
    useCallback(() => {
      void load('initial');
    }, [load]),
  );

  const statusLabel = (status: string) => {
    if (status === 'delivered') return t('doctor.statusDelivered');
    if (status === 'out_for_delivery') return t('doctor.statusOutForDelivery');
    if (status === 'confirmed') return t('doctor.statusConfirmed');
    if (status === 'cancelled') return t('doctor.statusCancelled');
    return status.replace(/_/g, ' ');
  };

  const statusTone = (status: string): 'done' | 'active' | 'muted' => {
    if (status === 'delivered') return 'done';
    if (status === 'cancelled') return 'muted';
    return 'active';
  };

  const previewReportImage = (report: HealthReport) => {
    setPreviewUri(report.fileUrl);
  };

  const downloadReport = async (report: HealthReport) => {
    setReportBusyId(report.id);
    try {
      await downloadHealthReport(
        userId,
        report.id,
        report.title,
        report.mimeType,
        report.fileUrl,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : t('doctor.reportDownloadFailed');
      Alert.alert(t('doctor.reportDownloadFailedTitle'), message);
    } finally {
      setReportBusyId(null);
    }
  };

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
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <Ionicons name="chevron-back" size={22} color={doctorTheme.textOnDark} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('doctor.patientProfile')}</Text>
        <View style={styles.back} />
      </View>

      {loading && !customer ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={doctorTheme.primary} />
        </View>
      ) : missing ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>{t('doctor.patientNotFound')}</Text>
        </View>
      ) : error && !customer ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>{error}</Text>
          <Pressable onPress={() => void load('initial')} style={styles.retry}>
            <Text style={styles.retryText}>{t('doctor.tryAgain')}</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingTop: spacing.lg,
            paddingBottom: insets.bottom + spacing.xxl,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void load('refresh')}
              tintColor={doctorTheme.primary}
              colors={[doctorTheme.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {customer ? (
            <View style={styles.identityCard}>
              <View style={styles.patientAvatar}>
                <Text style={styles.patientInitials}>{initialsFor(customer.username)}</Text>
              </View>
              <View style={styles.identityText}>
                <Text style={styles.patientName}>{customer.username}</Text>
                <Text style={styles.patientMeta}>
                  {t('doctor.patientId')} {customer.id}
                </Text>
                <Pressable
                  onPress={() => {
                    const tel = customer.phone?.trim();
                    if (!tel) return;
                    void Linking.openURL(`tel:${tel}`).catch(() => {
                      Alert.alert(t('doctor.unableToCall'), t('doctor.callingUnsupported'));
                    });
                  }}
                  disabled={!customer.phone?.trim()}
                  style={({ pressed }) => pressed && styles.pressed}
                  accessibilityRole="link"
                  accessibilityLabel={`${t('doctor.phone')}: ${formatDoctorPatientPhone(customer)}`}
                >
                  <Text style={[styles.patientMeta, customer.phone ? styles.patientPhoneLink : null]}>
                    {t('doctor.phone')}: {formatDoctorPatientPhone(customer)}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          <ChartSection
            title={t('doctor.pastOrders')}
            hint={t('doctor.ordersHint')}
            empty={orders.length === 0}
            emptyLabel={t('doctor.noOrders')}
          >
            {orders.map((order) => (
              <MedicineOrderCard
                key={order.id}
                publicId={order.publicId}
                dateLabel={formatDate(order.createdAt)}
                statusLabel={statusLabel(order.status)}
                tone={statusTone(order.status)}
                lines={order.items}
              />
            ))}
          </ChartSection>

          <ChartSection
            title={t('doctor.prescriptions')}
            hint={t('doctor.prescriptionsHint')}
            empty={prescriptions.length === 0}
            emptyLabel={t('doctor.noPrescriptions')}
          >
            <PrescriptionGallery
              items={prescriptions}
              onOpen={(id) => {
                const match = prescriptions.find((item) => item.id === id);
                if (match) setPreviewUri(match.imageUrl);
              }}
            />
          </ChartSection>

          <ChartSection
            title={t('doctor.labReports')}
            hint={t('doctor.reportsHint')}
            empty={reports.length === 0}
            emptyLabel={t('doctor.noReports')}
          >
            {reports.map((report) => {
              const isImage = isHealthReportImage(report.mimeType, report.fileUrl);
              return (
                <ReportFileRow
                  key={report.id}
                  title={report.title}
                  meta={`${formatDate(report.createdAt)} · ${t('doctor.reportPhoto')}`}
                  isImage={isImage}
                  busy={reportBusyId === report.id}
                  viewLabel={t('doctor.view')}
                  downloadLabel={t('doctor.download')}
                  onView={isImage ? () => previewReportImage(report) : undefined}
                  onDownload={() => {
                    void downloadReport(report);
                  }}
                />
              );
            })}
          </ChartSection>
        </ScrollView>
      )}

      <ImagePreviewModal
        visible={previewUri != null}
        uri={previewUri}
        onClose={() => setPreviewUri(null)}
        closeLabel={t('common.close')}
      />
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
    paddingBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.button,
    color: doctorTheme.textOnDark,
    fontWeight: '700',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    ...typography.body,
    color: doctorTheme.textPrimary,
    textAlign: 'center',
  },
  retry: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: doctorTheme.primary,
  },
  retryText: {
    ...typography.button,
    fontSize: 14,
    color: doctorTheme.textOnDark,
  },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: doctorTheme.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: doctorTheme.border,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  patientAvatar: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    backgroundColor: doctorTheme.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientInitials: {
    fontSize: 18,
    fontWeight: '800',
    color: doctorTheme.primary,
  },
  identityText: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '700',
    color: doctorTheme.textPrimary,
  },
  patientMeta: {
    ...typography.caption,
    color: doctorTheme.textSecondary,
    marginTop: 2,
  },
  patientPhoneLink: {
    color: doctorTheme.primary,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.8,
  },
});

export default PatientDetailsScreen;
