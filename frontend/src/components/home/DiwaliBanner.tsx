import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import theme from '@/styles/theme';

const DIWALI_BANNER = require('../../../assets/images/DiwaliBanner.webp');

const { spacing, borderRadius } = theme;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const HORIZONTAL_PADDING = spacing.xl;
const BANNER_WIDTH = SCREEN_WIDTH - HORIZONTAL_PADDING * 2;
/** Matches ~2:1 hero promo width/height in design */
const BANNER_ASPECT = 2.15;

const DiwaliBanner = () => (
  <View style={styles.container}>
    <View style={styles.bannerFrame}>
      <Image
        source={DIWALI_BANNER}
        style={styles.image}
        contentFit="cover"
        accessibilityRole="image"
        accessibilityLabel="Diwali Health Fest — flat 25 percent off on medicines"
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: HORIZONTAL_PADDING,
    marginTop: spacing.xxs,
    marginBottom: spacing.xxs,
  },
  bannerFrame: {
    width: BANNER_WIDTH,
    aspectRatio: BANNER_ASPECT,
    alignSelf: 'center',
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    backgroundColor: '#F3E8D8',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

export default React.memo(DiwaliBanner);
