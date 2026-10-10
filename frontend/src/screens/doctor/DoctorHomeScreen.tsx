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

const { spacing, typography, borderRadius } = theme;

const initialsFor = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'C';

const DoctorHomeScreen = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DoctorCustomer[]>([]);
  const [message, setMessage] = useState('');
  const [searching, setSearching] = useState(false);

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

  const openCustomer = (customerId: string) => {
    navigation.navigate('PatientDetails', { userId: customerId });
  };

  const onSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setMessage(t('doctor.lookupNeedMore'));
      return;
    }

    setSearching(true);
    setMessage('');

    try {
      const customers = await searchCustomers(trimmed);
      setResults(customers);
      if (customers.length === 1) {
        openCustomer(customers[0].id);
        return;
      }
      if (customers.length === 0) {
        setMessage(t('doctor.lookupEmpty'));
      }
    } catch (error) {
      setResults([]);
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
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.xl,
          paddingBottom: insets.bottom + spacing.xxl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>{t('doctor.lookupTitle')}</Text>
        <Text style={styles.lookupHint}>{t('doctor.lookupHint')}</Text>

        <PatientSearchBar
          value={query}
          placeholder={t('doctor.lookupPlaceholder')}
          actionLabel={t('doctor.lookupAction')}
          loading={searching}
          onChange={(value) => {
            setQuery(value);
            setMessage('');
            setResults([]);
          }}
          onSubmit={() => {
            void onSearch();
          }}
        />

        {message ? <Text style={styles.message}>{message}</Text> : null}

        {results.length > 1 ? (
          <View style={styles.results}>
            {results.map((customer) => (
              <Pressable
                key={customer.id}
                onPress={() => openCustomer(customer.id)}
                style={({ pressed }) => [styles.patientRow, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={`Open profile for ${customer.username}`}
              >
                <View style={styles.patientAvatar}>
                  <Text style={styles.patientInitials}>{initialsFor(customer.username)}</Text>
                </View>
                <View style={styles.patientInfo}>
                  <Text style={styles.patientName}>{customer.username}</Text>
                  <Text style={styles.patientMeta}>
                    {t('doctor.customerId')} {customer.id} · {customer.phoneMasked}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={doctorTheme.textSecondary} />
              </Pressable>
            ))}
          </View>
        ) : null}

        <Pressable
          onPress={() => navigation.navigate('Main')}
          style={({ pressed }) => [styles.shiftToCustomerBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={t('doctor.shiftToCustomerA11y')}
        >
          <Ionicons name="swap-horizontal" size={18} color={doctorTheme.primary} />
          <Text style={styles.shiftToCustomerText}>{t('doctor.shiftToCustomer')}</Text>
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
  sectionLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: doctorTheme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.xs,
  },
  lookupHint: {
    ...typography.bodySmall,
    color: doctorTheme.textSecondary,
    marginBottom: spacing.md,
  },
  message: {
    ...typography.bodySmall,
    color: doctorTheme.textPrimary,
    marginTop: spacing.md,
  },
  results: {
    marginTop: spacing.lg,
    gap: spacing.sm,
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
