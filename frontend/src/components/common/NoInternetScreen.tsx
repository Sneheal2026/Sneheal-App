import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomButton from '@/components/common/CustomButton';
import theme from '@/styles/theme';

const { colors, spacing, typography, moderateScale, verticalScale } = theme;

const NO_INTERNET_PIC = require('../../../assets/images/No-Internet-Pic.webp');

interface NoInternetScreenProps {
  onRetry: () => void;
  isRetrying?: boolean;
}

const NoInternetScreen: React.FC<NoInternetScreenProps> = ({
  onRetry,
  isRetrying = false,
}) => (
  <View style={styles.overlay} accessibilityViewIsModal>
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.content} accessibilityRole="alert">
        <Image
          source={NO_INTERNET_PIC}
          style={styles.image}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />

        <Text style={styles.title}>No Internet Connection</Text>
        <Text style={styles.message}>
          Please connect to Wi‑Fi or mobile data to continue using Sneheal.
        </Text>

        <CustomButton
          title="Try Again"
          onPress={onRetry}
          loading={isRetrying}
          style={styles.retryButton}
        />
      </View>
    </SafeAreaView>
  </View>
);

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    zIndex: 9999,
    elevation: 9999,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  content: {
    alignItems: 'center',
    width: '100%',
    maxWidth: moderateScale(340, 0.35),
  },
  image: {
    width: moderateScale(260, 0.35),
    height: moderateScale(260, 0.35),
    marginBottom: spacing.md,
    opacity: 0.95,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: verticalScale(28),
    maxWidth: moderateScale(300, 0.35),
  },
  retryButton: {
    maxWidth: moderateScale(240, 0.35),
  },
});

export default NoInternetScreen;
