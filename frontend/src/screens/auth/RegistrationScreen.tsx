import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Image,
  Alert,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOutUp,
  LinearTransition,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import {
  AuthScreenLayout,
  AuthPrimaryButton,
} from '@/components/auth';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/context/AuthContext';
import { completeRegistration } from '@/services/authService';
import { devLog } from '@/utils/devLogger';
import { resolveAuthRoute } from '@/navigation/resolveAuthRoute';
import type { AuthScreenProps, AppLanguage, UserRole } from '@/navigation/types';
import type { CompleteRegistrationPayload, ImageDocument } from '@/types/auth';

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

type DocumentKey = 'aadhar' | 'license';

const MAX_IMAGE_SIZE_BYTES = 1 * 1024 * 1024; // 1 MB
const MAX_IMAGE_SIZE_MB = 1;

async function pickDocumentImage(
  source: 'camera' | 'gallery',
  documentLabel: string,
  onPicked: (uri: string) => void,
  onDenied: (message: string) => void,
): Promise<void> {
  const permission =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    onDenied(
      `Please allow ${source === 'camera' ? 'camera' : 'photo library'} access to upload your ${documentLabel}.`,
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
    const asset = result.assets[0];

    let fileSize = asset.fileSize;
    if (!fileSize) {
      try {
        const info = await FileSystem.getInfoAsync(asset.uri);
        if (info.exists && 'size' in info) {
          fileSize = info.size;
        }
      } catch {
        devLog('Registration', 'Could not get file size', { uri: asset.uri });
      }
    }

    if (fileSize && fileSize > MAX_IMAGE_SIZE_BYTES) {
      const sizeMB = (fileSize / (1024 * 1024)).toFixed(2);
      onDenied(
        `${documentLabel} is ${sizeMB} MB. Please choose an image smaller than ${MAX_IMAGE_SIZE_MB} MB.`,
      );
      return;
    }

    onPicked(asset.uri);
  }
}

async function readImageAsBase64(uri: string): Promise<ImageDocument | null> {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64',
    });

    let mimeType = 'image/jpeg';
    if (uri.toLowerCase().endsWith('.png')) {
      mimeType = 'image/png';
    } else if (uri.toLowerCase().endsWith('.jpg') || uri.toLowerCase().endsWith('.jpeg')) {
      mimeType = 'image/jpeg';
    }

    return { base64, mimeType };
  } catch (error) {
    devLog('Registration', 'Failed to read image as base64', error);
    return null;
  }
}

interface DocumentUploadFieldProps {
  label: string;
  hint: string;
  icon: keyof typeof Ionicons.glyphMap;
  uri: string | null;
  error: string | null;
  onPick: (source: 'camera' | 'gallery') => void;
  colors: ReturnType<typeof useTheme>['colors'];
  spacing: ReturnType<typeof useTheme>['spacing'];
  typography: ReturnType<typeof useTheme>['typography'];
  borderRadius: ReturnType<typeof useTheme>['borderRadius'];
  shadows: ReturnType<typeof useTheme>['shadows'];
}

