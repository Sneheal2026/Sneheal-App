import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

interface ScooterTopViewProps {
  /** Marker width/height in px. Defaults to 80. */
  size?: number;
}

/**
 * Top-view delivery scooter marker (Sneheal branded asset).
 * Front points up — rotate parent Marker with `rotation={heading}`.
 */
const ScooterTopView: React.FC<ScooterTopViewProps> = ({ size = 80 }) => (
  <View style={[styles.wrap, { width: size, height: size }]}>
    <Image
      source={require('../../../assets/images/Scooter-Icon.png')}
      style={{ width: size, height: size }}
      contentFit="contain"
    />
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ScooterTopView;
