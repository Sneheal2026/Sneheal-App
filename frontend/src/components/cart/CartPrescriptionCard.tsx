import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ActivityIndicator,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { pickImageFromSource } from '@/utils/imagePicker';
import { savePrescription, fetchPrescriptions } from '@/services/prescriptionService';
import type { SavedPrescription } from '@/types/prescription';
import theme from '@/styles/theme';

const { colors, spacing, typography, borderRadius, moderateScale, shadows } = theme;

interface CartPrescriptionCardProps {
  hasRxItems: boolean;
  attachedPrescription: SavedPrescription | null;
  onAttach: (prescription: SavedPrescription | null) => void;
  openPickerSignal?: number; // Allows parent screen to trigger the picker modal
}

export const CartPrescriptionCard = ({
  hasRxItems,
  attachedPrescription,
  onAttach,
  openPickerSignal,
}: CartPrescriptionCardProps) => {
  const { t } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savedModalVisible, setSavedModalVisible] = useState(false);
  const [savedList, setSavedList] = useState<SavedPrescription[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  // Trigger modal if parent signal changes
  React.useEffect(() => {
    if (openPickerSignal && openPickerSignal > 0 && !attachedPrescription) {
      setModalVisible(true);
    }
  }, [openPickerSignal, attachedPrescription]);

  const handlePickSource = useCallback(
    async (source: 'camera' | 'gallery') => {
      setModalVisible(false);
      try {
        const picked = await pickImageFromSource(
          source,
          t('prescriptions.permissionRequired', 'Camera and gallery permissions are needed to attach your prescription.'),
        );
        if (!picked?.uri) return;

        setUploading(true);
        const saved = await savePrescription(picked.uri);
        onAttach(saved);
      } catch (err: any) {
        Alert.alert(
          t('common.error', 'Error'),
          err?.message || t('prescriptions.uploadFailed', 'Failed to upload prescription. Please try again.'),
        );
      } finally {
        setUploading(false);
      }
    },
    [onAttach, t],
  );

  const handleOpenSaved = useCallback(async () => {
    setModalVisible(false);
    setSavedModalVisible(true);
    setLoadingSaved(true);
    try {
      const items = await fetchPrescriptions({ force: true });
      setSavedList(items || []);
    } catch {
      setSavedList([]);
    } finally {
      setLoadingSaved(false);
    }
  }, []);

  const handleSelectSaved = useCallback(
    (item: SavedPrescription) => {
      onAttach(item);
      setSavedModalVisible(false);
    },
    [onAttach],
  );

  if (!hasRxItems) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Rx Header Banner */}
      <View style={[styles.card, attachedPrescription ? styles.cardSuccess : styles.cardWarning]}>
        <View style={styles.topRow}>
          <View
            style={[
              styles.iconBadge,
              attachedPrescription ? styles.iconBadgeSuccess : styles.iconBadgeWarning,
            ]}
          >
            <Ionicons
              name={attachedPrescription ? 'checkmark-circle' : 'alert-circle'}
              size={22}
              color={attachedPrescription ? '#059669' : '#DC2626'}
            />
          </View>
          <View style={styles.textWrap}>
            <View style={styles.titleRow}>
              <Text
                style={[
                  styles.title,
                  { color: attachedPrescription ? '#065F46' : '#991B1B' },
                ]}
              >
                {attachedPrescription
                  ? t('cart.rxAttachedTitle', 'Doctor Prescription Attached')
                  : t('cart.rxRequiredTitle', 'Doctor Prescription Required')}
              </Text>
              <View style={styles.rxTag}>
                <Text style={styles.rxTagText}>Rx</Text>
              </View>
            </View>
            <Text style={styles.subtitle}>
              {attachedPrescription
                ? t(
                    'cart.rxAttachedSubtitle',
                    'A registered pharmacist will verify this prescription before dispensing.',
                  )
                : t(
                    'cart.rxRequiredSubtitle',
                    'Your cart contains prescription drugs. Please upload a valid doctor prescription to proceed.',
                  )}
            </Text>
          </View>
        </View>

        {uploading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#DC2626" />
            <Text style={styles.loadingText}>
              {t('cart.uploadingRx', 'Uploading and securing prescription…')}
            </Text>
          </View>
        ) : attachedPrescription ? (
          /* Attached State Preview */
          <View style={styles.attachedPreviewRow}>
            <Image
              source={{ uri: attachedPrescription.imageUrl }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
            <View style={styles.attachedInfo}>
              <Text style={styles.attachedFileName} numberOfLines={1}>
                {t('cart.prescriptionSlip', 'Prescription Slip')}
              </Text>
              <Text style={styles.attachedDate}>
                {new Date(attachedPrescription.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <Pressable
              onPress={() => setModalVisible(true)}
              style={({ pressed }) => [styles.changeBtn, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <Text style={styles.changeBtnText}>{t('common.change', 'Change')}</Text>
            </Pressable>
          </View>
        ) : (
          /* Action CTA to attach */
          <View style={styles.ctaRow}>
            <Pressable
              onPress={() => setModalVisible(true)}
              style={({ pressed }) => [styles.uploadBtn, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <Ionicons name="camera-outline" size={18} color="#FFFFFF" />
              <Text style={styles.uploadBtnText}>
                {t('cart.attachPrescriptionCta', 'Attach Prescription')}
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Upload Choice Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <Ionicons name="document-text-outline" size={20} color="#DC2626" />
                <Text style={styles.modalTitle}>
                  {t('cart.selectRxSource', 'Upload Prescription')}
                </Text>
              </View>
              <Pressable onPress={() => setModalVisible(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </Pressable>
            </View>

            <Text style={styles.modalSubtitle}>
              {t(
                'cart.selectRxSourceHint',
                'Ensure patient name, doctor details, and medicines are clearly visible.',
              )}
            </Text>

            <View style={styles.modalOptions}>
              <Pressable
                onPress={() => void handlePickSource('camera')}
                style={({ pressed }) => [styles.optionRow, pressed && styles.optionPressed]}
              >
                <View style={[styles.optionIcon, { backgroundColor: '#FEE2E2' }]}>
                  <Ionicons name="camera" size={20} color="#DC2626" />
                </View>
                <View style={styles.optionTextWrap}>
                  <Text style={styles.optionTitle}>{t('scan.camera', 'Take Photo')}</Text>
                  <Text style={styles.optionDesc}>
                    {t('cart.takePhotoDesc', 'Snap prescription using camera')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </Pressable>

              <Pressable
                onPress={() => void handlePickSource('gallery')}
                style={({ pressed }) => [styles.optionRow, pressed && styles.optionPressed]}
              >
                <View style={[styles.optionIcon, { backgroundColor: '#E0E7FF' }]}>
                  <Ionicons name="image" size={20} color="#4F46E5" />
                </View>
                <View style={styles.optionTextWrap}>
                  <Text style={styles.optionTitle}>{t('scan.gallery', 'Choose from Gallery')}</Text>
                  <Text style={styles.optionDesc}>
                    {t('cart.galleryDesc', 'Upload saved photo or PDF')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </Pressable>

              <Pressable
                onPress={() => void handleOpenSaved()}
                style={({ pressed }) => [styles.optionRow, pressed && styles.optionPressed]}
              >
                <View style={[styles.optionIcon, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="folder-open" size={20} color="#059669" />
                </View>
                <View style={styles.optionTextWrap}>
                  <Text style={styles.optionTitle}>
                    {t('cart.savedPrescriptions', 'Saved Prescriptions')}
                  </Text>
                  <Text style={styles.optionDesc}>
                    {t('cart.savedPrescriptionsDesc', 'Select from previously uploaded slips')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Saved Prescriptions Modal */}
      <Modal
        visible={savedModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSavedModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSavedModalVisible(false)}>
          <Pressable style={styles.savedModalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t('cart.chooseSavedRx', 'Choose Saved Prescription')}
              </Text>
              <Pressable onPress={() => setSavedModalVisible(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </Pressable>
            </View>

            {loadingSaved ? (
              <View style={styles.savedLoading}>
                <ActivityIndicator size="large" color="#111152" />
              </View>
            ) : savedList.length === 0 ? (
              <View style={styles.savedEmpty}>
                <Ionicons name="document-text-outline" size={40} color={colors.textMuted} />
                <Text style={styles.savedEmptyText}>
                  {t('cart.noSavedRx', 'No saved prescriptions found.')}
                </Text>
                <Pressable
                  onPress={() => {
                    setSavedModalVisible(false);
                    setModalVisible(true);
                  }}
                  style={styles.uploadNewBtn}
                >
                  <Text style={styles.uploadNewBtnText}>
                    {t('cart.uploadNewRx', 'Upload New Prescription')}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <ScrollView style={styles.savedScroll} showsVerticalScrollIndicator={false}>
                {savedList.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => handleSelectSaved(item)}
                    style={({ pressed }) => [styles.savedItemRow, pressed && styles.optionPressed]}
                  >
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={styles.savedThumb}
                      resizeMode="cover"
                    />
                    <View style={styles.savedItemInfo}>
                      <Text style={styles.savedItemDate}>
                        {new Date(item.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Text>
                      <Text style={styles.savedItemHint}>
                        {t('cart.tapToAttach', 'Tap to attach to this order')}
                      </Text>
                    </View>
                    <Ionicons name="checkmark-circle-outline" size={22} color="#059669" />
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    ...shadows.sm,
  },
  cardWarning: {
    backgroundColor: '#FEF2F2',
    borderColor: '#F87171',
  },
  cardSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#34D399',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadgeWarning: {
    backgroundColor: '#FEE2E2',
  },
  iconBadgeSuccess: {
    backgroundColor: '#D1FAE5',
  },
  textWrap: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    ...typography.bodySmall,
    fontWeight: '700',
    fontSize: moderateScale(14, 0.35),
  },
  rxTag: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  rxTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  ctaRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#DC2626',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  uploadBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: moderateScale(13, 0.35),
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingVertical: spacing.xs,
  },
  loadingText: {
    ...typography.caption,
    color: '#DC2626',
    fontWeight: '600',
  },
  attachedPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    backgroundColor: '#FFFFFF',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
  },
  attachedInfo: {
    flex: 1,
  },
  attachedFileName: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  attachedDate: {
    ...typography.caption,
    color: colors.textMuted,
  },
  changeBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: '#F3F4F6',
  },
  changeBtnText: {
    ...typography.caption,
    fontWeight: '700',
    color: '#111152',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.md,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.lg,
  },
  savedModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    maxHeight: '80%',
    ...shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  modalTitle: {
    ...typography.h3,
    fontSize: moderateScale(16, 0.35),
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  modalOptions: {
    gap: spacing.sm,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: '#F9FAFB',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  optionPressed: {
    backgroundColor: '#F3F4F6',
  },
  optionIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTextWrap: {
    flex: 1,
  },
  optionTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  optionDesc: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 1,
  },
  savedLoading: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  savedEmpty: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  savedEmptyText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  uploadNewBtn: {
    marginTop: spacing.sm,
    backgroundColor: '#111152',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  uploadNewBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: moderateScale(13, 0.35),
  },
  savedScroll: {
    marginTop: spacing.sm,
  },
  savedItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: spacing.sm,
  },
  savedThumb: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
  },
  savedItemInfo: {
    flex: 1,
  },
  savedItemDate: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  savedItemHint: {
    ...typography.caption,
    color: colors.textMuted,
  },
  pressed: {
    opacity: 0.8,
  },
});

export default CartPrescriptionCard;