const DocumentUploadField = ({
  label,
  hint,
  icon,
  uri,
  error,
  onPick,
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
}: DocumentUploadFieldProps) => (
  <View
    style={[
      docStyles.card,
      {
        marginBottom: spacing.md,
        borderRadius: borderRadius.lg,
        backgroundColor: colors.white,
        borderColor: uri ? colors.primary : `${colors.primary}18`,
        padding: spacing.lg,
      },
      shadows.sm,
    ]}
  >
    <View style={docStyles.labelRow}>
      <View
        style={[
          docStyles.labelIcon,
          {
            backgroundColor: uri ? colors.successLight : colors.infoLight,
            borderRadius: borderRadius.full,
          },
        ]}
      >
        <Ionicons
          name={uri ? 'checkmark-circle' : icon}
          size={18}
          color={uri ? colors.success : colors.primary}
        />
      </View>
      <View style={docStyles.labelTextWrap}>
        <Text style={[docStyles.label, typography.bodySmall, { color: colors.textPrimary }]}>
          {label}
        </Text>
        <Text style={[docStyles.hint, typography.caption, { color: colors.textSecondary }]}>
          {hint}
        </Text>
      </View>
    </View>

    <Pressable
      onPress={() => onPick('gallery')}
      style={({ pressed }) => [
        docStyles.uploadBox,
        {
          borderRadius: borderRadius.lg,
          backgroundColor: colors.white,
          borderColor: uri ? colors.primary : colors.border,
        },
        uri && docStyles.uploadBoxFilled,
        pressed && { opacity: 0.7 },
      ]}
      accessibilityLabel={uri ? `Change ${label}` : `Upload ${label}`}
    >
      {uri ? (
        <>
          <Image source={{ uri }} style={docStyles.preview} />
          <View style={docStyles.overlay}>
            <Ionicons name="camera" size={18} color={colors.textInverse} />
            <Text style={[docStyles.overlayText, { color: colors.textInverse }]}>Change</Text>
          </View>
        </>
      ) : (
        <View style={docStyles.placeholder}>
          <Ionicons name="cloud-upload-outline" size={26} color={colors.primary} />
          <Text style={[docStyles.placeholderTitle, { color: colors.textPrimary }]}>
            Tap to upload
          </Text>
        </View>
      )}
    </Pressable>

    <View style={[docStyles.actions, { gap: spacing.sm, marginTop: spacing.sm }]}>
      <Pressable
        style={({ pressed }) => [
          docStyles.actionBtn,
          {
            borderRadius: borderRadius.full,
            borderColor: colors.border,
            backgroundColor: colors.white,
          },
          pressed && { opacity: 0.7 },
        ]}
        onPress={() => onPick('camera')}
      >
        <Ionicons name="camera-outline" size={17} color={colors.primary} />
        <Text style={[docStyles.actionText, typography.caption, { color: colors.textSecondary }]}>
          Camera
        </Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [
          docStyles.actionBtn,
          {
            borderRadius: borderRadius.full,
            borderColor: colors.border,
            backgroundColor: colors.white,
          },
          pressed && { opacity: 0.7 },
        ]}
        onPress={() => onPick('gallery')}
      >
        <Ionicons name="images-outline" size={17} color={colors.primary} />
        <Text style={[docStyles.actionText, typography.caption, { color: colors.textSecondary }]}>
          Gallery
        </Text>
      </Pressable>
    </View>

    {error ? (
      <Text style={[docStyles.error, typography.caption, { color: colors.error }]}>{error}</Text>
    ) : null}
  </View>
);

const docStyles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 10,
  },
  labelIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelTextWrap: {
    flex: 1,
  },
  label: {
    fontWeight: '700',
    marginBottom: 2,
  },
  hint: {
    lineHeight: 17,
  },
  uploadBox: {
    borderWidth: 1,
    minHeight: 130,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  uploadBoxFilled: {
    minHeight: 150,
    padding: 0,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 8,
  },
  placeholderTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  preview: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  overlayText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderWidth: 1,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  error: {
    marginTop: 6,
  },
});

