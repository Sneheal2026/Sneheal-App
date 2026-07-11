import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Image, type ImageContentFit } from 'expo-image';
import Animated, { FadeIn } from 'react-native-reanimated';
import Shimmer from './Shimmer';

export type ShimmerImageProps = {
  uri: string;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  contentFit?: ImageContentFit;
  borderRadius?: number;
  recyclingKey?: string;
};

/**
 * Image that shows a shimmer skeleton until the remote asset finishes loading.
 */
const ShimmerImage: React.FC<ShimmerImageProps> = ({
  uri,
  style,
  imageStyle,
  contentFit = 'cover',
  borderRadius,
  recyclingKey,
}) => {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [uri]);

  const handleLoad = useCallback(() => {
    setLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setFailed(true);
    setLoaded(true);
  }, []);

  return (
    <View style={[styles.wrap, borderRadius != null && { borderRadius, overflow: 'hidden' }, style]}>
      {!loaded ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Shimmer width="100%" height="100%" borderRadius={borderRadius ?? 0} />
        </View>
      ) : null}

      <Animated.View
        entering={loaded ? FadeIn.duration(220) : undefined}
        style={[StyleSheet.absoluteFill, { opacity: loaded ? 1 : 0 }]}
      >
        <Image
          source={{ uri }}
          style={[styles.image, imageStyle]}
          contentFit={contentFit}
          recyclingKey={recyclingKey ?? uri}
          transition={0}
          onLoad={handleLoad}
          onError={handleError}
          accessibilityIgnoresInvertColors
        />
      </Animated.View>

      {failed && loaded ? <View style={styles.failedOverlay} pointerEvents="none" /> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: '#C5D4E8',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  failedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(100,116,139,0.2)',
  },
});

export default React.memo(ShimmerImage);
