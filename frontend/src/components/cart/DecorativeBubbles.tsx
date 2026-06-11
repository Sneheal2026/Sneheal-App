import React from 'react';
import { View, StyleSheet } from 'react-native';

interface Bubble {
  size: number;
  right: number;
  top?: number;
  bottom?: number;
  opacity: number;
}

const BUBBLES: Bubble[] = [
  { size: 72, right: -18, top: -22, opacity: 0.14 },
  { size: 48, right: 36, top: -8, opacity: 0.1 },
  { size: 32, right: 4, bottom: -12, opacity: 0.12 },
  { size: 20, right: 52, bottom: 4, opacity: 0.08 },
];

interface DecorativeBubblesProps {
  color?: string;
}

const DecorativeBubbles = ({ color = '#FFFFFF' }: DecorativeBubblesProps) => (
  <View style={styles.wrap} pointerEvents="none">
    {BUBBLES.map((bubble, index) => (
      <View
        key={index}
        style={[
          styles.bubble,
          {
            width: bubble.size,
            height: bubble.size,
            borderRadius: bubble.size / 2,
            backgroundColor: color,
            opacity: bubble.opacity,
            right: bubble.right,
            ...(bubble.top !== undefined ? { top: bubble.top } : {}),
            ...(bubble.bottom !== undefined ? { bottom: bubble.bottom } : {}),
          },
        ]}
      />
    ))}
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  bubble: {
    position: 'absolute',
  },
});

export default DecorativeBubbles;
