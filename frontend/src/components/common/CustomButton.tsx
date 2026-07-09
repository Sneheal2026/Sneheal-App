import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';

export interface CustomButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
  textStyle,
}) => {
  const { colors, spacing, borderRadius, typography } = useTheme();
  const isOutline = variant === 'outline';
  const isSecondary = variant === 'secondary';

  const buttonBg = isOutline
    ? colors.transparent
    : isSecondary
      ? colors.secondary
      : colors.primary;

  const textColor = isOutline ? colors.primary : colors.textInverse;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          borderRadius: borderRadius.xl,
          paddingHorizontal: spacing.xxl,
          backgroundColor: buttonBg,
        },
        isOutline && {
          borderWidth: 2,
          borderColor: colors.primary,
          backgroundColor: colors.transparent,
        },
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={isOutline ? colors.primary : colors.white}
          size="small"
        />
      ) : (
        <Text style={[styles.text, typography.button, { color: textColor }, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    letterSpacing: 0.5,
  },
});

export default CustomButton;
