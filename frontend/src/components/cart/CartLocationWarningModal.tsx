import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SUPPORT_CONTACT } from '@/constants/helpFaq';
import theme from '@/styles/theme';

const { spacing, typography, borderRadius, shadows } = theme;

interface CartLocationWarningModalProps {
  visible: boolean;
  onClose: () => void;
  onChangeAddress: () => void;
  selectedAddressText?: string;
}

export const CartLocationWarningModal: React.FC<CartLocationWarningModalProps> = ({
  visible,
  onClose,
  onChangeAddress,
  selectedAddressText,
}) => {
  const handleCallSupport = () => {
    const dial = SUPPORT_CONTACT.phone.replace(/\s/g, '');
    void Linking.openURL(`tel:${dial}`).catch(() => {});
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.modalCard}>
          {/* Header Pill & Close */}
          <View style={styles.headerRow}>
            <View style={styles.warningPill}>
              <Ionicons name="warning" size={14} color="#D97706" />
              <Text style={styles.warningPillText}>Delivery Zone Notice</Text>
            </View>

            <Pressable
              onPress={onClose}
              hitSlop={10}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={20} color="#64748B" />
            </Pressable>
          </View>

          {/* Warning Icon Badge */}
          <View style={styles.iconCircle}>
            <Ionicons name="location-outline" size={38} color="#D97706" />
          </View>

          {/* Title */}
          <Text style={styles.title}>Delivery Not Available Here</Text>

          {/* Address Preview Box */}
          {selectedAddressText ? (
            <View style={styles.addressBox}>
              <Ionicons name="pin" size={15} color="#D97706" style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.addressBoxLabel}>Selected Address:</Text>
                <Text style={styles.addressBoxText} numberOfLines={2}>
                  {selectedAddressText}
                </Text>
              </View>
            </View>
          ) : null}

          {/* Friendly Description */}
          <Text style={styles.subtitle}>
            We noticed this address is outside our delivery area. Sneheal is currently fulfilling orders exclusively in{' '}
            <Text style={styles.boldText}>Solapur</Text>,{' '}
            <Text style={styles.boldText}>Akkalkot</Text>, and nearby regions.
          </Text>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Pressable
              onPress={() => {
                onClose();
                onChangeAddress();
              }}
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
            >
              <Ionicons name="map" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.primaryBtnText}>Change Delivery Address</Text>
            </Pressable>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
            >
              <Text style={styles.secondaryBtnText}>Review Cart Items</Text>
            </Pressable>
          </View>

          {/* Help Contact */}
          <View style={styles.footer}>
            <Pressable
              onPress={handleCallSupport}
              style={({ pressed }) => [styles.callRow, pressed && styles.pressed]}
            >
              <Ionicons name="call-outline" size={14} color="#0F766E" />
              <Text style={styles.callText}>
                Need Help? Call Sneheal Support: {SUPPORT_CONTACT.phone}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    width: '100%',
    maxWidth: 390,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.lg,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  warningPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  warningPillText: {
    ...typography.caption,
    color: '#B45309',
    fontWeight: '700',
    fontSize: 11,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFBEB',
    borderWidth: 2,
    borderColor: '#FDE68A',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  title: {
    ...typography.h3,
    color: '#0F172A',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  addressBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  addressBoxLabel: {
    ...typography.caption,
    color: '#B45309',
    fontWeight: '700',
    fontSize: 11,
    marginBottom: 2,
  },
  addressBoxText: {
    ...typography.caption,
    color: '#475569',
    lineHeight: 16,
    fontWeight: '500',
  },
  subtitle: {
    ...typography.bodySmall,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  boldText: {
    color: '#0F172A',
    fontWeight: '700',
  },
  actions: {
    width: '100%',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  primaryBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 13,
    borderRadius: borderRadius.lg,
    backgroundColor: '#D97706',
    ...shadows.sm,
  },
  primaryBtnText: {
    ...typography.button,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  secondaryBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: borderRadius.lg,
    backgroundColor: '#F1F5F9',
  },
  secondaryBtnText: {
    ...typography.bodySmall,
    color: '#475569',
    fontWeight: '600',
  },
  footer: {
    width: '100%',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
    paddingTop: spacing.md,
    alignItems: 'center',
  },
  callRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  callText: {
    ...typography.caption,
    color: '#0F766E',
    fontWeight: '600',
    fontSize: 11,
  },
});

export default CartLocationWarningModal;
