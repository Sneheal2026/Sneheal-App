import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface AuthPrimaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

const AuthPrimaryButton: React.FC<AuthPrimaryButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  style,
}) => {
  const { colors, borderRadius, typography } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          borderRadius: borderRadius.xl,
          backgroundColor: colors.primary,
        },
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator color={colors.textInverse} size="small" />
      ) : (
        <Text style={[styles.text, typography.button, { color: colors.textInverse }]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  disabled: {
    opacity: 0.45,
  },
  text: {
    fontSize: 15,
    letterSpacing: 0.3,
  },
});

export default AuthPrimaryButton;
