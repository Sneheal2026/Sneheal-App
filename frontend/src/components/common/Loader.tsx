import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import theme from '@/styles/theme';

const { colors, spacing, typography } = theme;

export interface LoaderProps {
  message?: string;
  fullScreen?: boolean;
  size?: 'small' | 'large';
}

const Loader: React.FC<LoaderProps> = ({
  message,
  fullScreen = true,
  size = 'large',
}) => {
  if (!fullScreen) {
    return (
      <View style={styles.inline}>
        <ActivityIndicator size={size} color={colors.primary} />
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>
    );
  }

  return (
    <View style={styles.fullScreen}>
      <ActivityIndicator size={size} color={colors.primary} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  inline: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  message: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
});

export default Loader;
