import React from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doctorTheme } from '@/components/doctor/doctorTheme';
import theme from '@/styles/theme';

const { spacing, typography, borderRadius } = theme;

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
}: PatientSearchBarProps) => (
  <View style={styles.wrap}>
    <View style={styles.field}>
      <Ionicons name="search" size={18} color={doctorTheme.textSecondary} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={doctorTheme.textSecondary}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        onSubmitEditing={onSubmit}
        style={styles.input}
        accessibilityLabel={placeholder}
      />
    </View>
    <Pressable
      onPress={onSubmit}
      disabled={loading}
      style={({ pressed }) => [styles.button, pressed && styles.pressed, loading && styles.disabled]}
      accessibilityRole="button"
      accessibilityLabel={actionLabel}
    >
      {loading ? (
        <ActivityIndicator size="small" color={doctorTheme.textOnDark} />
      ) : (
        <Text style={styles.buttonText}>{actionLabel}</Text>
      )}
    </Pressable>
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: doctorTheme.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: doctorTheme.border,
    paddingHorizontal: spacing.md,
    minHeight: 52,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: doctorTheme.textPrimary,
    paddingVertical: spacing.md,
  },
  button: {
    minHeight: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: doctorTheme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    ...typography.button,
    color: doctorTheme.textOnDark,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.88,
  },
  disabled: {
    opacity: 0.7,
  },
});

export default PatientSearchBar;
