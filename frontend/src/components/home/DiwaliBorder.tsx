import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useHomeScreenImages } from '@/context/HomeScreenImagesContext';
import {
  resolveHomeScreenAltText,
  resolveHomeScreenAspectRatio,
  resolveHomeScreenImageSource,
} from '@/utils/homeScreenImage';
import theme from '@/styles/theme';

const { spacing, verticalScale } = theme;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DEFAULT_BORDER_ASPECT = 375 / 48;

const DiwaliBorder = () => {
  const { getImage } = useHomeScreenImages();
  const remote = getImage('home_border');

  const source = useMemo(
    () => resolveHomeScreenImageSource('home_border', remote),
    [remote],
  );
  const aspectRatio = useMemo(
    () => resolveHomeScreenAspectRatio('home_border', remote) ?? DEFAULT_BORDER_ASPECT,
    [remote],
  );
  const accessibilityLabel = useMemo(
    () =>
      resolveHomeScreenAltText('home_border', remote, 'Festive decorative border'),
    [remote],
  );

  return (
    <View style={styles.container} pointerEvents="none">
      <Image
        source={source}
        style={[styles.image, { aspectRatio }]}
        contentFit="cover"
        recyclingKey={
          typeof source === 'object' && 'uri' in source ? source.uri : 'home_border_local'
        }
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel}
      />
    </View>
  );
};

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
  },
});

export default React.memo(DiwaliBorder);
