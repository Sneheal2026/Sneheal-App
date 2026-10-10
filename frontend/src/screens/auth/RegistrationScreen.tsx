import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Image,
  Alert,
  KeyboardTypeOptions,
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
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/context/LanguageContext';

const LANGUAGES: { value: AppLanguage; label: string }[] = [
  { value: 'ENGLISH', label: 'English' },
  { value: 'HINDI', label: 'हिन्दी' },
  { value: 'MARATHI', label: 'मराठी' },
];

const ROLES: {
  value: UserRole;
  labelKey: string;
  hintKey: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconFilled: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    value: 'customer',
    labelKey: 'auth.roleCustomer',
    hintKey: 'auth.roleCustomerHint',
    icon: 'bag-handle-outline',
    iconFilled: 'bag-handle',
  },
  {
    value: 'delivery_agent',
    labelKey: 'auth.roleDeliveryAgent',
    hintKey: 'auth.roleDeliveryHint',
    icon: 'bicycle-outline',
    iconFilled: 'bicycle',
  },
  {
    value: 'doctor',
    labelKey: 'auth.roleDoctor',
    hintKey: 'auth.roleDoctorHint',
    icon: 'medkit-outline',
    iconFilled: 'medkit',
  },
];

type DocumentKey = 'aadhar' | 'license';
type FieldKey =
  | 'username'
  | 'address'
  | 'city'
  | 'state'
  | 'pincode'
  | 'landmark';

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
  sizeHint: string;
  icon: keyof typeof Ionicons.glyphMap;
  uri: string | null;
  error: string | null;
  onPick: (source: 'camera' | 'gallery') => void;
  colors: ReturnType<typeof useTheme>['colors'];
  changeLabel: string;
  tapToUploadLabel: string;
  cameraLabel: string;
  galleryLabel: string;
}

const DocumentUploadField = ({
  label,
  hint,
  sizeHint,
  icon,
  uri,
  error,
  onPick,
  colors,
  changeLabel,
  tapToUploadLabel,
  cameraLabel,
  galleryLabel,
}: DocumentUploadFieldProps) => (
  <View
    style={[
      docStyles.card,
      {
        backgroundColor: colors.white,
        borderColor: uri ? colors.primary : `${colors.primary}22`,
      },
    ]}
  >
    <View style={docStyles.labelRow}>
      <View
        style={[
          docStyles.labelIcon,
          { backgroundColor: uri ? colors.successLight : `${colors.primary}14` },
        ]}
      >
        <Ionicons
          name={uri ? 'checkmark' : icon}
          size={14}
          color={uri ? colors.success : colors.primary}
        />
      </View>
      <View style={docStyles.labelTextWrap}>
        <Text
          style={[docStyles.label, { color: colors.textPrimary }]}
          numberOfLines={1}
        >
          {label}
        </Text>
        <Text
          style={[docStyles.sizeHint, { color: colors.textMuted }]}
          numberOfLines={1}
        >
          {sizeHint}
        </Text>
      </View>
    </View>

    <Pressable
      onPress={() => onPick('gallery')}
      style={({ pressed }) => [
        docStyles.uploadBox,
        {
          backgroundColor: uri ? colors.white : `${colors.primary}08`,
          borderColor: uri ? colors.primary : `${colors.primary}40`,
        },
        uri && docStyles.uploadBoxFilled,
        pressed && { opacity: 0.78 },
      ]}
      accessibilityLabel={uri ? `Change ${label}` : `Upload ${label}`}
      accessibilityHint={hint}
    >
      {uri ? (
        <>
          <Image source={{ uri }} style={docStyles.preview} />
          <View style={docStyles.overlay}>
            <Ionicons name="camera" size={16} color={colors.textInverse} />
            <Text style={[docStyles.overlayText, { color: colors.textInverse }]}>
              {changeLabel}
            </Text>
          </View>
        </>
      ) : (
        <View style={docStyles.placeholder}>
          <View
            style={[docStyles.placeholderIcon, { backgroundColor: colors.white }]}
          >
            <Ionicons name="cloud-upload-outline" size={22} color={colors.primary} />
          </View>
          <Text style={[docStyles.placeholderTitle, { color: colors.textPrimary }]}>
            {tapToUploadLabel}
          </Text>
        </View>
      )}
    </Pressable>

    <View style={docStyles.actions}>
      <Pressable
        style={({ pressed }) => [
          docStyles.actionBtn,
          {
            borderColor: `${colors.primary}28`,
            backgroundColor: `${colors.primary}0A`,
          },
          pressed && { opacity: 0.7 },
        ]}
        onPress={() => onPick('camera')}
        accessibilityLabel={cameraLabel}
      >
        <Ionicons name="camera-outline" size={16} color={colors.primary} />
      </Pressable>
      <Pressable
        style={({ pressed }) => [
          docStyles.actionBtn,
          {
            borderColor: `${colors.primary}28`,
            backgroundColor: `${colors.primary}0A`,
          },
          pressed && { opacity: 0.7 },
        ]}
        onPress={() => onPick('gallery')}
        accessibilityLabel={galleryLabel}
      >
        <Ionicons name="images-outline" size={16} color={colors.primary} />
      </Pressable>
    </View>

    {error ? (
      <Text style={[docStyles.error, { color: colors.error }]}>{error}</Text>
    ) : null}
  </View>
);

