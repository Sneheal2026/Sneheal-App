import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Platform,
  Pressable,
  TextInput,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { doctorTheme } from '@/components/doctor/doctorTheme';
import type { AuthStackParamList } from '@/navigation/types';
import type { DoctorEngagedPatient } from '@/types/doctor';
import { fetchEngagedPatients } from '@/services/doctorService';
import { ApiError } from '@/services/apiClient';
import { formatDoctorPatientPhone } from '@/utils/doctorPatientPhone';
import theme from '@/styles/theme';

const { spacing, typography, borderRadius, shadows } = theme;

const formatLastActive = (iso: string, locale: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const DoctorPatientsScreen = () => {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [patients, setPatients] = useState<DoctorEngagedPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');

  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0,
  );

  const load = useCallback(async (mode: 'initial' | 'refresh') => {
    if (mode === 'refresh') setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const rows = await fetchEngagedPatients();
      setPatients(rows);
    } catch (err) {
      setPatients([]);
      setError(
        err instanceof ApiError ? err.message : t('doctor.myPatientsLoadFailed'),
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      void load('initial');
    }, [load]),
  );

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((p) => {
      const phone = formatDoctorPatientPhone(p).toLowerCase();
      return (
        p.username.toLowerCase().includes(q) ||
        p.id.includes(q) ||
        phone.includes(q)
      );
    });
  }, [filter, patients]);

  const openPatient = (userId: string) => {
    navigation.navigate('PatientDetails', { userId });
  };

  const renderItem = ({ item }: { item: DoctorEngagedPatient }) => (
    <Pressable
      onPress={() => openPatient(item.id)}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      accessibilityRole="button"
      accessibilityLabel={t('doctor.openPatientA11y', { name: item.username })}
    >
      <View style={styles.rowAccent} />
      <View style={styles.rowBody}>
        <Text style={styles.rowName} numberOfLines={1}>{item.username}</Text>
        <Text style={styles.rowMeta} numberOfLines={1}>
          {t('doctor.patientId')} {item.id} · {formatDoctorPatientPhone(item)}
        </Text>
        <View style={styles.badgeRow}>
          {item.orderCount > 0 ? (
            <View style={styles.badge}>
              <Ionicons name="medical-outline" size={12} color={doctorTheme.primary} />
              <Text style={styles.badgeText}>
                {t('doctor.myPatientsOrders', { count: item.orderCount })}
              </Text>
            </View>
          ) : null}
          {item.prescriptionCount > 0 ? (
            <View style={styles.badge}>
              <Ionicons name="document-text-outline" size={12} color={doctorTheme.primary} />
              <Text style={styles.badgeText}>
                {t('doctor.myPatientsRx', { count: item.prescriptionCount })}
              </Text>
            </View>
          ) : null}
        </View>
        {item.lastActivityAt ? (
          <Text style={styles.rowActivity}>
            {t('doctor.myPatientsLastActive', {
              date: formatLastActive(item.lastActivityAt, i18n.language),
            })}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={20} color={doctorTheme.textSecondary} />
    </Pressable>
  );

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
          accessibilityLabel={t('common.back')}
        >
          <Ionicons name="chevron-back" size={22} color={doctorTheme.textOnDark} />
        </Pressable>
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle}>{t('doctor.menuMyPatients')}</Text>
          <Text style={styles.headerSubtitle}>{t('doctor.myPatientsSubtitle')}</Text>
        </View>
      </View>

      <View style={styles.toolbar}>
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color={doctorTheme.textSecondary} />
          <TextInput
            value={filter}
            onChangeText={setFilter}
            placeholder={t('doctor.myPatientsSearchPlaceholder')}
            placeholderTextColor={doctorTheme.textSecondary}
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
            {...(Platform.OS === 'android' ? { includeFontPadding: false } : {})}
          />
          {filter.length > 0 ? (
            <Pressable onPress={() => setFilter('')} hitSlop={8}>
              <Ionicons name="close" size={18} color={doctorTheme.textSecondary} />
            </Pressable>
          ) : null}
        </View>
        <View style={styles.countPill}>
          <Text style={styles.countText}>
            {t('doctor.myPatientsCount', { count: filtered.length })}
          </Text>
        </View>
      </View>

      {loading && patients.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={doctorTheme.primary} />
        </View>
      ) : error && patients.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => void load('initial')} style={styles.retryBtn}>
            <Text style={styles.retryText}>{t('doctor.tryAgain')}</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing.xxl,
            gap: spacing.sm,
          }}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>{t('doctor.myPatientsEmptyTitle')}</Text>
              <Text style={styles.emptyBody}>{t('doctor.myPatientsEmptyBody')}</Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void load('refresh')}
              tintColor={doctorTheme.primary}
              colors={[doctorTheme.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
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
    paddingBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginTop: 2,
  },
  headerTitles: {
    flex: 1,
    paddingTop: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: doctorTheme.textOnDark,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    ...typography.bodySmall,
    color: doctorTheme.textMutedOnDark,
    marginTop: 4,
    lineHeight: 20,
  },
  toolbar: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: doctorTheme.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: doctorTheme.border,
    paddingHorizontal: spacing.md,
    minHeight: 48,
    ...shadows.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: doctorTheme.textPrimary,
    paddingVertical: Platform.OS === 'android' ? 10 : 12,
    minWidth: 0,
    ...(Platform.OS === 'android' ? { textAlignVertical: 'center' as const } : {}),
  },
  countPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: doctorTheme.accentMuted,
    borderWidth: 1,
    borderColor: doctorTheme.border,
  },
  countText: {
    ...typography.caption,
    fontWeight: '700',
    color: doctorTheme.primary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: doctorTheme.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: doctorTheme.border,
    overflow: 'hidden',
    ...shadows.sm,
  },
  rowPressed: {
    opacity: 0.92,
    backgroundColor: '#F7FFFE',
  },
  rowAccent: {
    width: 4,
    alignSelf: 'stretch',
    backgroundColor: doctorTheme.accent,
  },
  rowBody: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    minWidth: 0,
    gap: 4,
  },
  rowName: {
    fontSize: 16,
    fontWeight: '700',
    color: doctorTheme.textPrimary,
  },
  rowMeta: {
    ...typography.caption,
    color: doctorTheme.textSecondary,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    backgroundColor: doctorTheme.background,
    borderWidth: 1,
    borderColor: doctorTheme.border,
  },
  badgeText: {
    ...typography.caption,
    fontWeight: '600',
    color: doctorTheme.textPrimary,
  },
  rowActivity: {
    ...typography.caption,
    color: doctorTheme.textSecondary,
    marginTop: 2,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  errorText: {
    ...typography.bodySmall,
    color: doctorTheme.textPrimary,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: doctorTheme.primary,
  },
  retryText: {
    ...typography.button,
    color: doctorTheme.textOnDark,
    fontWeight: '700',
  },
  emptyBox: {
    marginTop: spacing.xxl,
    padding: spacing.lg,
    backgroundColor: doctorTheme.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: doctorTheme.border,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: doctorTheme.textPrimary,
    marginBottom: spacing.xs,
  },
  emptyBody: {
    ...typography.bodySmall,
    color: doctorTheme.textSecondary,
    lineHeight: 21,
  },
  pressed: {
    opacity: 0.8,
  },
});

export default DoctorPatientsScreen;
