import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  AuthScreenLayout,
  AuthPrimaryButton,
  AUTH_SCREEN_WIDTH,
  AUTH_HORIZONTAL_PADDING,
} from '@/components/auth';
import theme from '@/styles/theme';
import { APP_CONFIG } from '@/constants';
import { formatPhoneNumber } from '@/utils';
import { sendOtp, verifyOtp } from '@/services/authService';
import { ApiError } from '@/services/apiClient';
import { useAuth } from '@/context/AuthContext';
import { devLog } from '@/utils/devLogger';
import { fillOtpSmoothly } from '@/utils/otpFill';
import { resolveAuthRoute } from '@/navigation/resolveAuthRoute';
import type { AuthScreenProps } from '@/navigation/types';

const { colors, spacing, typography, borderRadius } = theme;

const OTP_LENGTH = APP_CONFIG.OTP_LENGTH;
const OTP_GAP = 10;
const OTP_BOX_WIDTH =
  (AUTH_SCREEN_WIDTH - AUTH_HORIZONTAL_PADDING * 2 - OTP_GAP * (OTP_LENGTH - 1)) /
  OTP_LENGTH;

const OtpScreen = ({ navigation, route }: AuthScreenProps<'Otp'>) => {
  const { signIn } = useAuth();
  const { phoneNumber, devOtp: initialDevOtp } = route.params;
  const [otpValues, setOtpValues] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [resendTimer, setResendTimer] = useState<number>(APP_CONFIG.OTP_RESEND_SECONDS);
  const [canResend, setCanResend] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const applyOtpSmoothly = useCallback((otp: string | undefined, source: string) => {
    if (!otp) return undefined;

    devLog('OtpScreen', `Auto-filling OTP (${source})`, { otp });
    setIsAutoFilling(true);
    setOtpValues(Array(OTP_LENGTH).fill(''));

    return fillOtpSmoothly(
      otp,
      (index, digit) => {
        setOtpValues((prev) => {
          const next = [...prev];
          next[index] = digit;
          return next;
        });
      },
      () => setIsAutoFilling(false),
    );
  }, []);

  useEffect(() => {
    const cleanup = applyOtpSmoothly(initialDevOtp, 'phone-screen');
    return cleanup;
  }, [initialDevOtp, applyOtpSmoothly]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer((t) => t - 1), 1000);
      return () => clearTimeout(timer);
    }
    setCanResend(true);
  }, [resendTimer]);

  useEffect(() => {
    if (isAutoFilling) return undefined;
    const timer = setTimeout(() => inputRefs.current[0]?.focus(), 400);
    return () => clearTimeout(timer);
  }, [isAutoFilling]);

  const handleChange = (text: string, index: number) => {
    if (!/^\d*$/.test(text)) return;

    const newOtp = [...otpValues];
    newOtp[index] = text.slice(-1);
    setOtpValues(newOtp);
    setApiError(null);

    if (text && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = useCallback(async () => {
    const otp = otpValues.join('');
    if (otp.length !== OTP_LENGTH || isValidating || isAutoFilling) return;

    setIsValidating(true);
    setApiError(null);
    devLog('OtpScreen', 'Verify pressed', { phoneNumber, otp });

    try {
      const result = await verifyOtp(phoneNumber, otp);
      await signIn(result);
      devLog('OtpScreen', 'Verify success', {
        userId: result.user.id,
        profileCompleted: result.user.profileCompleted,
      });

      const { route: nextRoute, params } = resolveAuthRoute(result.user);
      if (params) {
        navigation.reset({
          index: 0,
          routes: [{ name: nextRoute, params }],
        });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: nextRoute }],
        });
      }
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Unable to verify OTP. Please try again.';
      devLog('OtpScreen', 'Verify failed', message);
      setApiError(message);
    } finally {
      setIsValidating(false);
    }
  }, [otpValues, isValidating, isAutoFilling, navigation, phoneNumber]);

  const handleResend = async () => {
    if (!canResend || isResending) return;

    setIsResending(true);
    setApiError(null);
    devLog('OtpScreen', 'Resend pressed', { phoneNumber });

    try {
      const result = await sendOtp(phoneNumber);
      setCanResend(false);
      setResendTimer(APP_CONFIG.OTP_RESEND_SECONDS);
      setIsValidating(false);
      applyOtpSmoothly(result.devOtp, 'resend');
      devLog('OtpScreen', 'Resend success', { devOtp: result.devOtp ?? 'not in response' });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Unable to resend OTP. Please try again.';
      devLog('OtpScreen', 'Resend failed', message);
      setApiError(message);
    } finally {
      setIsResending(false);
    }
  };

  const isOtpComplete = otpValues.every((val) => val !== '');
  const displayPhone = formatPhoneNumber(phoneNumber);

  return (
    <AuthScreenLayout
      showBack
      onBack={() => navigation.goBack()}
      footer={
        <AuthPrimaryButton
          title="Verify & Continue"
          onPress={handleVerify}
          disabled={!isOtpComplete || isAutoFilling}
          loading={isValidating}
        />
      }
    >
      <Text style={styles.title}>Enter verification code</Text>

      {__DEV__ && initialDevOtp ? (
        <Text style={styles.devHint}>
          Dev mode: OTP auto-filled from API response
        </Text>
      ) : null}

      <View style={styles.sentRow}>
        <Text style={styles.sentText}>
          Sent to <Text style={styles.phoneText}>{displayPhone}</Text>
        </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Edit phone number"
        >
          <Ionicons name="create-outline" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.otpRow}>
        {otpValues.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              inputRefs.current[index] = ref;
            }}
            style={[
              styles.otpBox,
              { width: OTP_BOX_WIDTH },
              digit ? styles.otpBoxFilled : null,
              isValidating ? styles.otpBoxValidating : null,
              isAutoFilling && digit ? styles.otpBoxAutoFill : null,
            ]}
            value={digit}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
            editable={!isValidating && !isAutoFilling}
          />
        ))}
      </View>

      {isValidating ? (
        <View style={styles.validatingPill}>
          <ActivityIndicator size="small" color={colors.success} />
          <Text style={styles.validatingText}>We are validating the OTP</Text>
        </View>
      ) : (
        <View style={styles.resendRow}>
          <Text style={styles.resendLabel}>Didn&apos;t receive the code?</Text>
          <TouchableOpacity onPress={handleResend} disabled={!canResend || isResending}>
            <Text style={[styles.resendBtn, (!canResend || isResending) && styles.resendBtnDisabled]}>
              {isResending
                ? 'Sending...'
                : canResend
                  ? 'Resend OTP'
                  : `Resend in ${resendTimer}s`}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {apiError ? <Text style={styles.errorText}>{apiError}</Text> : null}
    </AuthScreenLayout>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.md,
    letterSpacing: -0.2,
  },
  devHint: {
    ...typography.caption,
    color: colors.success,
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  sentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  sentText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flex: 1,
  },
  phoneText: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: OTP_GAP,
    marginBottom: spacing.xl,
  },
  otpBox: {
    height: 52,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  otpBoxFilled: {
    borderColor: colors.borderFocused,
    backgroundColor: colors.surface,
  },
  otpBoxValidating: {
    borderColor: colors.success,
    backgroundColor: colors.successLight,
  },
  otpBoxAutoFill: {
    borderColor: colors.primary,
  },
  validatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.successLight,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    gap: spacing.sm,
  },
  validatingText: {
    ...typography.bodySmall,
    color: colors.success,
    fontWeight: '600',
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  resendLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  resendBtn: {
    ...typography.bodySmall,
    color: colors.secondary,
    fontWeight: '700',
  },
  resendBtnDisabled: {
    color: colors.textMuted,
    fontWeight: '500',
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.md,
  },
});

export default OtpScreen;
