import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeOut,
  ZoomIn,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import theme from '@/styles/theme';

const { colors, spacing, typography, borderRadius, shadows } = theme;

interface LogoutConfirmModalProps {
  visible: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
  visible,
  loading = false,
  onCancel,
  onConfirm,
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={loading ? undefined : onCancel}
    >
      <Animated.View
        entering={FadeIn.duration(180)}
        exiting={FadeOut.duration(150)}
        style={styles.backdrop}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={loading ? undefined : onCancel}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />

        <Animated.View
          entering={ZoomIn.springify().damping(18).mass(0.7)}
          style={styles.card}
        >
          <View style={styles.iconRing}>
            <View style={styles.iconCircle}>
              <Ionicons name="log-out-outline" size={30} color={colors.error} />
            </View>
          </View>

          <Text style={styles.title}>{t('settings.logOutTitle')}</Text>
          <Text style={styles.message}>{t('settings.logOutMessage')}</Text>

          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              disabled={loading}
              style={({ pressed }) => [
                styles.button,
                styles.cancelButton,
                pressed && styles.buttonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={t('settings.logOutCancel')}
            >
              <Text style={styles.cancelText}>{t('settings.logOutCancel')}</Text>
            </Pressable>

            <Pressable
              onPress={onConfirm}
              disabled={loading}
              style={({ pressed }) => [
                styles.button,
                styles.confirmButton,
                (pressed || loading) && styles.buttonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={t('settings.logOutConfirm')}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Ionicons name="log-out-outline" size={18} color={colors.white} />
                  <Text style={styles.confirmText}>
                    {t('settings.logOutConfirm')}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xxl,
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    alignItems: 'center',
    ...shadows.lg,
  },
  iconRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  title: {
    ...typography.h3,
    fontSize: 20,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  message: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: 52,
    borderRadius: borderRadius.lg,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  cancelButton: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelText: {
    ...typography.button,
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  confirmButton: {
    backgroundColor: colors.error,
    ...shadows.sm,
  },
  confirmText: {
    ...typography.button,
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },
});

export default LogoutConfirmModal;
