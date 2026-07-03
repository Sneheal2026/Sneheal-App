import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  APP_QR_IMAGE_URI,
  APP_SHARE_URL,
  WHATSAPP_SHARE_URL,
  WHATSAPP_WEB_SHARE_URL,
} from '@/constants/appInfo';
import theme from '@/styles/theme';

const { colors, spacing, typography, borderRadius, shadows, moderateScale } = theme;

const openWhatsAppShare = async () => {
  try {
    await Linking.openURL(WHATSAPP_SHARE_URL);
  } catch {
    try {
      await Linking.openURL(WHATSAPP_WEB_SHARE_URL);
    } catch {
      Alert.alert('Unable to open WhatsApp', 'Please make sure WhatsApp is installed on your device.');
    }
  }
};

const ShareAppScreen = () => {
  const navigation = useNavigation();

  const handleQrPress = useCallback(() => {
    openWhatsAppShare();
  }, []);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#E8F2FF', '#F0FDF9', colors.surfaceSecondary]}
        locations={[0, 0.35, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.blobTop} />
      <View style={styles.blobBottom} />

      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
            hitSlop={8}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Share the App</Text>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(450)}>
          <View style={styles.heroBlock}>
            <View style={styles.heroBadge}>
              <Ionicons name="sparkles" size={12} color={colors.secondary} />
              <Text style={styles.heroBadgeText}>Invite & earn goodwill</Text>
            </View>
            <Text style={styles.heroTitle}>
              Share Sneheal,{'\n'}
              <Text style={styles.heroTitleAccent}>spread wellness</Text>
            </Text>
            <Text style={styles.heroSubtitle}>
              Help friends & family order medicines in minutes with a single scan or tap.
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(450)} style={styles.qrSection}>
          <LinearGradient
            colors={['#1A73E8', '#0D9488', '#25D366']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.qrGradientRing}
          >
            <Pressable
              onPress={handleQrPress}
              style={({ pressed }) => [styles.qrCard, pressed && styles.qrCardPressed]}
              accessibilityRole="button"
              accessibilityLabel="Share Sneheal on WhatsApp"
              accessibilityHint="Opens WhatsApp with the app download link"
            >
              <View style={styles.qrInner}>
                <View style={styles.qrImageWrap}>
                  <Image
                    source={{ uri: APP_QR_IMAGE_URI }}
                    style={styles.qrImage}
                    resizeMode="cover"
                    accessibilityLabel="QR code to download Sneheal"
                  />
                  <View style={styles.qrLogoOverlay} pointerEvents="none">
                    <View style={styles.qrLogoBadge}>
                      <Image
                        source={require('../../../assets/images/icon.png')}
                        style={styles.qrLogo}
                        resizeMode="contain"
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.scanBadge}>
                  <View style={styles.scanDot} />
                  <Text style={styles.scanBadgeText}>Tap to share</Text>
                </View>
              </View>
            </Pressable>
          </LinearGradient>

          <View style={styles.urlPill}>
            <Ionicons name="link-outline" size={14} color={colors.primary} />
            <Text style={styles.urlText} numberOfLines={1}>
              {APP_SHARE_URL}
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(140).duration(450)}>
          <Pressable
            onPress={openWhatsAppShare}
            style={({ pressed }) => [styles.whatsappBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Share on WhatsApp"
          >
            <LinearGradient
              colors={['#25D366', '#128C7E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.whatsappGradient}
            >
              <View style={styles.whatsappIconWrap}>
                <Ionicons name="logo-whatsapp" size={24} color={colors.white} />
              </View>
              <View style={styles.whatsappTextBlock}>
                <Text style={styles.whatsappBtnText}>Share on WhatsApp</Text>
                <Text style={styles.whatsappBtnSub}>Send link to friends instantly</Text>
              </View>
              <Ionicons name="arrow-forward-circle" size={26} color="rgba(255,255,255,0.85)" />
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
  },
  blobTop: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(26, 115, 232, 0.08)',
  },
  blobBottom: {
    position: 'absolute',
    top: 280,
    left: -70,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(13, 148, 136, 0.07)',
  },
  safeTop: {
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    ...shadows.sm,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: moderateScale(18),
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxxxl,
    gap: spacing.xl,
  },
  heroBlock: {
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(13, 148, 136, 0.15)',
  },
  heroBadgeText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.secondary,
    letterSpacing: 0.2,
  },
  heroTitle: {
    fontSize: moderateScale(28),
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: moderateScale(34),
    letterSpacing: -0.8,
  },
  heroTitleAccent: {
    color: colors.primary,
  },
  heroSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 22,
    maxWidth: 300,
  },
  qrSection: {
    alignItems: 'center',
    gap: spacing.md,
  },
  qrGradientRing: {
    borderRadius: borderRadius.xxl,
    padding: 3,
    width: '100%',
    ...shadows.lg,
  },
  qrCard: {
    borderRadius: borderRadius.xxl - 2,
    overflow: 'hidden',
  },
  qrCardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  qrInner: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xxl - 2,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    gap: spacing.lg,
  },
  qrImageWrap: {
    width: 210,
    height: 210,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: borderRadius.lg,
    backgroundColor: colors.white,
  },
  qrImage: {
    width: '100%',
    height: '100%',
  },
  qrLogoOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrLogoBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
    ...shadows.md,
  },
  qrLogo: {
    width: 36,
    height: 36,
    borderRadius: 9,
  },
  scanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.infoLight,
  },
  scanDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  scanBadgeText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.3,
  },
  urlPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: `${colors.primary}20`,
    maxWidth: '100%',
    ...shadows.sm,
  },
  urlText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    flexShrink: 1,
  },
  whatsappBtn: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  whatsappGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  whatsappIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsappTextBlock: {
    flex: 1,
    gap: 2,
  },
  whatsappBtnText: {
    ...typography.bodySmall,
    fontWeight: '800',
    color: colors.white,
    fontSize: moderateScale(15),
  },
  whatsappBtnSub: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  pressed: {
    opacity: 0.75,
  },
});

export default ShareAppScreen;