const docStyles = StyleSheet.create({
  card: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 18,
    padding: 12,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  labelIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelTextWrap: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  sizeHint: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  uploadBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 14,
    minHeight: 108,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  uploadBoxFilled: {
    minHeight: 108,
    borderStyle: 'solid',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    gap: 8,
  },
  placeholderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderTitle: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  preview: {
    width: '100%',
    height: 108,
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.38)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  overlayText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  actionBtn: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
  },
});

interface IconFieldProps {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
  valid?: boolean;
  multiline?: boolean;
  keyboardType?: KeyboardTypeOptions;
  maxLength?: number;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  accessibilityLabel?: string;
}

const IconField = ({
  icon,
  value,
  onChangeText,
  placeholder,
  focused,
  onFocus,
  onBlur,
  colors,
  valid,
  multiline,
  keyboardType,
  maxLength,
  autoCapitalize,
  autoCorrect,
  accessibilityLabel,
}: IconFieldProps) => (
  <View
    style={[
      iconFieldStyles.shell,
      {
        backgroundColor: colors.white,
        borderColor: focused
          ? colors.primary
          : valid
            ? colors.success
            : colors.border,
        alignItems: multiline ? 'flex-start' : 'center',
      },
    ]}
  >
    <Ionicons
      name={icon}
      size={18}
      color={focused ? colors.primary : valid ? colors.success : colors.textMuted}
      style={multiline ? { marginTop: 2 } : undefined}
    />
    <TextInput
      style={[
        iconFieldStyles.input,
        { color: colors.textPrimary },
        multiline && iconFieldStyles.multiline,
      ]}
      placeholder={placeholder}
      placeholderTextColor={colors.textMuted}
      value={value}
      onChangeText={onChangeText}
      onFocus={onFocus}
      onBlur={onBlur}
      multiline={multiline}
      numberOfLines={multiline ? 3 : 1}
      textAlignVertical={multiline ? 'top' : 'center'}
      keyboardType={keyboardType}
      maxLength={maxLength}
      autoCapitalize={autoCapitalize}
      autoCorrect={autoCorrect}
      accessibilityLabel={accessibilityLabel}
    />
    {valid ? (
      <Ionicons name="checkmark-circle" size={18} color={colors.success} />
    ) : null}
  </View>
);

const iconFieldStyles = StyleSheet.create({
  shell: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    padding: 0,
    margin: 0,
  },
  multiline: {
    minHeight: 72,
  },
});

