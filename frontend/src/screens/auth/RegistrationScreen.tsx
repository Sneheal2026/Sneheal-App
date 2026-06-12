import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Image,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeOutUp,
  LinearTransition,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {
  AuthScreenLayout,
  AuthPrimaryButton,
} from '@/components/auth';
import theme from '@/styles/theme';
import type { AuthScreenProps, AppLanguage, UserRole } from '@/navigation/types';

const { colors, spacing, typography, borderRadius } = theme;

const LANGUAGES: { value: AppLanguage; label: string }[] = [
  { value: 'ENGLISH', label: 'English' },
  { value: 'HINDI', label: 'Hindi' },
  { value: 'MARATHI', label: 'Marathi' },
];

const ROLES: { value: UserRole; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'customer', label: 'Customer', icon: 'person-outline' },
  { value: 'delivery_agent', label: 'Delivery Agent', icon: 'bicycle-outline' },
  { value: 'doctor', label: 'Doctor', icon: 'medkit-outline' },
];

async function pickAadharImage(
  source: 'camera' | 'gallery',
  onPicked: (uri: string) => void,
  onDenied: (message: string) => void,
): Promise<void> {
  const permission =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    onDenied(
      `Please allow ${source === 'camera' ? 'camera' : 'photo library'} access to upload your Aadhar card.`,
    );
    return;
  }

  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: 'images',
          allowsEditing: true,
          quality: 0.85,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: 'images',
          allowsEditing: true,
          quality: 0.85,
        });

  if (!result.canceled && result.assets[0]?.uri) {
    onPicked(result.assets[0].uri);
  }
}

