import React from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doctorTheme } from '@/components/doctor/doctorTheme';
import theme from '@/styles/theme';

const { spacing, typography, borderRadius } = theme;

type ReportFileRowProps = {
  title: string;
  meta: string;
  isImage: boolean;
  busy: boolean;
  viewLabel?: string;
  downloadLabel: string;
  onView?: () => void;
  onDownload: () => void;
};

const ReportFileRow = ({
  title,
  meta,
  isImage,
  busy,
  viewLabel,
  downloadLabel,
  onView,
  onDownload,
}: ReportFileRowProps) => (
  <View style={styles.row}>
    <Pressable
      onPress={isImage ? onView : undefined}
      disabled={busy || !isImage}
      style={({ pressed }) => [
        styles.main,
        isImage && pressed && styles.pressed,
      ]}
      accessibilityRole={isImage ? 'button' : 'text'}
      accessibilityLabel={isImage ? `Preview ${title}` : title}
    >
      <View style={styles.icon}>
        <Ionicons
          name={isImage ? 'image-outline' : 'document-text'}
          size={22}
          color={doctorTheme.reportAccent}
        />
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.meta}>{meta}</Text>
      </View>
    </Pressable>

    <View style={styles.actions}>
      {onView ? (
        <Pressable
          onPress={onView}
          disabled={busy}
          style={({ pressed }) => [styles.actionBtn, styles.viewBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={viewLabel ?? 'View'}
        >
          <Ionicons name="eye-outline" size={16} color={doctorTheme.reportAccent} />
        </Pressable>
      ) : null}
      <Pressable
        onPress={onDownload}
        disabled={busy}
        style={({ pressed }) => [styles.actionBtn, styles.downloadBtn, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={downloadLabel}
      >
        {busy ? (
          <ActivityIndicator size="small" color={doctorTheme.primary} />
        ) : (
          <>
            <Ionicons name="download-outline" size={16} color={doctorTheme.primary} />
            <Text style={styles.downloadText}>{downloadLabel}</Text>
          </>
        )}
      </Pressable>
    </View>
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: doctorTheme.reportBg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: doctorTheme.reportBorder,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minWidth: 0,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.md,
    backgroundColor: doctorTheme.reportIconBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: doctorTheme.reportMuted,
  },
  meta: {
    ...typography.caption,
    color: doctorTheme.textSecondary,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 36,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
  },
  viewBtn: {
    backgroundColor: doctorTheme.reportIconBg,
    width: 36,
    paddingHorizontal: 0,
  },
  downloadBtn: {
    backgroundColor: doctorTheme.surface,
    borderWidth: 1,
    borderColor: doctorTheme.border,
  },
  downloadText: {
    ...typography.caption,
    fontWeight: '700',
    color: doctorTheme.primary,
  },
  pressed: {
    opacity: 0.88,
  },
});

export default ReportFileRow;
