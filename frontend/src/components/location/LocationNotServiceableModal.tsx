import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SUPPORT_CONTACT } from '@/constants/helpFaq';
import theme from '@/styles/theme';

const { colors, spacing, typography, borderRadius, shadows } = theme;

interface LocationNotServiceableModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectSolapurAddress: () => void;
  currentAddressName?: string;
}

export const LocationNotServiceableModal: React.FC<LocationNotServiceableModalProps> = ({
  visible,
  onClose,
  onSelectSolapurAddress,
  currentAddressName,
}) => {
  const handleCallSupport = () => {
    const dial = SUPPORT_CONTACT.phone.replace(/\s/g, '');
    void Linking.openURL(`tel:${dial}`).catch(() => {});
  };

  const handleWhatsApp = () => {
    const cleanPhone = SUPPORT_CONTACT.phone.replace(/\D/g, '');
    const msg = encodeURIComponent(
      'Hello Sneheal Team, I wanted to know when Sneheal delivery will be available in my city.',
    );
    void Linking.openURL(`https://wa.me/${cleanPhone}?text=${msg}`).catch(() => {});
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
          {/* Top handle & close */}
          <View style={styles.topRow}>
            <View style={styles.brandBadge}>
              <Ionicons name="location" size={14} color="#CA2164" />
              <Text style={styles.brandBadgeText}>Delivery Coverage</Text>
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

          {/* Icon Badge */}
          <View style={styles.iconContainer}>
            <View style={styles.iconRing}>
              <Ionicons name="navigate-circle-outline" size={44} color="#CA2164" />
            </View>
          </View>

          {/* Heading */}
          <Text style={styles.title}>Not in Your Area Yet</Text>

          {currentAddressName ? (
            <View style={styles.detectedPill}>
              <Ionicons name="pin-outline" size={13} color="#64748B" />
              <Text style={styles.detectedPillText} numberOfLines={1}>
                {currentAddressName}
              </Text>
            </View>
          ) : null}

          {/* Description */}
          <Text style={styles.subtitle}>
            Sneheal is currently live and delivering medicines exclusively in{' '}
            <Text style={styles.boldText}>Solapur</Text>,{' '}
            <Text style={styles.boldText}>Akkalkot</Text>, and nearest regions.
          </Text>

          {/* Coverage highlights */}
          <View style={styles.coverageBox}>
            <View style={styles.coverageRow}>
              <Ionicons name="checkmark-circle" size={16} color="#059669" />
              <Text style={styles.coverageText}>Solapur City & District</Text>
            </View>
            <View style={styles.coverageRow}>
              <Ionicons name="checkmark-circle" size={16} color="#059669" />
              <Text style={styles.coverageText}>Akkalkot & Surrounding Rural Hubs</Text>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.actionGroup}>
            <Pressable
              onPress={onSelectSolapurAddress}
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
            >
              <Ionicons name="map-outline" size={17} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.primaryBtnText}>Deliver to Solapur / Akkalkot</Text>
            </Pressable>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
            >
              <Text style={styles.secondaryBtnText}>Explore Medicines (View Catalog)</Text>
            </Pressable>
          </View>

          {/* Helpline Footer */}
          <View style={styles.helpFooter}>
            <Text style={styles.helpLabel}>Have questions? Reach out to Sneheal Support</Text>
            <View style={styles.helpButtonsRow}>
              <Pressable
                onPress={handleCallSupport}
                style={({ pressed }) => [styles.helpMiniBtn, pressed && styles.pressed]}
              >
                <Ionicons name="call" size={13} color="#0F766E" />
                <Text style={styles.helpMiniBtnText}>Call Helpline</Text>
              </Pressable>

              <Pressable
                onPress={handleWhatsApp}
                style={({ pressed }) => [styles.helpMiniBtn, styles.whatsAppBtn, pressed && styles.pressed]}
              >
                <Ionicons name="logo-whatsapp" size={14} color="#15803D" />
                <Text style={styles.whatsAppText}>WhatsApp</Text>
              </Pressable>
            </View>
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
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.lg,
  },
  topRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FCE8F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  brandBadgeText: {
    ...typography.caption,
    color: '#CA2164',
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
  iconContainer: {
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  iconRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FCE8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...typography.h3,
    color: '#0F172A',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  detectedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    maxWidth: '90%',
    marginBottom: spacing.sm,
  },
  detectedPillText: {
    ...typography.caption,
    color: '#475569',
    fontWeight: '500',
  },
  subtitle: {
    ...typography.bodySmall,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  boldText: {
    color: '#0F172A',
    fontWeight: '700',
  },
  coverageBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: 6,
    marginBottom: spacing.lg,
  },
  coverageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  coverageText: {
    ...typography.caption,
    color: '#334155',
    fontWeight: '600',
  },
  actionGroup: {
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
    backgroundColor: '#CA2164',
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
  helpFooter: {
    width: '100%',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
    paddingTop: spacing.md,
  },
  helpLabel: {
    ...typography.caption,
    color: '#94A3B8',
    fontSize: 11,
    marginBottom: spacing.xs,
  },
  helpButtonsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  helpMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E6FFFA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  helpMiniBtnText: {
    ...typography.caption,
    color: '#0F766E',
    fontWeight: '700',
  },
  whatsAppBtn: {
    backgroundColor: '#DCFCE7',
  },
  whatsAppText: {
    ...typography.caption,
    color: '#15803D',
    fontWeight: '700',
  },
});

export default LocationNotServiceableModal;
