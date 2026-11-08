import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  type ImageSourcePropType,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { PRODUCT_IMAGE_PLACEHOLDER } from '@/utils/productImage';
import theme from '@/styles/theme';

const { colors, spacing, borderRadius } = theme;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ProductImageGalleryProps {
  images?: string[];
  fallbackImage: ImageSourcePropType;
  height: number;
  topInset: number;
}

interface ImageSlideProps {
  uri?: string;
  fallbackSource: ImageSourcePropType;
  width: number;
  height: number;
}

const ImageSlide: React.FC<ImageSlideProps> = ({ uri, fallbackSource, width, height }) => {
  const [loadFailed, setLoadFailed] = useState(false);

  const source = useMemo(() => {
    if (loadFailed || !uri || typeof uri !== 'string' || !/^https?:\/\//i.test(uri.trim())) {
      return fallbackSource || PRODUCT_IMAGE_PLACEHOLDER;
    }
    return { uri: uri.trim() };
  }, [loadFailed, uri, fallbackSource]);

  return (
    <View style={[styles.slide, { width, height }]}>
      <Animated.Image
        entering={FadeIn.duration(280)}
        source={source}
        style={styles.image}
        resizeMode="contain"
        onError={() => setLoadFailed(true)}
      />
    </View>
  );
};

export const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({
  images,
  fallbackImage,
  height,
  topInset,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const validImages = useMemo(() => {
    if (Array.isArray(images) && images.length > 0) {
      const filtered = images.filter((img) => typeof img === 'string' && img.trim().length > 0);
      if (filtered.length > 0) return filtered;
    }
    return [];
  }, [images]);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const contentOffsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(contentOffsetX / SCREEN_WIDTH);
      if (index !== activeIndex && index >= 0 && index < validImages.length) {
        setActiveIndex(index);
      }
    },
    [activeIndex, validImages.length],
  );

  // If only one image or none, render static hero view
  if (validImages.length <= 1) {
    const singleUri = validImages[0];
    return (
      <View style={[styles.container, { height: height + topInset, paddingTop: topInset }]}>
        <ImageSlide
          uri={singleUri}
          fallbackSource={fallbackImage}
          width={SCREEN_WIDTH}
          height={height}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { height: height + topInset, paddingTop: topInset }]}>
      <FlatList
        data={validImages}
        keyExtractor={(_item, index) => `img-slide-${index}`}
        renderItem={({ item }) => (
          <ImageSlide
            uri={item}
            fallbackSource={fallbackImage}
            width={SCREEN_WIDTH}
            height={height}
          />
        )}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onMomentumScrollEnd={onScroll}
        style={styles.list}
      />

      {/* Pagination Dot Indicators */}
      <View style={styles.paginationRow}>
        {validImages.map((_, idx) => (
          <View
            key={`dot-${idx}`}
            style={[
              styles.dot,
              idx === activeIndex ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  list: {
    flex: 1,
    width: SCREEN_WIDTH,
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  image: {
    width: '78%',
    height: '78%',
  },
  paginationRow: {
    position: 'absolute',
    bottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    height: 7,
    borderRadius: 3.5,
  },
  activeDot: {
    width: 20,
    backgroundColor: colors.primary,
  },
  inactiveDot: {
    width: 7,
    backgroundColor: '#D1D5DB',
  },
});

export default ProductImageGallery;

