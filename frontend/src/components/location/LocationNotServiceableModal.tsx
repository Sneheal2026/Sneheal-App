import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Linking,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SUPPORT_CONTACT } from '@/constants/helpFaq';
import theme from '@/styles/theme';

const { spacing, borderRadius, shadows } = theme;

const NOT_IN_AREA_IMG = require('../../../assets/images/Not_In_Your_Area.webp');

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
          {/* Warm gold gradient — top portion only */}
          <LinearGradient
            colors={['#FFF6DC', '#FFF9EA', '#FFFFFF']}
            locations={[0, 0.55, 1]}
            style={styles.gradientTop}
            pointerEvents="none"
          />

          {/* Close button */}
          <Pressable
            onPress={onClose}
            hitSlop={10}
            style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={18} color="#64748B" />
          </Pressable>

          {/* Hero illustration */}
          <Image
            source={NOT_IN_AREA_IMG}
            style={styles.heroImage}
            resizeMode="contain"
          />

          {/* Yellow badge */}
          <View style={styles.alertBadge}>
            <Text style={styles.alertBadgeIcon}>⚠️</Text>
            <Text style={styles.alertBadgeText}>DELIVERY AREA UPDATE</Text>
          </View>

          {/* Main heading */}
          <Text style={styles.title}>We don't deliver here yet</Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            Sneheal currently delivers medicines{'\n'}
            only in <Text style={styles.boldText}>these areas:</Text>
          </Text>

          {/* Coverage list */}
          <View style={styles.coverageBox}>
            <View style={styles.coverageRow}>
              <View style={styles.checkCircle}>
                <Ionicons name="checkmark" size={12} color="#FFFFFF" />
              </View>
              <Text style={styles.coverageText}>Solapur City</Text>
            </View>
            <View style={styles.coverageRow}>
              <View style={styles.checkCircle}>
                <Ionicons name="checkmark" size={12} color="#FFFFFF" />
              </View>
              <Text style={styles.coverageText}>Akkalkot &amp; surrounding rural areas</Text>
            </View>
          </View>

          {/* Primary button — Deliver to Solapur / Akkalkot */}
          <Pressable
            onPress={onSelectSolapurAddress}
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
          >
            <Text style={styles.primaryBtnText}>Deliver to Solapur / Akkalkot</Text>
          </Pressable>

          {/* Secondary button — Explore medicines */}
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
          >
            <Text style={styles.secondaryBtnText}>Explore medicines</Text>
          </Pressable>

          {/* Need help footer */}
          <Text style={styles.helpLabel}>Need help?</Text>

          <View style={styles.helpButtonsRow}>
            {/* Call Sneheal */}
            <Pressable
              onPress={handleCallSupport}
              style={({ pressed }) => [styles.helpBtn, pressed && styles.pressed]}
            >
              <Ionicons name="call-outline" size={15} color="#15803D" />
              <Text style={styles.helpBtnText}>Call Sneheal</Text>
            </Pressable>

            {/* WhatsApp */}
            <Pressable
              onPress={handleWhatsApp}
              style={({ pressed }) => [styles.helpBtn, pressed && styles.pressed]}
            >
              <Ionicons name="logo-whatsapp" size={15} color="#15803D" />
              <Text style={styles.helpBtnText}>WhatsApp</Text>
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
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
    alignItems: 'center',
    overflow: 'hidden',
    ...shadows.lg,
  },

  /* ── Gold gradient overlay (top → centre) ── */
  gradientTop: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    // covers only the top ~55% via locations above
  },

  /* ── Close button (top-right) ── */
  closeBtn: {
    alignSelf: 'flex-end',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },

  /* ── Hero image ── */
  heroImage: {
    width: '100%',
    height: 130,
    marginBottom: 8,
  },

  /* ── Yellow alert badge ── */
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: borderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 6,
    gap: 5,
  },
  alertBadgeIcon: {
    fontSize: 11,
  },
  alertBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.5,
  },

  /* ── Heading ── */
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 26,
  },

  /* ── Subtitle ── */
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 8,
  },
  boldText: {
    color: '#0F172A',
    fontWeight: '700',
  },

  /* ── Coverage box ── */
  coverageBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
    marginBottom: 10,
  },
  coverageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverageText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },

  /* ── Buttons shared ── */
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },

  /* Primary button */
  primaryBtn: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#B01E5A',
    marginBottom: 8,
    ...shadows.sm,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  /* Secondary button */
  secondaryBtn: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    marginBottom: 10,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },

  /* ── Help footer ── */
  helpLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 6,
  },
  helpButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  helpBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#DCFCE7',
    paddingVertical: 8,
    borderRadius: borderRadius.full,
  },
  helpBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
});

export default LocationNotServiceableModal;
