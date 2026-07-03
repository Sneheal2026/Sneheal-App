import React, { useState, useRef, useCallback } from 'react';
import {
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  View,
} from 'react-native';
import { AuthScreenLayout, AuthPrimaryButton } from '@/components/auth';
import { useAuth } from '@/context/AuthContext';
import theme from '@/styles/theme';
import { APP_CONFIG } from '@/constants';
import { sendOtp } from '@/services/authService';
import { ApiError } from '@/services/apiClient';
import { devLog } from '@/utils/devLogger';
import { createPreviewSession, isSkipAuthEnabled } from '@/utils/previewAuth';
import type { AuthScreenProps } from '@/navigation/types';

const { colors, spacing, typography, borderRadius } = theme;

const formatPhoneDisplay = (digits: string): string => {
  const d = digits.replace(/\D/g, '').slice(0, 10);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)} ${d.slice(5)}`;
};

const PhoneNumberScreen = ({ navigation }: AuthScreenProps<'PhoneNumber'>) => {
  const { signIn } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  const showSkipAuth = isSkipAuthEnabled();

  const isValid = phoneNumber.length === 10;
  const showError = phoneNumber.length > 0 && !isValid;

  const handleChange = useCallback((text: string) => {
    setPhoneNumber(text.replace(/\D/g, '').slice(0, 10));
    setApiError(null);
  }, []);

  const handleContinue = async () => {
    if (!isValid || isLoading) return;

    setIsLoading(true);
    setApiError(null);
    devLog('PhoneScreen', 'Continue pressed', { phoneNumber });

    try {
      const result = await sendOtp(phoneNumber);
      devLog('PhoneScreen', 'OTP sent, navigating to Otp', {
        devOtp: result.devOtp ?? 'not in response',
        resendAfterSeconds: result.resendAfterSeconds,
      });
      navigation.navigate('Otp', {
        phoneNumber,
        devOtp: result.devOtp,
      });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Unable to send OTP. Please try again.';
      devLog('PhoneScreen', 'sendOtp failed', message);
      setApiError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipAuth = async () => {
    if (isSkipping || isLoading) return;

    setIsSkipping(true);
    setApiError(null);

    try {
      await signIn(createPreviewSession());
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch {
      setApiError('Unable to enter preview mode. Please try again.');
    } finally {
      setIsSkipping(false);
    }
  };

  return (
    <AuthScreenLayout
      footer={
        <>
          <AuthPrimaryButton
            title="Continue"
            onPress={handleContinue}
            disabled={!isValid}
            loading={isLoading}
          />
          {showSkipAuth ? (
            <Pressable
              onPress={() => void handleSkipAuth()}
              disabled={isSkipping || isLoading}
              style={({ pressed }) => [
                styles.skipButton,
                pressed && styles.skipButtonPressed,
                (isSkipping || isLoading) && styles.skipButtonDisabled,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Continue without login for preview testing"
            >
              <Text style={styles.skipButtonText}>
                {isSkipping ? 'Opening home...' : 'Continue without login (preview)'}
              </Text>
            </Pressable>
          ) : null}
          <Text style={styles.termsText}>
            By continuing, you agree to our{' '}
            <Text style={styles.termsLink}>Terms of Service</Text>
            {' & '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </>
      }
    >
      <Text style={styles.title}>Enter mobile number</Text>
      <Text style={styles.subtitle}>
        We&apos;ll send a one-time verification code to your phone
      </Text>

      <Pressable
        onPress={() => inputRef.current?.focus()}
        style={[
          styles.phoneRow,
          isFocused && styles.phoneRowFocused,
          showError && styles.phoneRowError,
        ]}
      >
        <View style={styles.countryBox}>
          <Text style={styles.flag}>🇮🇳</Text>
          <Text style={styles.countryCode}>{APP_CONFIG.COUNTRY_CODE}</Text>
        </View>

        <View style={styles.divider} />

        <TextInput
          ref={inputRef}
          style={styles.phoneInput}
          placeholder="98765 43210"
          placeholderTextColor={colors.textMuted}
          keyboardType="phone-pad"
          maxLength={11}
          value={formatPhoneDisplay(phoneNumber)}
          onChangeText={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          returnKeyType="done"
          onSubmitEditing={handleContinue}
          accessibilityLabel="Mobile number"
        />
      </Pressable>

      {showError ? (
        <Text style={styles.errorText}>Enter a valid 10-digit mobile number</Text>
      ) : null}

      {apiError ? <Text style={styles.errorText}>{apiError}</Text> : null}
    </AuthScreenLayout>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    letterSpacing: -0.2,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.xxl,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.lg,
    height: 56,
  },
  phoneRowFocused: {
    borderColor: colors.borderFocused,
    backgroundColor: colors.surface,
  },
  phoneRowError: {
    borderColor: colors.error,
    backgroundColor: colors.errorLight + '40',
  },
  countryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  flag: {
    fontSize: 18,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  divider: {
    width: 1,
    height: 26,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  phoneInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: 1,
    paddingVertical: 0,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.sm,
  },
  termsText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: 18,
  },
  termsLink: {
    color: colors.primary,
    fontWeight: '600',
  },
  skipButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
  },
  skipButtonPressed: {
    opacity: 0.85,
  },
  skipButtonDisabled: {
    opacity: 0.5,
  },
  skipButtonText: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});

export default PhoneNumberScreen;
