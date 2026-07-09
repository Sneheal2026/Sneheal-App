import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  withSafeArea?: boolean;
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  rightElement,
  withSafeArea = true,
  style,
  containerStyle,
}) => {
  const { colors, spacing, typography, moderateScale } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: colors.white,
          borderBottomWidth: 1,
          borderBottomColor: colors.primaryMutedMedium,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.md,
          paddingBottom: spacing.md,
          backgroundColor: colors.white,
        },
        textBlock: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
        },
        accentBar: {
          width: 4,
          height: moderateScale(36, 0.35),
          borderRadius: 4,
          backgroundColor: colors.primary,
        },
        textContent: {
          flex: 1,
        },
        title: {
          fontSize: moderateScale(22, 0.35),
          fontWeight: '800',
          color: colors.primaryDark,
          letterSpacing: -0.3,
        },
        subtitle: {
          ...typography.caption,
          color: colors.primaryLight,
          marginTop: 2,
          fontWeight: '500',
        },
        right: {
          marginLeft: spacing.md,
        },
      }),
    [colors, moderateScale, spacing, typography],
  );

  const header = (
    <View style={[styles.header, style]}>
      <View style={styles.textBlock}>
        <View style={styles.accentBar} />
        <View style={styles.textContent}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {rightElement ? <View style={styles.right}>{rightElement}</View> : null}
    </View>
  );

  if (!withSafeArea) {
    return <View style={[styles.container, containerStyle]}>{header}</View>;
  }

  return (
    <SafeAreaView style={[styles.container, containerStyle]} edges={['top']}>
      {header}
    </SafeAreaView>
  );
};

export default ScreenHeader;
