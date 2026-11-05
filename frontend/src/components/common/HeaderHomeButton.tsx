import React, { useMemo } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/useTheme';

type HeaderHomeButtonProps = {
  onPress: () => void;
};

const HeaderHomeButton = ({ onPress }: HeaderHomeButtonProps) => {
  const { t } = useTranslation();
  const { colors, spacing, borderRadius, moderateScale } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        btn: {
          width: moderateScale(40, 0.35),
          height: moderateScale(40, 0.35),
          borderRadius: borderRadius.lg,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.primaryMutedMedium,
          borderWidth: 1,
          borderColor: colors.primaryMutedMedium,
        },
        pressed: {
          opacity: 0.82,
          transform: [{ scale: 0.96 }],
        },
      }),
    [borderRadius.lg, colors.primaryMutedMedium, moderateScale],
  );

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={t('orders.homeA11y')}
    >
      <Ionicons name="home-outline" size={moderateScale(22, 0.35)} color={colors.primaryDark} />
    </Pressable>
  );
};

export default HeaderHomeButton;
