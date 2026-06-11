import React, { useCallback, useState } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';

const NOTCH = 14;
const EDGE_HEIGHT = NOTCH / 2;

interface BillTicketEdgeProps {
  pageColor?: string;
  cardColor?: string;
}

const BillTicketEdge = ({
  pageColor = '#F5F6F8',
  cardColor = '#FFFFFF',
}: BillTicketEdgeProps) => {
  const [width, setWidth] = useState(0);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setWidth(e.nativeEvent.layout.width);
  }, []);

  const notchCount = width > 0 ? Math.ceil(width / NOTCH) + 1 : 0;

  return (
    <View
      onLayout={onLayout}
      style={[styles.edge, { backgroundColor: cardColor }]}
    >
      <View style={styles.notchRow}>
        {Array.from({ length: notchCount }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.notch,
              {
                width: NOTCH,
                height: NOTCH,
                borderRadius: NOTCH / 2,
                backgroundColor: pageColor,
                marginLeft: i === 0 ? -NOTCH / 2 : 0,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  edge: {
    height: EDGE_HEIGHT,
    overflow: 'hidden',
  },
  notchRow: {
    flexDirection: 'row',
    marginTop: -EDGE_HEIGHT,
  },
  notch: {},
});

export default BillTicketEdge;
