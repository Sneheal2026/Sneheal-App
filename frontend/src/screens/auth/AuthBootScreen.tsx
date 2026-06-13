import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Loader from '@/components/common/Loader';
import { APP_CONFIG } from '@/constants';
import theme from '@/styles/theme';

const { colors, typography, spacing } = theme;

const AuthBootScreen = () => {
  return (
    <View style={styles.container}>
      <Animated.View entering={FadeIn.duration(400)} style={styles.content}>
        <Text style={styles.brand}>{APP_CONFIG.APP_NAME}</Text>
        <Loader fullScreen={false} message="Restoring your session..." size="large" />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  brand: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.5,
    marginBottom: spacing.xl,
  },
  message: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
});

export default AuthBootScreen;
