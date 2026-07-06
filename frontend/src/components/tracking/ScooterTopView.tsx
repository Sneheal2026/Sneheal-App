import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { moderateScale } from '@/styles/device';

/** Shared asset */
export const SCOOTER_ICON_IMAGE = require('../../../assets/images/Scooter-Icon.png');

/** Map marker size — scales slightly per device, stays proportional to route line */
export const AGENT_MARKER_SIZE = moderateScale(44);

interface ScooterTopViewProps {
  size?: number;
  onLoad?: () => void;
}

/**
 * Top-view delivery scooter for MapView markers.
 * Front points up — parent Marker uses `rotation={heading}` + `flat`.
 */
const ScooterTopView: React.FC<ScooterTopViewProps> = ({
  size = AGENT_MARKER_SIZE,
  onLoad,
}) => (
  <View
    collapsable={false}
    style={[styles.wrap, { width: size, height: size }]}
    pointerEvents="none"
  >
    <Image
      source={SCOOTER_ICON_IMAGE}
      style={styles.image}
      resizeMode="contain"
      fadeDuration={0}
      onLoad={onLoad}
    />
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    backgroundColor: 'transparent',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

export default ScooterTopView;
