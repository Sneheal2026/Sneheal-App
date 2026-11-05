import React from 'react';
import { View, StyleSheet, Dimensions, Image as RNImage } from 'react-native';
import { Image } from 'expo-image';
import theme from '@/styles/theme';

const DIWALI_BORDER = require('../../../assets/images/DiwaliBorder.webp');

const { spacing, verticalScale } = theme;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const borderAsset = RNImage.resolveAssetSource(DIWALI_BORDER);
const BORDER_ASPECT =
  borderAsset?.width && borderAsset?.height
    ? borderAsset.width / borderAsset.height
    : 375 / 48;

const DiwaliBorder = () => (
  <View style={styles.container} pointerEvents="none">
    <Image
      source={DIWALI_BORDER}
      style={styles.image}
      contentFit="cover"
      accessibilityRole="image"
      accessibilityLabel="Diwali decorative border"
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    alignSelf: 'center',
    marginTop: spacing.xxs,
    marginBottom: verticalScale(6),
    zIndex: 5,
    elevation: 5,
  },
  image: {
    width: '100%',
    aspectRatio: BORDER_ASPECT,
  },
});

export default React.memo(DiwaliBorder);