const RegistrationScreen = ({
  navigation,
  route,
}: AuthScreenProps<'Registration'>) => {
  const { phoneNumber } = route.params;

  const [username, setUsername] = useState('');
  const [language, setLanguage] = useState<AppLanguage | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [aadharUri, setAadharUri] = useState<string | null>(null);
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [landmark, setLandmark] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const isUsernameValid = username.trim().length >= 2;
  const isLanguageValid = language !== null;
  const isRoleValid = role !== null;

  const isAadharValid = role !== 'delivery_agent' || aadharUri !== null;
  const isDoctorAddressValid =
    role !== 'doctor' ||
    (addressLine.trim().length >= 5 &&
      city.trim().length >= 2 &&
      state.trim().length >= 2 &&
      /^\d{6}$/.test(pincode));

  const canContinue =
    isUsernameValid &&
    isLanguageValid &&
    isRoleValid &&
    isAadharValid &&
    isDoctorAddressValid;

  useEffect(() => {
    if (role !== 'delivery_agent') {
      setAadharUri(null);
    }
    if (role !== 'doctor') {
      setAddressLine('');
      setCity('');
      setState('');
      setPincode('');
      setLandmark('');
    }
  }, [role]);

  const handlePickAadhar = useCallback((source: 'camera' | 'gallery') => {
    setPermissionError(null);
    void pickAadharImage(
      source,
      (uri) => setAadharUri(uri),
      (message) => setPermissionError(message),
    );
  }, []);

  const handleContinue = useCallback(() => {
    if (!canContinue || !role) return;

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);

      const destination =
        role === 'customer'
          ? 'Main'
          : role === 'delivery_agent'
            ? 'DeliveryAgentMain'
            : 'DoctorMain';

      navigation.reset({
        index: 0,
        routes: [{ name: destination }],
      });
    }, 800);
  }, [canContinue, role, navigation]);

  return (
    <AuthScreenLayout
      showBack
      onBack={() => navigation.goBack()}
      footer={
        <AuthPrimaryButton
          title="Continue"
          onPress={handleContinue}
          disabled={!canContinue}
          loading={isSubmitting}
        />
      }
    >
      <Text style={styles.title}>Complete your profile</Text>
      <Text style={styles.subtitle}>
        Tell us a bit about yourself to personalize your Sneheal experience
      </Text>

      {/* Username */}
      <Text style={styles.label}>Username</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your username"
        placeholderTextColor={colors.textMuted}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={30}
        accessibilityLabel="Username"
      />
      {username.length > 0 && !isUsernameValid ? (
        <Text style={styles.errorText}>Username must be at least 2 characters</Text>
      ) : null}

      {/* Language */}
      <Text style={styles.label}>Preferred language</Text>
      <View style={styles.chipRow}>
        {LANGUAGES.map((lang) => {
          const selected = language === lang.value;
          return (
            <Pressable
              key={lang.value}
              onPress={() => setLanguage(lang.value)}
              style={[styles.chip, selected && styles.chipSelected]}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {lang.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Role */}
      <Text style={styles.label}>I am a</Text>
      <View style={styles.roleList}>
        {ROLES.map((item) => {
          const selected = role === item.value;
          return (
            <Pressable
              key={item.value}
              onPress={() => setRole(item.value)}
              style={[styles.roleCard, selected && styles.roleCardSelected]}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
            >
              <View style={[styles.roleIconWrap, selected && styles.roleIconWrapSelected]}>
                <Ionicons
                  name={item.icon}
                  size={22}
                  color={selected ? colors.textInverse : colors.primary}
                />
              </View>
              <Text style={[styles.roleLabel, selected && styles.roleLabelSelected]}>
                {item.label}
              </Text>
              <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                {selected ? <View style={styles.radioInner} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Delivery Agent — Aadhar upload */}
      {role === 'delivery_agent' ? (
        <Animated.View layout={LinearTransition.springify()}>
        <Animated.View
          entering={FadeInDown.duration(350).springify()}
          exiting={FadeOutUp.duration(200)}
          style={styles.conditionalSection}
        >
          <Text style={styles.label}>Upload Aadhar Card</Text>
          <Text style={styles.hint}>
            Upload a clear photo of your Aadhar card for identity verification
          </Text>
          <View style={[styles.uploadBox, aadharUri && styles.uploadBoxFilled]}>
            {aadharUri ? (
              <Pressable
                onPress={() => handlePickAadhar('gallery')}
                style={styles.uploadPreviewWrap}
                accessibilityLabel="Change Aadhar card photo"
              >
                <Image source={{ uri: aadharUri }} style={styles.aadharPreview} />
                <View style={styles.uploadOverlay}>
                  <Ionicons name="camera" size={20} color={colors.textInverse} />
                  <Text style={styles.uploadOverlayText}>Change photo</Text>
                </View>
              </Pressable>
            ) : (
              <View style={styles.uploadPlaceholder}>
                <View style={styles.uploadIconWrap}>
                  <Ionicons name="cloud-upload-outline" size={28} color={colors.primary} />
                </View>
                <Text style={styles.uploadTitle}>Upload Aadhar card</Text>
                <Text style={styles.uploadSubtitle}>Choose camera or gallery below</Text>
              </View>
            )}
          </View>

          <View style={styles.uploadActions}>
            <Pressable
              style={styles.uploadActionBtn}
              onPress={() => handlePickAadhar('camera')}
              accessibilityLabel="Take Aadhar card photo"
            >
              <Ionicons name="camera-outline" size={20} color={colors.primary} />
              <Text style={styles.uploadActionText}>Take Photo</Text>
            </Pressable>
            <Pressable
              style={styles.uploadActionBtn}
              onPress={() => handlePickAadhar('gallery')}
              accessibilityLabel="Choose Aadhar card from gallery"
            >
              <Ionicons name="images-outline" size={20} color={colors.primary} />
              <Text style={styles.uploadActionText}>Gallery</Text>
            </Pressable>
          </View>

          {permissionError ? (
            <Text style={styles.errorText}>{permissionError}</Text>
          ) : null}
        </Animated.View>
        </Animated.View>
      ) : null}

      {/* Doctor — Address details */}
      {role === 'doctor' ? (
        <Animated.View layout={LinearTransition.springify()}>
        <Animated.View
          entering={FadeInDown.duration(350).springify()}
          exiting={FadeOutUp.duration(200)}
          style={styles.conditionalSection}
        >
          <Text style={styles.label}>Clinic / Practice address</Text>
          <Text style={styles.hint}>
            Enter your full address so patients can find your clinic
          </Text>

          <Text style={styles.fieldLabel}>Full address</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="Building, street, area"
            placeholderTextColor={colors.textMuted}
            value={addressLine}
            onChangeText={setAddressLine}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.fieldLabel}>City</Text>
              <TextInput
                style={styles.input}
                placeholder="City"
                placeholderTextColor={colors.textMuted}
                value={city}
                onChangeText={setCity}
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.fieldLabel}>State</Text>
              <TextInput
                style={styles.input}
                placeholder="State"
                placeholderTextColor={colors.textMuted}
                value={state}
                onChangeText={setState}
              />
            </View>
          </View>

          <Text style={styles.fieldLabel}>Pincode</Text>
          <TextInput
            style={styles.input}
            placeholder="6-digit pincode"
            placeholderTextColor={colors.textMuted}
            value={pincode}
            onChangeText={(t) => setPincode(t.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
          />
          {pincode.length > 0 && !/^\d{6}$/.test(pincode) ? (
            <Text style={styles.errorText}>Enter a valid 6-digit pincode</Text>
          ) : null}

          <Text style={styles.fieldLabel}>Landmark (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Near hospital, mall, etc."
            placeholderTextColor={colors.textMuted}
            value={landmark}
            onChangeText={setLandmark}
          />
        </Animated.View>
        </Animated.View>
      ) : null}

      <Text style={styles.phoneNote}>
        Registering with {phoneNumber.replace(/(\d{5})(\d{5})/, '$1 $2')}
      </Text>
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
    marginBottom: spacing.xl,
  },
  label: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  fieldLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  multilineInput: {
    minHeight: 80,
    paddingTop: spacing.md,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.infoLight,
  },
  chipText: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  roleList: {
    gap: spacing.sm,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
  },
  roleCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.infoLight,
  },
  roleIconWrap: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  roleIconWrapSelected: {
    backgroundColor: colors.primary,
  },
  roleLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  roleLabelSelected: {
    fontWeight: '700',
    color: colors.primary,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  conditionalSection: {
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  uploadBox: {
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceSecondary,
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: spacing.lg,
  },
  uploadBoxFilled: {
    borderStyle: 'solid',
    borderColor: colors.primary,
    padding: 0,
    minHeight: 180,
  },
  uploadPreviewWrap: {
    width: '100%',
    minHeight: 180,
  },
  uploadPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    width: '100%',
  },
  uploadActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  uploadActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.infoLight,
  },
  uploadActionText: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.primary,
  },
  uploadIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  uploadTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  uploadSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
  aadharPreview: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  uploadOverlayText: {
    ...typography.caption,
    color: colors.textInverse,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfField: {
    flex: 1,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
  phoneNote: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
});

export default RegistrationScreen;
