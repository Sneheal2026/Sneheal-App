import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { AuthStackParamList } from '@/navigation/types';
import { useTheme } from '@/hooks/useTheme';

const PrescriptionsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
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
          paddingBottom: spacing.lg,
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
          marginTop: -spacing.sm,
          borderTopLeftRadius: borderRadius.xxl,
          borderTopRightRadius: borderRadius.xxl,
          backgroundColor: colors.surfaceSecondary,
          paddingHorizontal: spacing.xl,
          justifyContent: 'center',
        },
        emptyWrap: {
          alignItems: 'center',
          gap: spacing.md,
          paddingBottom: spacing.xxxxl,
        },
        emptyIconCircle: {
          width: moderateScale(88),
          height: moderateScale(88),
          borderRadius: moderateScale(44),
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.xs,
        },
        emptyTitle: {
          ...typography.h3,
          color: colors.textPrimary,
          fontWeight: '700',
          textAlign: 'center',
        },
        emptySubtitle: {
          ...typography.bodySmall,
          color: colors.textSecondary,
          textAlign: 'center',
          lineHeight: 22,
          maxWidth: 280,
        },
        uploadCta: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          backgroundColor: colors.primary,
          borderRadius: borderRadius.lg,
          paddingVertical: spacing.md + 4,
          paddingHorizontal: spacing.xl,
          marginTop: spacing.sm,
          minHeight: moderateScale(52),
        },
        uploadCtaPressed: { opacity: 0.9 },
        uploadCtaText: {
          ...typography.button,
          color: colors.white,
        },
      }),
    [borderRadius, colors, moderateScale, shadows, spacing, typography],
  );

  const handleUpload = () => {
    navigation.navigate('MedicineScan');
  };

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
              <Text style={styles.headerTitle}>Prescriptions</Text>
              <Text style={styles.headerSubtitle}>Your uploads & medicines</Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.body}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.emptyWrap}>
          <LinearGradient
            colors={[colors.infoLight, colors.white]}
            style={styles.emptyIconCircle}
          >
            <Ionicons
              name="document-text-outline"
              size={moderateScale(40)}
              color={colors.primary}
            />
          </LinearGradient>
          <Text style={styles.emptyTitle}>No prescriptions yet</Text>
          <Text style={styles.emptySubtitle}>
            Upload a prescription to keep it here and reorder medicines easily later.
          </Text>
          <Pressable
            onPress={handleUpload}
            style={({ pressed }) => [styles.uploadCta, pressed && styles.uploadCtaPressed]}
            accessibilityLabel="Upload prescription"
          >
            <Ionicons name="cloud-upload-outline" size={20} color={colors.white} />
            <Text style={styles.uploadCtaText}>Upload prescription</Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
};

export default PrescriptionsScreen;
