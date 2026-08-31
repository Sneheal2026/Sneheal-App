import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Image,
  ActivityIndicator,
  type ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import theme from '@/styles/theme';
import { useTheme } from '@/hooks/useTheme';
import { pickImageFromSource } from '@/utils/imagePicker';
import {
  saveCustomProfilePhoto,
  saveProfilePhotoPreset,
  type ProfilePhotoSelection,
} from '@/services/profilePhotoStorage';
import { PRESET_PROFILE_SOURCES } from '@/hooks/useProfilePhoto';
import { devLog } from '@/utils/devLogger';

const { colors, spacing, typography, borderRadius, shadows } = theme;

interface ProfilePhotoPickerModalProps {
  visible: boolean;
  currentType: ProfilePhotoSelection['type'];
  onClose: () => void;
  onSelected: (selection: ProfilePhotoSelection) => void;
}

const ProfilePhotoPickerModal: React.FC<ProfilePhotoPickerModalProps> = ({
  visible,
  currentType,
  onClose,
  onSelected,
}) => {
  const { t } = useTranslation();
  const { colors: themeColors } = useTheme();
  const [busy, setBusy] = useState(false);

  const handlePreset = async (type: 'male' | 'female') => {
    if (busy) return;
    setBusy(true);
    try {
      const selection = await saveProfilePhotoPreset(type);
      onSelected(selection);
      onClose();
    } catch (error) {
      devLog('ProfilePhoto', 'Failed to save preset photo', error);
    } finally {
      setBusy(false);
    }
  };

  const handleDefault = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const selection = await saveProfilePhotoPreset('default');
      onSelected(selection);
      onClose();
    } catch (error) {
      devLog('ProfilePhoto', 'Failed to reset photo', error);
    } finally {
      setBusy(false);
    }
  };

  const handlePickCustom = async (source: 'camera' | 'gallery') => {
    if (busy) return;
    setBusy(true);
    try {
      const picked = await pickImageFromSource(
        source,
        t('settings.photoPermissionMessage'),
        { allowsEditing: true, aspect: [1, 1], quality: 0.85 },
      );

      if (picked?.uri) {
        const selection = await saveCustomProfilePhoto(picked.uri);
        onSelected(selection);
        onClose();
      }
    } catch (error) {
      devLog('ProfilePhoto', 'Failed to pick custom photo', error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={busy ? undefined : onClose}
    >
      <Animated.View
        entering={FadeIn.duration(180)}
        exiting={FadeOut.duration(150)}
        style={styles.backdrop}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={busy ? undefined : onClose}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />

        <Animated.View
          entering={SlideInDown.springify().damping(20).mass(0.8)}
          exiting={SlideOutDown.duration(200)}
          style={styles.sheet}
        >
          <SafeAreaView edges={['bottom']}>
            <View style={styles.handle} />

            <View style={styles.header}>
              <Text style={styles.title}>{t('settings.editPhotoTitle')}</Text>
              <Text style={styles.subtitle}>{t('settings.editPhotoSubtitle')}</Text>
            </View>

            <View style={styles.presetRow}>
              <PresetOption
                label={t('settings.photoMale')}
                image={PRESET_PROFILE_SOURCES.male}
                selected={currentType === 'male'}
                accent={themeColors.primary}
                onPress={() => handlePreset('male')}
                disabled={busy}
              />
              <PresetOption
                label={t('settings.photoFemale')}
                image={PRESET_PROFILE_SOURCES.female}
                selected={currentType === 'female'}
                accent={themeColors.primary}
                onPress={() => handlePreset('female')}
                disabled={busy}
              />
            </View>

            <View style={styles.actions}>
              <ActionRow
                icon="image-outline"
                label={t('settings.photoFromGallery')}
                accent={themeColors.primary}
                onPress={() => handlePickCustom('gallery')}
                disabled={busy}
              />
              <ActionRow
                icon="camera-outline"
                label={t('settings.photoTakePhoto')}
                accent={themeColors.primary}
                onPress={() => handlePickCustom('camera')}
                disabled={busy}
              />
              {currentType !== 'default' ? (
                <ActionRow
                  icon="trash-outline"
                  label={t('settings.photoRemove')}
                  accent={colors.error}
                  destructive
                  onPress={handleDefault}
                  disabled={busy}
                />
              ) : null}
            </View>

            <Pressable
              onPress={busy ? undefined : onClose}
              style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={t('common.cancel')}
            >
              <Text style={styles.cancelText}>{t('common.cancel')}</Text>
            </Pressable>
          </SafeAreaView>

          {busy ? (
            <View style={styles.busyOverlay} pointerEvents="auto">
              <ActivityIndicator size="large" color={themeColors.primary} />
            </View>
          ) : null}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

interface PresetOptionProps {
  label: string;
  image: ImageSourcePropType;
  selected: boolean;
  accent: string;
  disabled: boolean;
  onPress: () => void;
}

const PresetOption: React.FC<PresetOptionProps> = ({
  label,
  image,
  selected,
  accent,
  disabled,
  onPress,
}) => (
  <Pressable
    onPress={disabled ? undefined : onPress}
    style={({ pressed }) => [styles.presetItem, pressed && styles.pressed]}
    accessibilityRole="button"
    accessibilityLabel={label}
    accessibilityState={{ selected }}
  >
    <View style={[styles.presetImageRing, selected && { borderColor: accent }]}>
      <Image source={image} style={styles.presetImage} resizeMode="cover" />
      {selected ? (
        <View style={[styles.presetCheck, { backgroundColor: accent }]}>
          <Ionicons name="checkmark" size={14} color={colors.white} />
        </View>
      ) : null}
    </View>
    <Text style={styles.presetLabel}>{label}</Text>
  </Pressable>
);

interface ActionRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  accent: string;
  destructive?: boolean;
  disabled: boolean;
  onPress: () => void;
}

const ActionRow: React.FC<ActionRowProps> = ({
  icon,
  label,
  accent,
  destructive = false,
  disabled,
  onPress,
}) => (
  <Pressable
    onPress={disabled ? undefined : onPress}
    style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}
    accessibilityRole="button"
    accessibilityLabel={label}
  >
    <View
      style={[
        styles.actionIcon,
        { backgroundColor: destructive ? colors.errorLight : `${accent}1A` },
      ]}
    >
      <Ionicons name={icon} size={20} color={accent} />
    </View>
    <Text style={[styles.actionLabel, destructive && { color: colors.error }]}>{label}</Text>
    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
  </Pressable>
);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    ...shadows.lg,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginBottom: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h3,
    fontSize: 20,
    color: colors.textPrimary,
    marginBottom: spacing.xxs,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  presetRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xxl,
    marginBottom: spacing.lg,
  },
  presetItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  presetImageRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
    borderColor: colors.border,
    padding: 3,
    backgroundColor: colors.surfaceSecondary,
  },
  presetImage: {
    width: '100%',
    height: '100%',
    borderRadius: 42,
  },
  presetCheck: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  presetLabel: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  actions: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    ...typography.body,
    flex: 1,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  cancelBtn: {
    height: 52,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelText: {
    ...typography.button,
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  pressed: {
    opacity: 0.7,
  },
  busyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
  },
});

export default ProfilePhotoPickerModal;
