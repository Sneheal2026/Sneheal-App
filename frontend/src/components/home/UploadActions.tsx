import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/styles/theme';

const { colors, spacing, typography, borderRadius } = theme;

const UploadActions: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Upload Prescription */}
      <TouchableOpacity style={styles.row} activeOpacity={0.75}>
        <View style={styles.iconBox}>
          <Ionicons name="document-text" size={20} color={colors.white} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title}>Upload Prescription</Text>
          <Text style={styles.subtitle}>Snap or upload your prescription</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.5)" />
      </TouchableOpacity>

      {/* Separator */}
      <View style={styles.separator} />

      {/* Upload Tablet Photo */}
      <TouchableOpacity style={styles.row} activeOpacity={0.75}>
        <View style={[styles.iconBox, styles.iconBoxAlt]}>
          <Ionicons name="camera" size={20} color={colors.white} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title}>Upload Tablet Photo</Text>
          <Text style={styles.subtitle}>Identify medicine from its photo</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.5)" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
  },
  separator: {
    height: 1,
    marginHorizontal: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  iconBoxAlt: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  textWrap: {
    flex: 1,
  },
  title: {
    ...typography.body,
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 1,
  },
  subtitle: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
  },
});

export default UploadActions;
