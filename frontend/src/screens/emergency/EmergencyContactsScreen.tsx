import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { NATIONAL_HELPLINES } from '@/constants/emergencyContacts';
import type { NationalHelpline } from '@/types/emergency.types';
import { useTheme } from '@/hooks/useTheme';

const HELPLINE_ICONS: Record<
  NationalHelpline['icon'],
  keyof typeof Ionicons.glyphMap
> = {
  call: 'call',
  medkit: 'medkit',
  car: 'car',
  heart: 'heart',
};

const dialNumber = async (number: string, label: string) => {
  const url = `tel:${number}`;
  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert('Unable to call', `Cannot dial ${label} on this device.`);
      return;
    }
    await Linking.openURL(url);
  } catch {
    Alert.alert('Unable to call', 'Please try again.');
  }
};

const EmergencyContactsScreen = () => {
  const navigation = useNavigation();
  const { colors, spacing, typography, borderRadius, shadows, moderateScale, gradients } =
    useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          backgroundColor: colors.surfaceSecondary,
        },
        hero: {
          paddingBottom: spacing.xl,
        },
        headerRow: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.sm,
        },
        backBtn: {
          width: moderateScale(40),
          height: moderateScale(40),
          borderRadius: borderRadius.full,
          backgroundColor: colors.white,
          alignItems: 'center',
          justifyContent: 'center',
          ...shadows.sm,
        },
        backBtnPressed: { opacity: 0.8 },
        headerTextBlock: {
          flex: 1,
          alignItems: 'center',
        },
        headerTitle: {
          ...typography.h4,
          color: colors.white,
          fontWeight: '700',
        },
        headerSubtitle: {
          ...typography.caption,
          color: 'rgba(255,255,255,0.85)',
          marginTop: 2,
        },
        headerSpacer: {
          width: moderateScale(40),
        },
        body: {
          flex: 1,
          marginTop: -spacing.md,
          borderTopLeftRadius: borderRadius.xxl,
          borderTopRightRadius: borderRadius.xxl,
          backgroundColor: colors.surfaceSecondary,
          overflow: 'hidden',
        },
        scrollContent: {
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.lg,
          paddingBottom: spacing.xxxxxl,
          gap: spacing.md,
        },
        intro: {
          ...typography.bodySmall,
          color: colors.textSecondary,
          lineHeight: 20,
          marginBottom: spacing.xs,
        },
        list: {
          gap: spacing.sm,
        },
        card: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.white,
          borderRadius: borderRadius.lg,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          borderWidth: 1,
          borderColor: colors.borderLight,
          ...shadows.sm,
          gap: spacing.md,
        },
        iconWrap: {
          width: moderateScale(48),
          height: moderateScale(48),
          borderRadius: moderateScale(24),
          backgroundColor: '#FEE2E2',
          alignItems: 'center',
          justifyContent: 'center',
        },
        textBlock: {
          flex: 1,
          gap: 2,
        },
        number: {
          ...typography.h4,
          fontSize: moderateScale(22),
          fontWeight: '800',
          color: colors.error,
          letterSpacing: 0.5,
        },
        label: {
          ...typography.bodySmall,
          fontWeight: '700',
          color: colors.textPrimary,
        },
        description: {
          ...typography.caption,
          color: colors.textMuted,
        },
        callPill: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          backgroundColor: colors.error,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: borderRadius.full,
        },
        callPillText: {
          ...typography.caption,
          fontWeight: '700',
          color: colors.white,
        },
        pressed: { opacity: 0.88 },
        disclaimer: {
          ...typography.caption,
          color: colors.textMuted,
          textAlign: 'center',
          lineHeight: 17,
          marginTop: spacing.md,
          paddingHorizontal: spacing.md,
        },
      }),
    [borderRadius, colors, moderateScale, shadows, spacing, typography],
  );

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={gradients.settingsHero}
        locations={[0, 0.35, 1]}
        style={styles.hero}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
            </Pressable>
            <View style={styles.headerTextBlock}>
              <Text style={styles.headerTitle}>Emergency help</Text>
              <Text style={styles.headerSubtitle}>Tap to call instantly</Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.body}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.duration(350)}>
            <Text style={styles.intro}>
              India emergency numbers. Tap a row to dial right away.
            </Text>
          </Animated.View>

          <View style={styles.list}>
            {NATIONAL_HELPLINES.map((line, index) => (
              <Animated.View
                key={line.id}
                entering={FadeInDown.delay(60 + index * 50).duration(350)}
              >
                <Pressable
                  onPress={() => void dialNumber(line.number, line.label)}
                  style={({ pressed }) => [styles.card, pressed && styles.pressed]}
                  accessibilityLabel={`Call ${line.label} at ${line.number}`}
                  accessibilityRole="button"
                >
                  <View style={styles.iconWrap}>
                    <Ionicons
                      name={HELPLINE_ICONS[line.icon]}
                      size={22}
                      color={colors.error}
                    />
                  </View>
                  <View style={styles.textBlock}>
                    <Text style={styles.number}>{line.number}</Text>
                    <Text style={styles.label}>{line.label}</Text>
                    <Text style={styles.description}>{line.description}</Text>
                  </View>
                  <View style={styles.callPill}>
                    <Ionicons name="call" size={14} color={colors.white} />
                    <Text style={styles.callPillText}>Call</Text>
                  </View>
                </Pressable>
              </Animated.View>
            ))}
          </View>

          <Text style={styles.disclaimer}>
            For life-threatening emergencies, call 112 or 108 immediately.
          </Text>
        </ScrollView>
      </View>
    </View>
  );
};

export default EmergencyContactsScreen;
