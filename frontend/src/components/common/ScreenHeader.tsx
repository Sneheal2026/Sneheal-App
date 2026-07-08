import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import theme from '@/styles/theme';

const { colors, spacing, typography, moderateScale } = theme;

const HEADER_BLUE = colors.primary;
const HEADER_BLUE_SOFT = '#5B8FD9';
const HEADER_BLUE_BORDER = 'rgba(26, 115, 232, 0.14)';

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

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: HEADER_BLUE_BORDER,
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
    backgroundColor: HEADER_BLUE,
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
    color: HEADER_BLUE_SOFT,
    marginTop: 2,
    fontWeight: '500',
  },
  right: {
    marginLeft: spacing.md,
  },
});

export default ScreenHeader;
