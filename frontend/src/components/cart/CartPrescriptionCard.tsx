import React, { useCallback, useEffect, useState } from 'react';
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
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { pickImageFromSource } from '@/utils/imagePicker';
import { savePrescription, fetchPrescriptions } from '@/services/prescriptionService';
import type { SavedPrescription } from '@/types/prescription';
import ImagePreviewModal from '@/components/doctor/ImagePreviewModal';
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
  const insets = useSafeAreaInsets();

  const [modalVisible, setModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savedModalVisible, setSavedModalVisible] = useState(false);
  const [savedList, setSavedList] = useState<SavedPrescription[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);

  // Trigger modal when parent checkout button signals Rx required
  useEffect(() => {
    if (openPickerSignal && openPickerSignal > 0 && !attachedPrescription) {
      setModalVisible(true);
    }
  }, [openPickerSignal, attachedPrescription]);

  const handlePickSource = useCallback(
    async (source: 'camera' | 'gallery') => {
      setModalVisible(false);
      setSavedModalVisible(false);

      // Brief delay to allow modal dismiss animation to complete smoothly on mobile
      await new Promise((resolve) => setTimeout(resolve, 250));

      try {
        const picked = await pickImageFromSource(
          source,
          t(
            'prescriptions.permissionRequired',
            'Camera and gallery permissions are needed to attach your prescription.',
          ),
        );
        if (!picked?.uri) return;

        setUploading(true);
        const saved = await savePrescription(picked.uri);
        onAttach(saved);
      } catch (err: any) {
        Alert.alert(
          t('common.error', 'Error'),
          err?.message ||
            t('prescriptions.uploadFailed', 'Failed to upload prescription. Please try again.'),
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

  const handleRemovePrescription = useCallback(() => {
    Alert.alert(
      t('cart.removeRxTitle', 'Remove Prescription?'),
      t(
        'cart.removeRxBody',
        'Are you sure you want to remove this attached prescription? You will need to upload a valid prescription before placing this order.',
      ),
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('common.remove', 'Remove'),
          style: 'destructive',
          onPress: () => onAttach(null),
        },
      ],
    );
  }, [onAttach, t]);

  if (!hasRxItems) {
    return null;
  }

  const bottomInset = Math.max(insets.bottom, 16);

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
              name={attachedPrescription ? 'checkmark-circle' : 'medical'}
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
              <View
                style={[
                  styles.rxTag,
                  attachedPrescription ? styles.rxTagSuccess : styles.rxTagWarning,
                ]}
              >
                <Text style={styles.rxTagText}>
                  {attachedPrescription ? 'Rx Verified' : 'Rx Required'}
                </Text>
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

        {/* Requirements Chips (when pending) */}
        {!attachedPrescription && !uploading && (
          <View style={styles.checklistRow}>
            <View style={styles.checkChip}>
              <Ionicons name="checkmark-sharp" size={13} color="#991B1B" />
              <Text style={styles.checkChipText}>Doctor seal & sign</Text>
            </View>
            <View style={styles.checkChip}>
              <Ionicons name="checkmark-sharp" size={13} color="#991B1B" />
              <Text style={styles.checkChipText}>Patient details visible</Text>
            </View>
          </View>
        )}

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
            <Pressable
              onPress={() => setPreviewVisible(true)}
              style={({ pressed }) => [styles.thumbTouch, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="View full prescription"
            >
              <Image
                source={{ uri: attachedPrescription.imageUrl }}
                style={styles.thumbnail}
                resizeMode="cover"
              />
              <View style={styles.thumbZoomOverlay}>
                <Ionicons name="scan-outline" size={14} color="#FFFFFF" />
              </View>
            </Pressable>

            <View style={styles.attachedInfo}>
              <View style={styles.attachedHeaderLine}>
                <Text style={styles.attachedFileName} numberOfLines={1}>
                  {t('cart.prescriptionSlip', 'Prescription Slip')}
                </Text>
                <View style={styles.statusAttachedPill}>
                  <Text style={styles.statusAttachedPillText}>Ready</Text>
                </View>
              </View>
              <Text style={styles.attachedDate}>
                {new Date(attachedPrescription.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
              <Text style={styles.tapToViewText}>Tap image to preview</Text>
            </View>

            <View style={styles.attachedActionsCol}>
              <Pressable
                onPress={() => setModalVisible(true)}
                style={({ pressed }) => [styles.actionButton, styles.changeBtn, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Change prescription"
              >
                <Ionicons name="swap-horizontal" size={14} color="#1E293B" />
                <Text style={styles.changeBtnText}>{t('common.change', 'Change')}</Text>
              </Pressable>

              <Pressable
                onPress={handleRemovePrescription}
                style={({ pressed }) => [styles.actionButton, styles.removeBtn, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Remove prescription"
              >
                <Ionicons name="trash-outline" size={14} color="#DC2626" />
              </Pressable>
            </View>
          </View>
        ) : (
          /* Action CTA to attach */
          <View style={styles.ctaRow}>
            <Pressable
              onPress={() => setModalVisible(true)}
              style={({ pressed }) => [styles.uploadBtn, pressed && styles.uploadBtnPressed]}
              accessibilityRole="button"
              accessibilityLabel={t('cart.attachPrescriptionCta', 'Upload Prescription')}
            >
              <Ionicons name="cloud-upload-outline" size={19} color="#FFFFFF" />
              <Text style={styles.uploadBtnText}>
                {t('cart.attachPrescriptionCta', 'Upload Prescription')}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#FFFFFF" style={{ marginLeft: 2 }} />
            </Pressable>
          </View>
        )}
      </View>

      {/* 3-Options Upload Choice Modal (Bottom Sheet Style) */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable
            style={[styles.sheetCard, { paddingBottom: bottomInset }]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Sheet Handle */}
            <View style={styles.sheetHandle} />

            {/* Header */}
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderTitleRow}>
                <View style={styles.sheetHeaderIconWrap}>
                  <Ionicons name="document-text" size={20} color="#DC2626" />
                </View>
                <View>
                  <Text style={styles.sheetTitle}>
                    {t('cart.selectRxSource', 'Upload Prescription')}
                  </Text>
                  <Text style={styles.sheetSubtitle}>
                    {t(
                      'cart.selectRxSourceHint',
                      'Ensure doctor name, registration number & medicines are visible.',
                    )}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => setModalVisible(false)}
                style={styles.closeIconBtn}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            {/* 3 Interactive Choice Buttons */}
            <View style={styles.modalOptions}>
              {/* Option 1: Camera */}
              <Pressable
                onPress={() => void handlePickSource('camera')}
                style={({ pressed }) => [styles.optionCard, pressed && styles.optionCardPressed]}
                accessibilityRole="button"
              >
                <View style={[styles.optionIconBadge, { backgroundColor: '#FEE2E2' }]}>
                  <Ionicons name="camera" size={22} color="#DC2626" />
                </View>
                <View style={styles.optionContent}>
                  <View style={styles.optionHeadingRow}>
                    <Text style={styles.optionTitle}>{t('scan.camera', 'Take Photo')}</Text>
                    <View style={styles.instantBadge}>
                      <Text style={styles.instantBadgeText}>Instant</Text>
                    </View>
                  </View>
                  <Text style={styles.optionDesc}>
                    {t('cart.takePhotoDesc', 'Click a photo of your paper prescription slip')}
                  </Text>
                </View>
                <View style={styles.chevronWrap}>
                  <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                </View>
              </Pressable>

              {/* Option 2: Gallery */}
              <Pressable
                onPress={() => void handlePickSource('gallery')}
                style={({ pressed }) => [styles.optionCard, pressed && styles.optionCardPressed]}
                accessibilityRole="button"
              >
                <View style={[styles.optionIconBadge, { backgroundColor: '#EEF2FF' }]}>
                  <Ionicons name="images" size={22} color="#4F46E5" />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>{t('scan.gallery', 'Choose from Gallery')}</Text>
                  <Text style={styles.optionDesc}>
                    {t('cart.galleryDesc', 'Upload saved photo or image from your device')}
                  </Text>
                </View>
                <View style={styles.chevronWrap}>
                  <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                </View>
              </Pressable>

              {/* Option 3: Saved Prescriptions */}
              <Pressable
                onPress={() => void handleOpenSaved()}
                style={({ pressed }) => [styles.optionCard, pressed && styles.optionCardPressed]}
                accessibilityRole="button"
              >
                <View style={[styles.optionIconBadge, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="folder-open" size={22} color="#059669" />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>
                    {t('cart.savedPrescriptions', 'Saved Prescriptions')}
                  </Text>
                  <Text style={styles.optionDesc}>
                    {t('cart.savedPrescriptionsDesc', 'Select from previously uploaded prescriptions')}
                  </Text>
                </View>
                <View style={styles.chevronWrap}>
                  <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                </View>
              </Pressable>
            </View>

            {/* Trust and Compliance Banner */}
            <View style={styles.securityBanner}>
              <Ionicons name="shield-checkmark" size={16} color="#059669" />
              <Text style={styles.securityBannerText}>
                Your health data is safe & private. Verified only by registered pharmacists.
              </Text>
            </View>

            {/* Cancel Button */}
            <Pressable
              onPress={() => setModalVisible(false)}
              style={({ pressed }) => [styles.cancelSheetBtn, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <Text style={styles.cancelSheetBtnText}>{t('common.cancel', 'Cancel')}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Saved Prescriptions Modal (Bottom Sheet Style) */}
      <Modal
        visible={savedModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSavedModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSavedModalVisible(false)}>
          <Pressable
            style={[styles.savedSheetCard, { paddingBottom: bottomInset }]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Sheet Handle */}
            <View style={styles.sheetHandle} />

            {/* Header with Back button */}
            <View style={styles.savedSheetHeader}>
              <Pressable
                onPress={() => {
                  setSavedModalVisible(false);
                  setModalVisible(true);
                }}
                style={styles.backButton}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Back"
              >
                <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
              </Pressable>

              <Text style={styles.savedSheetTitle}>
                {t('cart.chooseSavedRx', 'Saved Prescriptions')}
              </Text>

              <Pressable
                onPress={() => setSavedModalVisible(false)}
                style={styles.closeIconBtn}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            {loadingSaved ? (
              <View style={styles.savedLoading}>
                <ActivityIndicator size="large" color="#DC2626" />
                <Text style={styles.savedLoadingText}>Loading your prescriptions…</Text>
              </View>
            ) : savedList.length === 0 ? (
              <View style={styles.savedEmpty}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="document-text-outline" size={38} color="#94A3B8" />
                </View>
                <Text style={styles.savedEmptyTitle}>
                  {t('cart.noSavedRx', 'No saved prescriptions found')}
                </Text>
                <Text style={styles.savedEmptyDesc}>
                  You do not have any saved prescriptions in your account yet. Choose an option to add one:
                </Text>

                <View style={styles.emptyActionsRow}>
                  <Pressable
                    onPress={() => void handlePickSource('camera')}
                    style={styles.emptyActionBtn}
                  >
                    <Ionicons name="camera" size={16} color="#DC2626" />
                    <Text style={styles.emptyActionBtnText}>Take Photo</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => void handlePickSource('gallery')}
                    style={[styles.emptyActionBtn, styles.emptyActionBtnSecondary]}
                  >
                    <Ionicons name="images" size={16} color="#4F46E5" />
                    <Text style={[styles.emptyActionBtnText, { color: '#4F46E5' }]}>
                      From Gallery
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <ScrollView style={styles.savedScroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.savedListHelper}>
                  Tap any prescription below to attach it to this cart:
                </Text>
                {savedList.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => handleSelectSaved(item)}
                    style={({ pressed }) => [styles.savedItemRow, pressed && styles.optionCardPressed]}
                    accessibilityRole="button"
                  >
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={styles.savedThumb}
                      resizeMode="cover"
                    />
                    <View style={styles.savedItemInfo}>
                      <Text style={styles.savedItemTitle}>Prescription Slip</Text>
                      <Text style={styles.savedItemDate}>
                        {new Date(item.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Text>
                      <Text style={styles.savedItemHint}>
                        {t('cart.tapToAttach', 'Tap to attach to order')}
                      </Text>
                    </View>
                    <View style={styles.selectRxBtn}>
                      <Text style={styles.selectRxBtnText}>Select</Text>
                      <Ionicons name="checkmark-circle" size={16} color="#059669" />
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Full Size Image Preview Modal */}
      <ImagePreviewModal
        uri={attachedPrescription?.imageUrl ?? null}
        visible={previewVisible}
        onClose={() => setPreviewVisible(false)}
        closeLabel={t('common.close', 'Close')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  card: {
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1.5,
    ...shadows.sm,
  },
  cardWarning: {
    backgroundColor: '#FFF8F8',
    borderColor: '#FECACA',
  },
  cardSuccess: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm + 2,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
    gap: spacing.xs + 2,
    flexWrap: 'wrap',
  },
  title: {
    ...typography.bodySmall,
    fontWeight: '800',
    fontSize: moderateScale(14, 0.35),
  },
  rxTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rxTagWarning: {
    backgroundColor: '#DC2626',
  },
  rxTagSuccess: {
    backgroundColor: '#059669',
  },
  rxTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 17,
  },
  checklistRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
  },
  checkChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  checkChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#991B1B',
  },
  ctaRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DC2626',
    paddingHorizontal: spacing.md + 4,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  uploadBtnPressed: {
    backgroundColor: '#B91C1C',
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  uploadBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: moderateScale(13.5, 0.35),
    letterSpacing: 0.1,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    backgroundColor: '#FEF2F2',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
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
    padding: spacing.sm + 2,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    ...shadows.sm,
  },
  thumbTouch: {
    position: 'relative',
  },
  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  thumbZoomOverlay: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 4,
    padding: 2,
  },
  attachedInfo: {
    flex: 1,
  },
  attachedHeaderLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  attachedFileName: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statusAttachedPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  statusAttachedPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  attachedDate: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  tapToViewText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
    marginTop: 2,
  },
  attachedActionsCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  changeBtn: {
    backgroundColor: '#F1F5F9',
    flexDirection: 'row',
    gap: 4,
  },
  changeBtnText: {
    ...typography.caption,
    fontWeight: '700',
    color: '#1E293B',
  },
  removeBtn: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 9,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    ...shadows.lg,
  },
  savedSheetCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    maxHeight: '85%',
    ...shadows.lg,
  },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginTop: 6,
    marginBottom: spacing.sm,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
  },
  sheetHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    flex: 1,
  },
  sheetHeaderIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  sheetTitle: {
    ...typography.h3,
    fontSize: moderateScale(17, 0.35),
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sheetSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
    paddingRight: spacing.sm,
  },
  closeIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOptions: {
    gap: spacing.sm + 2,
    marginVertical: spacing.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    gap: spacing.md,
    ...shadows.sm,
  },
  optionCardPressed: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    transform: [{ scale: 0.99 }],
  },
  optionIconBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionContent: {
    flex: 1,
  },
  optionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  optionTitle: {
    ...typography.bodySmall,
    fontWeight: '800',
    fontSize: moderateScale(14.5, 0.35),
    color: colors.textPrimary,
  },
  instantBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  instantBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#DC2626',
    textTransform: 'uppercase',
  },
  optionDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 3,
    lineHeight: 16,
  },
  chevronWrap: {
    paddingLeft: spacing.xs,
  },
  securityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
    gap: 8,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  securityBannerText: {
    ...typography.caption,
    color: '#065F46',
    fontWeight: '600',
    flex: 1,
    lineHeight: 16,
  },
  cancelSheetBtn: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: spacing.sm + 4,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelSheetBtnText: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  savedSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedSheetTitle: {
    ...typography.h3,
    fontSize: moderateScale(16, 0.35),
    fontWeight: '800',
    color: colors.textPrimary,
  },
  savedLoading: {
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  savedLoadingText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  savedEmpty: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  savedEmptyTitle: {
    ...typography.bodySmall,
    fontWeight: '800',
    fontSize: 15,
    color: colors.textPrimary,
  },
  savedEmptyDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  emptyActionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  emptyActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
  },
  emptyActionBtnSecondary: {
    backgroundColor: '#EEF2FF',
  },
  emptyActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  savedScroll: {
    marginTop: spacing.sm,
  },
  savedListHelper: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  savedItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm + 2,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: spacing.sm,
    backgroundColor: '#FFFFFF',
    gap: spacing.sm + 2,
  },
  savedThumb: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  savedItemInfo: {
    flex: 1,
  },
  savedItemTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  savedItemDate: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  savedItemHint: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
    marginTop: 2,
  },
  selectRxBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  selectRxBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  pressed: {
    opacity: 0.8,
  },
});

export default CartPrescriptionCard;
