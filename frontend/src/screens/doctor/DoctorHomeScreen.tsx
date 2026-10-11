import React, { useMemo, useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/AuthContext';
import DevResetStorageButton from '@/components/common/DevResetStorageButton';
import { doctorTheme } from '@/components/doctor/doctorTheme';
import PatientSearchBar from '@/components/doctor/PatientSearchBar';
import type { AuthStackParamList } from '@/navigation/types';
import type { DoctorCustomer } from '@/types/doctor';
import { ApiError } from '@/services/apiClient';
import { searchCustomers } from '@/services/doctorService';
import theme from '@/styles/theme';
import { useTranslation } from 'react-i18next';
import { formatDoctorPatientPhone } from '@/utils/doctorPatientPhone';

const { spacing, typography, borderRadius, shadows } = theme;

const DoctorHomeScreen = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DoctorCustomer[]>([]);
  const [message, setMessage] = useState('');
  const [messageIsError, setMessageIsError] = useState(false);
  const [searching, setSearching] = useState(false);

  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0,
  );

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t('doctor.greetingMorning');
    if (hour < 17) return t('doctor.greetingAfternoon');
    return t('doctor.greetingEvening');
  }, [t]);

  const displayName = user?.username ? `Dr. ${user.username}` : t('doctor.accountDefaultName');

  const showIdleState =
    !searching && results.length === 0 && !message && query.trim().length === 0;

  const openPatient = (patientId: string) => {
    navigation.navigate('PatientDetails', { userId: patientId });
  };

  const onSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setMessageIsError(true);
      setMessage(t('doctor.lookupNeedMore'));
      return;
    }

    setSearching(true);
    setMessage('');
    setMessageIsError(false);

    try {
      const patients = await searchCustomers(trimmed);
      setResults(patients);
      if (patients.length === 1) {
        openPatient(patients[0].id);
        return;
      }
      if (patients.length === 0) {
        setMessageIsError(true);
        setMessage(t('doctor.lookupEmpty'));
      }
    } catch (error) {
      setResults([]);
      setMessageIsError(true);
      setMessage(error instanceof ApiError ? error.message : t('doctor.lookupFailed'));
    } finally {
      setSearching(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={doctorTheme.primary}
        translucent={Platform.OS === 'android'}
      />

      <LinearGradient
        colors={[doctorTheme.primary, doctorTheme.primarySoft]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: topInset + spacing.md }]}
      >
        <View style={styles.headerTopRow}>
          <View style={styles.workspaceBadge}>
            <Ionicons name="medkit-outline" size={14} color={doctorTheme.accent} />
            <Text style={styles.workspaceText}>{t('doctor.homeWorkspace')}</Text>
          </View>
          <Pressable
            onPress={() => navigation.navigate('DoctorAccount')}
            style={({ pressed }) => [styles.accountBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={t('doctor.accountA11y')}
          >
            <Ionicons name="person-outline" size={20} color={doctorTheme.textOnDark} />
          </Pressable>
        </View>

        <Text style={styles.greeting}>{greeting}</Text>
        <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
        <Text style={styles.tagline} numberOfLines={2}>{t('doctor.homeTagline')}</Text>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing.xxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainCard}>
          <View style={styles.sectionHead}>
            <View style={styles.sectionAccent} />
            <View style={styles.sectionHeadText}>
              <Text style={styles.sectionTitle}>{t('doctor.lookupTitle')}</Text>
              <Text style={styles.sectionHint}>{t('doctor.lookupHint')}</Text>
            </View>
          </View>

          <PatientSearchBar
            value={query}
            placeholder={t('doctor.lookupPlaceholder')}
            actionLabel={t('doctor.lookupActionShort')}
            loading={searching}
            onChange={(value) => {
              setQuery(value);
              setMessage('');
              setMessageIsError(false);
              setResults([]);
            }}
            onSubmit={() => {
              void onSearch();
            }}
          />

          <View style={styles.tipRow}>
            <View style={styles.tipBox}>
              <Text style={styles.tipLabel}>{t('doctor.lookupTipId')}</Text>
            </View>
            <View style={styles.tipBox}>
              <Text style={styles.tipLabel}>{t('doctor.lookupTipName')}</Text>
            </View>
          </View>

          <Pressable
            onPress={() => navigation.navigate('DoctorPatients')}
            style={({ pressed }) => [styles.myPatientsLink, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={t('doctor.menuMyPatients')}
          >
            <Ionicons name="people-outline" size={18} color={doctorTheme.primary} />
            <Text style={styles.myPatientsLinkText}>{t('doctor.myPatientsOpenList')}</Text>
            <Ionicons name="chevron-forward" size={16} color={doctorTheme.primary} />
          </Pressable>

          {message ? (
            <View
              style={[
                styles.messageBanner,
                messageIsError ? styles.messageBannerError : styles.messageBannerInfo,
              ]}
            >
              <Text style={[styles.messageText, messageIsError && styles.messageTextError]}>
                {message}
              </Text>
            </View>
          ) : null}

          {showIdleState ? (
            <View style={styles.idleBox}>
              <View style={styles.idleAccent} />
              <View style={styles.idleContent}>
                <Text style={styles.idleTitle}>{t('doctor.homeEmptyTitle')}</Text>
                <Text style={styles.idleBody}>{t('doctor.homeEmptyBody')}</Text>
              </View>
            </View>
          ) : null}
        </View>

        {results.length > 1 ? (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsHeading}>
              {t('doctor.resultsTitle', { count: results.length })}
            </Text>
            <View style={styles.resultsCard}>
              {results.map((patient, index) => (
                <Pressable
                  key={patient.id}
                  onPress={() => openPatient(patient.id)}
                  style={({ pressed }) => [
                    styles.patientRow,
                    index < results.length - 1 && styles.patientRowBorder,
                    pressed && styles.patientRowPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={t('doctor.openPatientA11y', { name: patient.username })}
                >
                  <View style={styles.patientAccent} />
                  <View style={styles.patientCopy}>
                    <Text style={styles.patientName}>{patient.username}</Text>
                    <Text style={styles.patientMeta}>
                      {t('doctor.patientId')} {patient.id}
                    </Text>
                    <Text style={styles.patientPhone}>
                      {formatDoctorPatientPhone(patient)}
                    </Text>
                  </View>
                  <View style={styles.openChart}>
                    <Text style={styles.openChartText}>{t('doctor.viewChart')}</Text>
                    <Ionicons name="chevron-forward" size={16} color={doctorTheme.primary} />
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

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
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  workspaceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  workspaceText: {
    ...typography.caption,
    fontWeight: '700',
    color: doctorTheme.textOnDark,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  accountBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  greeting: {
    ...typography.caption,
    color: doctorTheme.textMutedOnDark,
    fontWeight: '600',
    marginBottom: 4,
  },
  name: {
    fontSize: 26,
    fontWeight: '800',
    color: doctorTheme.textOnDark,
    letterSpacing: -0.5,
    marginBottom: spacing.xs,
  },
  tagline: {
    ...typography.bodySmall,
    color: 'rgba(240, 253, 250, 0.88)',
    lineHeight: 20,
    maxWidth: 320,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  mainCard: {
    backgroundColor: doctorTheme.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: doctorTheme.border,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.md,
  },
  sectionHead: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  sectionAccent: {
    width: 4,
    borderRadius: 2,
    backgroundColor: doctorTheme.accent,
    alignSelf: 'stretch',
  },
  sectionHeadText: {
    flex: 1,
    gap: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: doctorTheme.textPrimary,
    letterSpacing: -0.3,
  },
  sectionHint: {
    ...typography.bodySmall,
    color: doctorTheme.textSecondary,
    lineHeight: 20,
  },
  tipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tipBox: {
    flex: 1,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: doctorTheme.background,
    borderWidth: 1,
    borderColor: doctorTheme.border,
  },
  tipLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: doctorTheme.textSecondary,
    textAlign: 'center',
  },
  myPatientsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: doctorTheme.background,
    borderWidth: 1,
    borderColor: doctorTheme.border,
  },
  myPatientsLinkText: {
    flex: 1,
    ...typography.bodySmall,
    fontWeight: '700',
    color: doctorTheme.primary,
  },
  messageBanner: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  messageBannerError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  messageBannerInfo: {
    backgroundColor: doctorTheme.background,
    borderColor: doctorTheme.border,
  },
  messageText: {
    ...typography.bodySmall,
    color: doctorTheme.textPrimary,
    lineHeight: 20,
  },
  messageTextError: {
    color: '#991B1B',
  },
  idleBox: {
    flexDirection: 'row',
    borderRadius: borderRadius.lg,
    backgroundColor: doctorTheme.background,
    borderWidth: 1,
    borderColor: doctorTheme.border,
    overflow: 'hidden',
  },
  idleAccent: {
    width: 4,
    backgroundColor: doctorTheme.primarySoft,
  },
  idleContent: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  idleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: doctorTheme.textPrimary,
  },
  idleBody: {
    ...typography.bodySmall,
    color: doctorTheme.textSecondary,
    lineHeight: 21,
  },
  resultsSection: {
    gap: spacing.sm,
  },
  resultsHeading: {
    ...typography.caption,
    fontWeight: '700',
    color: doctorTheme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginLeft: spacing.xxs,
  },
  resultsCard: {
    backgroundColor: doctorTheme.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: doctorTheme.border,
    overflow: 'hidden',
    ...shadows.sm,
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingRight: spacing.md,
    gap: spacing.sm,
  },
  patientRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: doctorTheme.border,
  },
  patientRowPressed: {
    backgroundColor: doctorTheme.background,
  },
  patientAccent: {
    width: 3,
    alignSelf: 'stretch',
    backgroundColor: doctorTheme.accent,
    marginVertical: spacing.xs,
    marginLeft: spacing.md,
    borderRadius: 2,
  },
  patientCopy: {
    flex: 1,
    minWidth: 0,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '700',
    color: doctorTheme.textPrimary,
    marginBottom: 2,
  },
  patientMeta: {
    ...typography.caption,
    fontWeight: '600',
    color: doctorTheme.textSecondary,
  },
  patientPhone: {
    ...typography.caption,
    color: doctorTheme.textSecondary,
    marginTop: 1,
  },
  openChart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  openChartText: {
    ...typography.caption,
    fontWeight: '700',
    color: doctorTheme.primary,
  },
  pressed: {
    opacity: 0.8,
  },
});

export default DoctorHomeScreen;
