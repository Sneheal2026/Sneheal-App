import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/styles/theme';
import {
  AUTH_HERO_HEIGHT,
  AUTH_CARD_OVERLAP,
  AUTH_CARD_RADIUS,
  AUTH_HORIZONTAL_PADDING,
  AUTH_HERO_TAGLINE,
  AUTH_HERO_IMAGES,
  AUTH_HERO_ILLUSTRATION_RATIO,
} from './authTheme';

const { colors, spacing } = theme;

const ILLUSTRATION_MAX_HEIGHT = Math.round(AUTH_HERO_HEIGHT * AUTH_HERO_ILLUSTRATION_RATIO);

interface AuthScreenLayoutProps {
  children: React.ReactNode;
  footer?: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
}

const AuthScreenLayout: React.FC<AuthScreenLayoutProps> = ({
  children,
  footer,
  showBack,
  onBack,
}) => {
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const onHide = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, []);

  const bottomPad =
    keyboardHeight > 0
      ? keyboardHeight - insets.bottom + spacing.lg
      : insets.bottom + spacing.xl;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <View style={[styles.hero, { height: AUTH_HERO_HEIGHT }]}>
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.3, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <SafeAreaView edges={['top']} style={styles.heroSafe}>
          <View style={styles.heroTop}>
            <View style={styles.logoWrap}>
              <Image
                source={AUTH_HERO_IMAGES.logo}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.heroTagline}>{AUTH_HERO_TAGLINE}</Text>
          </View>
        </SafeAreaView>

        {showBack && (
          <SafeAreaView edges={['top']} style={styles.backOverlay} pointerEvents="box-none">
            <TouchableOpacity
              style={styles.backBtn}
              onPress={onBack}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={22} color={colors.textInverse} />
            </TouchableOpacity>
          </SafeAreaView>
        )}

        {/* Pinned to hero bottom — sits flush against the form sheet */}
        <View style={[styles.illustrationWrap, { height: ILLUSTRATION_MAX_HEIGHT }]}>
          <Image
            source={AUTH_HERO_IMAGES.illustration}
            style={styles.illustration}
            resizeMode="contain"
          />
        </View>
      </View>

      <KeyboardAvoidingView
        style={[styles.cardShell, { marginTop: -AUTH_CARD_OVERLAP }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: bottomPad },
            ]}
          >
            <View style={styles.formBody}>{children}</View>
            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  hero: {
    width: '100%',
    overflow: 'visible',
  },
  heroSafe: {
    paddingHorizontal: AUTH_HORIZONTAL_PADDING,
  },
  backOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: AUTH_HORIZONTAL_PADDING,
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  heroTop: {
    alignItems: 'center',
    paddingTop: spacing.lg,
  },
  logoWrap: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  logo: {
    width: 72,
    height: 72,
  },
  heroTagline: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textInverse,
    textAlign: 'center',
    letterSpacing: 0.2,
    marginTop: spacing.md,
    lineHeight: 22,
    paddingHorizontal: spacing.md,
  },
  illustrationWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: AUTH_HORIZONTAL_PADDING,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  illustration: {
    width: '100%',
    height: '100%',
  },
  cardShell: {
    flex: 1,
    zIndex: 2,
  },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: AUTH_CARD_RADIUS,
    borderTopRightRadius: AUTH_CARD_RADIUS,
    overflow: 'hidden',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: AUTH_HORIZONTAL_PADDING,
    paddingTop: spacing.xl,
  },
  formBody: {
    flex: 1,
  },
  footer: {
    marginTop: spacing.xxl,
  },
});

export default AuthScreenLayout;
