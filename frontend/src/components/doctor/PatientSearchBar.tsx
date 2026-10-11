import React from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { doctorTheme } from '@/components/doctor/doctorTheme';
import theme from '@/styles/theme';

const { spacing, typography, borderRadius, shadows } = theme;

const INPUT_FONT_SIZE = 16;

type PatientSearchBarProps = {
  value: string;
  placeholder: string;
  actionLabel: string;
  loading: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

const PatientSearchBar = ({
  value,
  placeholder,
  actionLabel,
  loading,
  onChange,
  onSubmit,
}: PatientSearchBarProps) => {
  const { t } = useTranslation();

  return (
    <View style={styles.wrap}>
      <View style={styles.bar}>
        <Ionicons name="search-outline" size={20} color={doctorTheme.primary} />
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#7A9E99"
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={onSubmit}
          style={styles.input}
          accessibilityLabel={placeholder}
          {...(Platform.OS === 'android' ? { includeFontPadding: false } : {})}
        />
        {value.length > 0 ? (
          <Pressable
            onPress={() => onChange('')}
            hitSlop={8}
            style={styles.clearBtn}
            accessibilityRole="button"
            accessibilityLabel={t('doctor.lookupClearA11y')}
          >
            <Ionicons name="close" size={18} color={doctorTheme.textSecondary} />
          </Pressable>
        ) : null}
      </View>
      <Pressable
        onPress={onSubmit}
        disabled={loading}
        style={({ pressed }) => [
          styles.action,
          pressed && styles.pressed,
          loading && styles.disabled,
        ]}
        accessibilityRole="button"
        accessibilityLabel={actionLabel}
      >
        {loading ? (
          <ActivityIndicator size="small" color={doctorTheme.textOnDark} />
        ) : (
          <>
            <Ionicons name="arrow-forward" size={18} color={doctorTheme.textOnDark} />
            <Text style={styles.actionText}>{actionLabel}</Text>
          </>
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    backgroundColor: doctorTheme.background,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: doctorTheme.border,
    paddingHorizontal: spacing.md,
    ...shadows.sm,
  },
  input: {
    flex: 1,
    fontSize: INPUT_FONT_SIZE,
    fontWeight: '400',
    color: doctorTheme.textPrimary,
    paddingVertical: Platform.OS === 'android' ? 12 : 16,
    paddingHorizontal: spacing.sm,
    minWidth: 0,
    margin: 0,
    ...(Platform.OS === 'android'
      ? { lineHeight: 22, textAlignVertical: 'center' as const }
      : {}),
  },
  clearBtn: {
    paddingLeft: spacing.xs,
    justifyContent: 'center',
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: doctorTheme.primary,
    ...shadows.sm,
  },
  actionText: {
    ...typography.button,
    fontSize: 15,
    fontWeight: '700',
    color: doctorTheme.textOnDark,
  },
  pressed: {
    opacity: 0.88,
  },
  disabled: {
    opacity: 0.75,
  },
});

export default PatientSearchBar;