const RegistrationScreen = ({
  navigation,
  route,
}: AuthScreenProps<'Registration'>) => {
  const { phoneNumber } = route.params;
  const { colors, spacing, typography, borderRadius, shadows } = useTheme();
  const { accessToken, signIn } = useAuth();

  const [username, setUsername] = useState('');
  const [language, setLanguage] = useState<AppLanguage | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [aadharUri, setAadharUri] = useState<string | null>(null);
  const [licenseUri, setLicenseUri] = useState<string | null>(null);
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [landmark, setLandmark] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [permissionErrors, setPermissionErrors] = useState<
    Record<DocumentKey, string | null>
  >({ aadhar: null, license: null });

  const isUsernameValid = username.trim().length >= 2;
  const isLanguageValid = language !== null;
  const isRoleValid = role !== null;

  const isDeliveryDocsValid =
    role !== 'delivery_agent' || (aadharUri !== null && licenseUri !== null);
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
    isDeliveryDocsValid &&
    isDoctorAddressValid;

  const deliveryDocsCount =
    (aadharUri ? 1 : 0) + (licenseUri ? 1 : 0);

  useEffect(() => {
    if (role !== 'delivery_agent') {
      setAadharUri(null);
      setLicenseUri(null);
      setPermissionErrors({ aadhar: null, license: null });
    }
    if (role !== 'doctor') {
      setAddressLine('');
      setCity('');
      setState('');
      setPincode('');
      setLandmark('');
    }
  }, [role]);

  const handlePickDocument = useCallback(
    (key: DocumentKey, documentLabel: string) => (source: 'camera' | 'gallery') => {
      setPermissionErrors((prev) => ({ ...prev, [key]: null }));
      const setUri = key === 'aadhar' ? setAadharUri : setLicenseUri;

      void pickDocumentImage(
        source,
        documentLabel,
        (uri) => setUri(uri),
        (message) => setPermissionErrors((prev) => ({ ...prev, [key]: message })),
      );
    },
    [],
  );

  const handleContinue = useCallback(async () => {
    if (!canContinue || !role || !language || isSubmitting) return;

    if (!accessToken) {
      Alert.alert('Session expired', 'Please verify your phone number again.');
      navigation.reset({ index: 0, routes: [{ name: 'PhoneNumber' }] });
      return;
    }

    setIsSubmitting(true);
    await Promise.resolve();

    try {
      const payload: CompleteRegistrationPayload = {
        username: username.trim(),
        language,
        role,
      };

      if (role === 'doctor') {
        payload.clinic = {
          addressLine: addressLine.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          landmark: landmark.trim() || undefined,
        };
      }

      if (role === 'delivery_agent') {
        if (!aadharUri || !licenseUri) {
          Alert.alert('Error', 'Please upload both Aadhar card and driving license');
          return;
        }

        const aadharDoc = await readImageAsBase64(aadharUri);
        const licenseDoc = await readImageAsBase64(licenseUri);

        if (!aadharDoc || !licenseDoc) {
          Alert.alert('Error', 'Failed to read document images. Please try again.');
          return;
        }

        payload.documents = {
          aadhar: aadharDoc,
          license: licenseDoc,
        };
      }

      devLog('Registration', 'Submitting registration', { role, username: payload.username });

      const response = await completeRegistration(payload, accessToken);

      devLog('Registration', 'Registration successful', {
        userId: response.user.id,
        profileCompleted: response.user.profileCompleted,
      });

      await signIn(response);

      const { route: nextRoute, params } = resolveAuthRoute(response.user);
      navigation.reset({
        index: 0,
        routes: params ? [{ name: nextRoute, params }] : [{ name: nextRoute }],
      });
    } catch (error) {
      devLog('Registration', 'Registration failed', error);

      const message =
        error instanceof Error ? error.message : 'Registration failed. Please try again.';
      Alert.alert('Registration Failed', message);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    canContinue,
    role,
    language,
    accessToken,
    isSubmitting,
    username,
    addressLine,
    city,
    state,
    pincode,
    landmark,
    aadharUri,
    licenseUri,
    signIn,
    navigation,
  ]);

  const styles = StyleSheet.create({
    title: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: spacing.xs,
      letterSpacing: -0.4,
    },
    subtitle: {
      ...typography.bodySmall,
      color: colors.textSecondary,
      lineHeight: 21,
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
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: borderRadius.lg,
      backgroundColor: colors.white,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      fontSize: 15,
      fontWeight: '500',
      color: colors.textPrimary,
      ...shadows.sm,
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
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.white,
    },
    chipSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
    chipText: {
      ...typography.caption,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    chipTextSelected: {
      color: colors.white,
      fontWeight: '600',
    },
    roleList: {
      gap: spacing.sm,
    },
    roleCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.lg,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.white,
      ...shadows.sm,
    },
    roleCardSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
    roleIconWrap: {
      width: 48,
      height: 48,
      borderRadius: borderRadius.full,
      backgroundColor: colors.infoLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    roleIconWrapSelected: {
      backgroundColor: colors.white,
    },
    roleLabel: {
      flex: 1,
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    roleLabelSelected: {
      fontWeight: '700',
      color: colors.white,
    },
    checkWrap: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkWrapSelected: {
      borderColor: colors.white,
      backgroundColor: colors.white,
    },
    conditionalSection: {
      marginTop: spacing.sm,
      overflow: 'hidden',
    },
    addressCard: {
      marginTop: spacing.sm,
      overflow: 'hidden',
      backgroundColor: colors.white,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: `${colors.primary}18`,
      ...shadows.sm,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
      marginTop: spacing.xs,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
      letterSpacing: -0.2,
    },
    progressPill: {
      paddingHorizontal: spacing.md,
      paddingVertical: 4,
      borderRadius: borderRadius.full,
      backgroundColor: colors.infoLight,
    },
    progressText: {
      ...typography.caption,
      fontWeight: '700',
      color: colors.primary,
    },
    progressTrack: {
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.surfaceSecondary,
      marginBottom: spacing.md,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 2,
      backgroundColor: colors.primary,
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

  const enterAnim = FadeInDown.duration(380).damping(22).stiffness(140);
  const exitAnim = FadeOutUp.duration(220);

  return (
    <AuthScreenLayout
      mutedBackground
      showBack
      onBack={() => navigation.goBack()}
      footer={
        <AuthPrimaryButton
          title="Continue"
          onPress={handleContinue}
          disabled={!canContinue || isSubmitting}
          loading={isSubmitting}
        />
      }
    >
      <Animated.Text entering={FadeIn.duration(400)} style={styles.title}>
        Complete your profile
      </Animated.Text>
      <Animated.Text entering={FadeIn.duration(400).delay(60)} style={styles.subtitle}>
        Tell us a bit about yourself to personalize your Sneheal experience
      </Animated.Text>

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

      <Text style={styles.label}>Preferred language</Text>
      <View style={styles.chipRow}>
        {LANGUAGES.map((lang, index) => {
          const selected = language === lang.value;
          return (
            <Animated.View
              key={lang.value}
              entering={FadeIn.duration(300).delay(index * 40)}
            >
              <Pressable
                onPress={() => setLanguage(lang.value)}
                style={({ pressed }) => [
                  styles.chip,
                  selected && styles.chipSelected,
                  pressed && { opacity: 0.7 },
                ]}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {lang.label}
                </Text>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      <Text style={styles.label}>I am a</Text>
      <View style={styles.roleList}>
        {ROLES.map((item, index) => {
          const selected = role === item.value;
          return (
            <Animated.View
              key={item.value}
              entering={FadeInDown.duration(350).delay(index * 50).damping(20)}
              layout={LinearTransition.springify().damping(20).stiffness(160)}
            >
              <Pressable
                onPress={() => setRole(item.value)}
                style={({ pressed }) => [
                  styles.roleCard,
                  selected && styles.roleCardSelected,
                  pressed && { opacity: 0.7 },
                ]}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
              >
                <View style={[styles.roleIconWrap, selected && styles.roleIconWrapSelected]}>
                  <Ionicons
                    name={item.icon}
                    size={22}
                    color={colors.primary}
                  />
                </View>
                <Text style={[styles.roleLabel, selected && styles.roleLabelSelected]}>
                  {item.label}
                </Text>
                <View style={[styles.checkWrap, selected && styles.checkWrapSelected]}>
                  {selected ? (
                    <Ionicons name="checkmark" size={14} color={colors.primary} />
                  ) : null}
                </View>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      {role === 'delivery_agent' ? (
        <Animated.View layout={LinearTransition.springify().damping(20).stiffness(150)}>
          <Animated.View
            entering={enterAnim}
            exiting={exitAnim}
            style={styles.conditionalSection}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Identity verification</Text>
              <View style={styles.progressPill}>
                <Text style={styles.progressText}>{deliveryDocsCount}/2</Text>
              </View>
            </View>

            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressFill,
                  { width: `${(deliveryDocsCount / 2) * 100}%` },
                ]}
                layout={LinearTransition.springify()}
              />
            </View>

            <DocumentUploadField
              label="Aadhar Card"
              hint="Clear photo of your Aadhar for identity verification (JPEG/PNG, max 1 MB)"
              icon="card-outline"
              uri={aadharUri}
              error={permissionErrors.aadhar}
              onPick={handlePickDocument('aadhar', 'Aadhar card')}
              colors={colors}
              spacing={spacing}
              typography={typography}
              borderRadius={borderRadius}
              shadows={shadows}
            />

            <DocumentUploadField
              label="Driving License"
              hint="Valid driving license required for delivery partners (JPEG/PNG, max 1 MB)"
              icon="car-outline"
              uri={licenseUri}
              error={permissionErrors.license}
              onPick={handlePickDocument('license', 'driving license')}
              colors={colors}
              spacing={spacing}
              typography={typography}
              borderRadius={borderRadius}
              shadows={shadows}
            />
          </Animated.View>
        </Animated.View>
      ) : null}

      {role === 'doctor' ? (
        <Animated.View layout={LinearTransition.springify().damping(20).stiffness(150)}>
          <Animated.View
            entering={enterAnim}
            exiting={exitAnim}
            style={styles.addressCard}
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

export default RegistrationScreen;