const RegistrationScreen = ({
  navigation,
  route,
}: AuthScreenProps<'Registration'>) => {
  const { t } = useTranslation();
  const { phoneNumber } = route.params;
  const { colors, spacing, typography, borderRadius } = useTheme();
  const { accessToken, signIn } = useAuth();
  const { setLanguage: applyAppLanguage } = useLanguage();

  const [username, setUsername] = useState('');
  const [language, setLanguage] = useState<AppLanguage | null>(null);
  const [role, setRole] = useState<UserRole | null>('customer');
  const [aadharUri, setAadharUri] = useState<string | null>(null);
  const [licenseUri, setLicenseUri] = useState<string | null>(null);
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [landmark, setLandmark] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<FieldKey | null>(null);
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
  const docsComplete = deliveryDocsCount === 2;

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
      Alert.alert(t('auth.sessionExpiredTitle'), t('auth.sessionExpiredBody'));
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
          Alert.alert(t('auth.docsRequiredTitle'), t('auth.docsRequiredBody'));
          return;
        }

        const aadharDoc = await readImageAsBase64(aadharUri);
        const licenseDoc = await readImageAsBase64(licenseUri);

        if (!aadharDoc || !licenseDoc) {
          Alert.alert(t('auth.docsRequiredTitle'), t('auth.docsReadFailBody'));
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

      await applyAppLanguage(language);
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
      Alert.alert(t('auth.registrationFailed'), message);
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
    applyAppLanguage,
    t,
  ]);

  const styles = StyleSheet.create({
    intro: {
      marginBottom: spacing.xl,
    },
    badge: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: `${colors.primary}14`,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    title: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: 6,
      letterSpacing: -0.5,
    },
    subtitle: {
      ...typography.bodySmall,
      color: colors.textSecondary,
      lineHeight: 21,
    },
    section: {
      marginBottom: spacing.lg,
    },
    label: {
      ...typography.bodySmall,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    fieldLabel: {
      ...typography.caption,
      fontWeight: '700',
      color: colors.textSecondary,
      marginBottom: 6,
      marginTop: spacing.sm,
    },
    langRow: {
      flexDirection: 'row',
      backgroundColor: colors.white,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 4,
      gap: 4,
    },
    langChip: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    langChipSelected: {
      backgroundColor: colors.primary,
    },
    langText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    langTextSelected: {
      color: colors.white,
    },
    roleList: {
      gap: 10,
    },
    roleCard: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 14,
      paddingLeft: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.white,
      overflow: 'hidden',
    },
    roleCardSelected: {
      borderColor: colors.primary,
      backgroundColor: `${colors.primary}08`,
    },
    roleAccent: {
      position: 'absolute',
      left: 0,
      top: 12,
      bottom: 12,
      width: 3,
      borderRadius: 2,
      backgroundColor: colors.primary,
    },
    roleIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: colors.surfaceSecondary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    roleIconWrapSelected: {
      backgroundColor: `${colors.primary}18`,
    },
    roleCopy: {
      flex: 1,
      marginRight: 10,
    },
    roleLabel: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
      letterSpacing: -0.2,
      marginBottom: 2,
    },
    roleLabelSelected: {
      color: colors.primary,
    },
    roleHint: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.textSecondary,
      lineHeight: 16,
    },
    roleRadio: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    roleRadioSelected: {
      borderColor: colors.primary,
    },
    roleRadioDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.primary,
    },
    extraCard: {
      marginTop: 4,
      marginBottom: spacing.sm,
      backgroundColor: colors.white,
      borderRadius: 20,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: `${colors.primary}18`,
    },
    extraHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      marginBottom: spacing.md,
    },
    extraIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: `${colors.primary}14`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    extraTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: -0.3,
    },
    extraHint: {
      ...typography.caption,
      color: colors.textSecondary,
      lineHeight: 17,
      marginTop: 2,
    },
    extraTitleWrap: {
      flex: 1,
    },
    progressPill: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: borderRadius.full,
      backgroundColor: colors.infoLight,
      alignSelf: 'flex-start',
    },
    progressPillDone: {
      backgroundColor: colors.successLight,
    },
    progressText: {
      ...typography.caption,
      fontWeight: '800',
      color: colors.primary,
    },
    progressTextDone: {
      color: colors.success,
    },
    progressTrack: {
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.surfaceSecondary,
      marginBottom: spacing.md,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 3,
      backgroundColor: colors.primary,
    },
    progressFillDone: {
      backgroundColor: colors.success,
    },
    docsRow: {
      flexDirection: 'row',
      gap: 10,
    },
    row: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    halfField: {
      flex: 1,
    },
    errorText: {
      ...typography.caption,
      color: colors.error,
      marginTop: 6,
      fontWeight: '600',
    },
    phoneNote: {
      alignSelf: 'center',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: borderRadius.full,
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.border,
    },
    phoneNoteText: {
      ...typography.caption,
      color: colors.textSecondary,
      fontWeight: '600',
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
          title={t('common.continue')}
          onPress={handleContinue}
          disabled={!canContinue || isSubmitting}
          loading={isSubmitting}
        />
      }
    >
      <Animated.View entering={FadeIn.duration(400)} style={styles.intro}>
        <View style={styles.badge}>
          <Ionicons name="person-add-outline" size={22} color={colors.primary} />
        </View>
        <Text style={styles.title}>{t('auth.registrationTitle')}</Text>
        <Text style={styles.subtitle}>{t('auth.registrationSubtitle')}</Text>
      </Animated.View>

      <View style={styles.section}>
        <Text style={styles.label}>{t('auth.username')}</Text>
        <IconField
          icon="person-outline"
          value={username}
          onChangeText={setUsername}
          placeholder={t('auth.usernamePlaceholder')}
          focused={focusedField === 'username'}
          onFocus={() => setFocusedField('username')}
          onBlur={() => setFocusedField(null)}
          colors={colors}
          valid={isUsernameValid}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={30}
          accessibilityLabel={t('auth.username')}
        />
        {username.length > 0 && !isUsernameValid ? (
          <Text style={styles.errorText}>{t('auth.usernameError')}</Text>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>{t('auth.preferredLanguage')}</Text>
        <View style={styles.langRow}>
          {LANGUAGES.map((lang) => {
            const selected = language === lang.value;
            return (
              <Pressable
                key={lang.value}
                onPress={() => setLanguage(lang.value)}
                style={({ pressed }) => [
                  styles.langChip,
                  selected && styles.langChipSelected,
                  pressed && { opacity: 0.8 },
                ]}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
              >
                <Text style={[styles.langText, selected && styles.langTextSelected]}>
                  {lang.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>{t('auth.iAmA')}</Text>
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
                    pressed && { opacity: 0.88 },
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={t(item.labelKey)}
                  accessibilityHint={t(item.hintKey)}
                >
                  {selected ? <View style={styles.roleAccent} /> : null}
                  <View style={[styles.roleIconWrap, selected && styles.roleIconWrapSelected]}>
                    <Ionicons
                      name={selected ? item.iconFilled : item.icon}
                      size={20}
                      color={selected ? colors.primary : colors.textSecondary}
                    />
                  </View>
                  <View style={styles.roleCopy}>
                    <Text
                      style={[styles.roleLabel, selected && styles.roleLabelSelected]}
                      numberOfLines={1}
                    >
                      {t(item.labelKey)}
                    </Text>
                    <Text style={styles.roleHint} numberOfLines={2}>
                      {t(item.hintKey)}
                    </Text>
                  </View>
                  <View style={[styles.roleRadio, selected && styles.roleRadioSelected]}>
                    {selected ? <View style={styles.roleRadioDot} /> : null}
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </View>

      {role === 'delivery_agent' ? (
        <Animated.View
          entering={enterAnim}
          exiting={exitAnim}
          layout={LinearTransition.springify().damping(20).stiffness(150)}
          style={styles.extraCard}
        >
          <View style={styles.extraHeader}>
            <View style={styles.extraIcon}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.extraTitleWrap}>
              <Text style={styles.extraTitle}>{t('auth.identityVerification')}</Text>
              <Text style={styles.extraHint}>{t('auth.identityHint')}</Text>
            </View>
            <View style={[styles.progressPill, docsComplete && styles.progressPillDone]}>
              <Text style={[styles.progressText, docsComplete && styles.progressTextDone]}>
                {deliveryDocsCount}/2
              </Text>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                docsComplete && styles.progressFillDone,
                { width: `${(deliveryDocsCount / 2) * 100}%` },
              ]}
              layout={LinearTransition.springify()}
            />
          </View>

          <View style={styles.docsRow}>
            <DocumentUploadField
              label={t('auth.aadharLabel')}
              hint={t('auth.aadharHint')}
              sizeHint={t('auth.docMaxSize')}
              icon="card-outline"
              uri={aadharUri}
              error={permissionErrors.aadhar}
              onPick={handlePickDocument('aadhar', 'Aadhar card')}
              colors={colors}
              changeLabel={t('auth.changePhoto')}
              tapToUploadLabel={t('auth.tapToUpload')}
              cameraLabel={t('scan.camera')}
              galleryLabel={t('scan.gallery')}
            />

            <DocumentUploadField
              label={t('auth.licenseLabel')}
              hint={t('auth.licenseHint')}
              sizeHint={t('auth.docMaxSize')}
              icon="car-outline"
              uri={licenseUri}
              error={permissionErrors.license}
              onPick={handlePickDocument('license', 'driving license')}
              colors={colors}
              changeLabel={t('auth.changePhoto')}
              tapToUploadLabel={t('auth.tapToUpload')}
              cameraLabel={t('scan.camera')}
              galleryLabel={t('scan.gallery')}
            />
          </View>
        </Animated.View>
      ) : null}

      {role === 'doctor' ? (
        <Animated.View
          entering={enterAnim}
          exiting={exitAnim}
          layout={LinearTransition.springify().damping(20).stiffness(150)}
          style={styles.extraCard}
        >
          <View style={styles.extraHeader}>
            <View style={styles.extraIcon}>
              <Ionicons name="location-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.extraTitleWrap}>
              <Text style={styles.extraTitle}>{t('auth.clinicAddress')}</Text>
              <Text style={styles.extraHint}>{t('auth.clinicAddressHint')}</Text>
            </View>
          </View>

          <Text style={styles.fieldLabel}>{t('auth.fullAddress')}</Text>
          <IconField
            icon="home-outline"
            value={addressLine}
            onChangeText={setAddressLine}
            placeholder={t('auth.addressPlaceholder')}
            focused={focusedField === 'address'}
            onFocus={() => setFocusedField('address')}
            onBlur={() => setFocusedField(null)}
            colors={colors}
            valid={addressLine.trim().length >= 5}
            multiline
          />

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.fieldLabel}>{t('auth.city')}</Text>
              <IconField
                icon="business-outline"
                value={city}
                onChangeText={setCity}
                placeholder={t('auth.city')}
                focused={focusedField === 'city'}
                onFocus={() => setFocusedField('city')}
                onBlur={() => setFocusedField(null)}
                colors={colors}
                valid={city.trim().length >= 2}
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.fieldLabel}>{t('auth.state')}</Text>
              <IconField
                icon="map-outline"
                value={state}
                onChangeText={setState}
                placeholder={t('auth.state')}
                focused={focusedField === 'state'}
                onFocus={() => setFocusedField('state')}
                onBlur={() => setFocusedField(null)}
                colors={colors}
                valid={state.trim().length >= 2}
              />
            </View>
          </View>

          <Text style={styles.fieldLabel}>{t('auth.pincode')}</Text>
          <IconField
            icon="keypad-outline"
            value={pincode}
            onChangeText={(digits) => setPincode(digits.replace(/\D/g, '').slice(0, 6))}
            placeholder={t('auth.pincodePlaceholder')}
            focused={focusedField === 'pincode'}
            onFocus={() => setFocusedField('pincode')}
            onBlur={() => setFocusedField(null)}
            colors={colors}
            valid={/^\d{6}$/.test(pincode)}
            keyboardType="number-pad"
            maxLength={6}
          />
          {pincode.length > 0 && !/^\d{6}$/.test(pincode) ? (
            <Text style={styles.errorText}>{t('auth.pincodeError')}</Text>
          ) : null}

          <Text style={styles.fieldLabel}>{t('auth.landmarkOptional')}</Text>
          <IconField
            icon="flag-outline"
            value={landmark}
            onChangeText={setLandmark}
            placeholder={t('auth.landmarkPlaceholder')}
            focused={focusedField === 'landmark'}
            onFocus={() => setFocusedField('landmark')}
            onBlur={() => setFocusedField(null)}
            colors={colors}
          />
        </Animated.View>
      ) : null}

      <View style={styles.phoneNote}>
        <Ionicons name="lock-closed-outline" size={13} color={colors.textMuted} />
        <Text style={styles.phoneNoteText}>
          {t('auth.registerWith', {
            phone: phoneNumber.replace(/(\d{5})(\d{5})/, '$1 $2'),
          })}
        </Text>
      </View>
    </AuthScreenLayout>
  );
};

export default RegistrationScreen;
