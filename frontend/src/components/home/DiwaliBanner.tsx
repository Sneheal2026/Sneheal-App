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

const { spacing, borderRadius } = theme;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const HORIZONTAL_PADDING = spacing.xl;
const BANNER_WIDTH = SCREEN_WIDTH - HORIZONTAL_PADDING * 2;
const DEFAULT_BANNER_ASPECT = 2.15;

const DiwaliBanner = () => {
  const { getImage } = useHomeScreenImages();
  const remote = getImage('festive_banner');

  const source = useMemo(
    () => resolveHomeScreenImageSource('festive_banner', remote),
    [remote],
  );
  const aspectRatio = useMemo(
    () => resolveHomeScreenAspectRatio('festive_banner', remote) ?? DEFAULT_BANNER_ASPECT,
    [remote],
  );
  const accessibilityLabel = useMemo(
    () =>
      resolveHomeScreenAltText(
        'festive_banner',
        remote,
        'Diwali Health Fest — flat 25 percent off on medicines',
      ),
    [remote],
  );

  return (
    <View style={styles.container}>
      <View style={[styles.bannerFrame, { aspectRatio }]}>
        <Image
          source={source}
          style={styles.image}
          contentFit="cover"
          recyclingKey={
            typeof source === 'object' && 'uri' in source ? source.uri : 'festive_banner_local'
          }
          accessibilityRole="image"
          accessibilityLabel={accessibilityLabel}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: HORIZONTAL_PADDING,
    marginTop: spacing.xxs,
    marginBottom: spacing.xxs,
  },
  bannerFrame: {
    width: BANNER_WIDTH,
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
