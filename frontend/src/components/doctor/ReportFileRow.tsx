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
  opening: boolean;
  actionLabel: string;
  onPress: () => void;
};

const ReportFileRow = ({
  title,
  meta,
  isImage,
  opening,
  actionLabel,
  onPress,
}: ReportFileRowProps) => (
  <Pressable
    onPress={onPress}
    disabled={opening}
    style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    accessibilityRole="button"
    accessibilityLabel={`Open ${title}`}
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
    {opening ? (
      <ActivityIndicator size="small" color={doctorTheme.reportAccent} />
    ) : (
      <View style={styles.viewBtn}>
        <Ionicons name="eye-outline" size={16} color={doctorTheme.reportAccent} />
        <Text style={styles.viewText}>{actionLabel}</Text>
      </View>
    )}
  </Pressable>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: doctorTheme.reportBg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: doctorTheme.reportBorder,
    padding: spacing.md,
    marginBottom: spacing.sm,
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
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewText: {
    ...typography.caption,
    fontWeight: '700',
    color: doctorTheme.reportAccent,
  },
  pressed: {
    opacity: 0.88,
  },
});

export default ReportFileRow;
