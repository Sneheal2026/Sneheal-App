import React from 'react';
import { Pressable, Image, ScrollView, StyleSheet } from 'react-native';
import { doctorTheme } from '@/components/doctor/doctorTheme';
import theme from '@/styles/theme';

const { spacing, borderRadius } = theme;

type PrescriptionGalleryProps = {
  items: { id: string; imageUrl: string }[];
  onOpen: (id: string) => void;
};

const PrescriptionGallery = ({ items, onOpen }: PrescriptionGalleryProps) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.row}
  >
    {items.map((item) => (
      <Pressable
        key={item.id}
        onPress={() => onOpen(item.id)}
        style={({ pressed }) => [styles.thumbWrap, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Open prescription photo"
      >
        <Image source={{ uri: item.imageUrl }} style={styles.thumb} resizeMode="cover" />
      </Pressable>
    ))}
  </ScrollView>
);

const styles = StyleSheet.create({
  row: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  thumbWrap: {
    width: 112,
    height: 148,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: doctorTheme.accentMuted,
    borderWidth: 1,
    borderColor: doctorTheme.border,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  pressed: {
    opacity: 0.88,
  },
});

export default PrescriptionGallery;
