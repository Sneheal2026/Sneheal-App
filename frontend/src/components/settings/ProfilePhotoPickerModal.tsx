import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Image,
  ActivityIndicator,
  ScrollView,
  type ImageSourcePropType,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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

const { colors, spacing, typography, borderRadius } = theme;

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
}) => (
  <Modal
    visible={visible}
    transparent
    statusBarTranslucent
    navigationBarTranslucent
    animationType="fade"
    onRequestClose={onClose}
  >
    <SafeAreaProvider>
      <ProfilePhotoPickerSheet
        currentType={currentType}
        onClose={onClose}
        onSelected={onSelected}
      />
    </SafeAreaProvider>
  </Modal>
);

const ProfilePhotoPickerSheet: React.FC<Omit<ProfilePhotoPickerModalProps, 'visible'>> = ({
  currentType,
  onClose,
  onSelected,
}) => {
  const { t } = useTranslation();
  const { colors: themeColors } = useTheme();
  const insets = useSafeAreaInsets();
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
    <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={busy ? undefined : onClose}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />

        <View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.sm },
          ]}
        >
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>{t('settings.editPhotoTitle')}</Text>
              <Text style={styles.subtitle}>{t('settings.editPhotoSubtitle')}</Text>
            </View>
            <Pressable
              onPress={busy ? undefined : onClose}
              hitSlop={8}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
            >
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
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

            <View style={styles.actionCard}>
              <ActionRow
                icon="image-outline"
                label={t('settings.photoFromGallery')}
                onPress={() => handlePickCustom('gallery')}
                disabled={busy}
              />
              <View style={styles.divider} />
              <ActionRow
                icon="camera-outline"
                label={t('settings.photoTakePhoto')}
                onPress={() => handlePickCustom('camera')}
                disabled={busy}
              />
              {currentType !== 'default' ? (
                <>
                  <View style={styles.divider} />
                  <ActionRow
                    icon="trash-outline"
                    label={t('settings.photoRemove')}
                    destructive
                    onPress={handleDefault}
                    disabled={busy}
                  />
                </>
              ) : null}
            </View>
          </ScrollView>

          <Pressable
            onPress={busy ? undefined : onClose}
            style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={t('common.cancel')}
          >
            <Text style={styles.cancelText}>{t('common.cancel')}</Text>
          </Pressable>

          {busy ? (
            <View style={styles.busyOverlay} pointerEvents="auto">
              <ActivityIndicator size="large" color={themeColors.primary} />
            </View>
          ) : null}
        </View>
      </View>
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
          <Ionicons name="checkmark" size={12} color={colors.white} />
        </View>
      ) : null}
    </View>
    <Text style={styles.presetLabel}>{label}</Text>
  </Pressable>
);

interface ActionRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  destructive?: boolean;
  disabled: boolean;
  onPress: () => void;
}

const ActionRow: React.FC<ActionRowProps> = ({
  icon,
  label,
  destructive = false,
  disabled,
  onPress,
}) => (
  <Pressable
    onPress={disabled ? undefined : onPress}
    android_ripple={{ color: colors.borderLight }}
    style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}
    accessibilityRole="button"
    accessibilityLabel={label}
  >
    <View style={[styles.actionIcon, destructive && styles.actionIconDestructive]}>
      <Ionicons
        name={icon}
        size={18}
        color={destructive ? colors.error : colors.textPrimary}
      />
    </View>
    <Text style={[styles.actionLabel, destructive && styles.actionLabelDestructive]}>
      {label}
    </Text>
    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
  </Pressable>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    maxHeight: '92%',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  headerCopy: {
    flex: 1,
  },
  title: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xxxxl,
    marginBottom: spacing.lg,
  },
  presetItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  presetImageRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: colors.border,
    padding: 2,
    backgroundColor: colors.surfaceSecondary,
  },
  presetImage: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
  },
  presetCheck: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  presetLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  actionCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconDestructive: {
    backgroundColor: colors.errorLight,
  },
  actionLabel: {
    ...typography.bodySmall,
    flex: 1,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  actionLabelDestructive: {
    color: colors.error,
    fontWeight: '600',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: spacing.md + 32 + spacing.md,
  },
  cancelBtn: {
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    ...typography.button,
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  pressed: {
    opacity: 0.7,
  },
  busyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
});

export default ProfilePhotoPickerModal;
