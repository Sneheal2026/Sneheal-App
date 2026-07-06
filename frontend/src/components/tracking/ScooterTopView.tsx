import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';
import { moderateScale } from '@/styles/device';

/** Map marker size — scales slightly per device, stays proportional to route line */
export const AGENT_MARKER_SIZE = moderateScale(48);

const C = {
  dark: '#20242E',
  darker: '#14171F',
  blue: '#2F80ED',
  blueDeep: '#1B5CC4',
  green: '#43A047',
  glass: '#B9D4F2',
  helmetEdge: '#C9D2DE',
};

interface ScooterTopViewProps {
  size?: number;
  onLoad?: () => void;
}

/**
 * Top-view delivery scooter (pure SVG — crisp on iOS + Android, no bitmap).
 * Front points up — parent Marker uses `rotation={heading}` + `flat`.
 */
const ScooterTopView: React.FC<ScooterTopViewProps> = ({
  size = AGENT_MARKER_SIZE,
  onLoad,
}) => {
  // SVG renders synchronously; signal "ready" so the parent can freeze
  // the marker snapshot (tracksViewChanges) just like the old Image did.
  useEffect(() => {
    onLoad?.();
  }, [onLoad]);

  return (
    <View
      collapsable={false}
      style={[styles.wrap, { width: size, height: size }]}
      pointerEvents="none"
    >
      <Svg width={size} height={size} viewBox="0 0 64 64">
        <Defs>
          <LinearGradient id="jacket" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={C.blue} />
            <Stop offset="1" stopColor={C.blueDeep} />
          </LinearGradient>
          <LinearGradient id="helmet" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" />
            <Stop offset="1" stopColor="#E4EAF2" />
          </LinearGradient>
          <LinearGradient id="box" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" />
            <Stop offset="1" stopColor="#EEF3F8" />
          </LinearGradient>
        </Defs>

        {/* Soft ground shadow so the marker pops on the map */}
        <Ellipse cx={32} cy={34} rx={17} ry={28} fill="#000" opacity={0.07} />

        {/* Front wheel + tread line */}
        <Rect x={29.4} y={1.5} width={5.2} height={10} rx={2.6} fill={C.darker} />
        <Rect x={31.4} y={2.8} width={1.2} height={7.4} rx={0.6} fill="#3A4150" />

        {/* Front fender (body colour, hugs the wheel) */}
        <Path
          d="M27.6 6.5 Q32 3.8 36.4 6.5 L36.4 12 Q32 13.8 27.6 12 Z"
          fill="url(#jacket)"
        />
        <Path d="M29 7.2 Q32 5.6 35 7.2" stroke="#FFFFFF" strokeWidth={1} strokeLinecap="round" opacity={0.55} fill="none" />

        {/* Windshield (curved, translucent) */}
        <Path
          d="M23 20 Q32 11.5 41 20 L39.2 23.4 Q32 17.6 24.8 23.4 Z"
          fill={C.glass}
          opacity={0.9}
        />
        <Path d="M25 19.4 Q32 13.8 39 19.4" stroke="#FFFFFF" strokeWidth={1.1} strokeLinecap="round" opacity={0.7} fill="none" />

        {/* Handlebar */}
        <Path d="M16.5 25.5 Q32 19 47.5 25.5" stroke={C.dark} strokeWidth={3} strokeLinecap="round" fill="none" />

        {/* Mirror stalks + mirrors (glass inset) */}
        <Path d="M17.5 24.5 L12.5 18.5" stroke={C.dark} strokeWidth={1.6} strokeLinecap="round" />
        <Path d="M46.5 24.5 L51.5 18.5" stroke={C.dark} strokeWidth={1.6} strokeLinecap="round" />
        <Ellipse cx={12} cy={17.5} rx={3.4} ry={2.3} fill={C.dark} />
        <Ellipse cx={52} cy={17.5} rx={3.4} ry={2.3} fill={C.dark} />
        <Ellipse cx={12} cy={17.3} rx={2.1} ry={1.2} fill={C.glass} opacity={0.8} />
        <Ellipse cx={52} cy={17.3} rx={2.1} ry={1.2} fill={C.glass} opacity={0.8} />

        {/* Arms from shoulders to grips */}
        <Path d="M24.5 35.5 L17.8 25.8" stroke={C.blueDeep} strokeWidth={5.6} strokeLinecap="round" />
        <Path d="M39.5 35.5 L46.2 25.8" stroke={C.blueDeep} strokeWidth={5.6} strokeLinecap="round" />
        <Path d="M24.5 35 L18.2 26" stroke={C.blue} strokeWidth={3.6} strokeLinecap="round" />
        <Path d="M39.5 35 L45.8 26" stroke={C.blue} strokeWidth={3.6} strokeLinecap="round" />

        {/* Gloves on the grips */}
        <Circle cx={17.2} cy={25} r={3} fill={C.darker} />
        <Circle cx={46.8} cy={25} r={3} fill={C.darker} />

        {/* Torso / shoulders (jacket with back panel) */}
        <Rect x={21} y={30.5} width={22} height={16} rx={7.5} fill="url(#jacket)" />
        <Path
          d="M23.5 42 Q32 46.5 40.5 42 L40.5 44.5 Q32 48.5 23.5 44.5 Z"
          fill={C.blueDeep}
        />
        {/* Shoulder pads */}
        <Circle cx={24.8} cy={34.2} r={2.6} fill={C.blueDeep} opacity={0.85} />
        <Circle cx={39.2} cy={34.2} r={2.6} fill={C.blueDeep} opacity={0.85} />

        {/* Helmet — gradient shell, brand stripe, gloss */}
        <Circle cx={32} cy={36.5} r={8} fill="url(#helmet)" stroke={C.helmetEdge} strokeWidth={0.9} />
        <Rect x={30.1} y={28.5} width={3.8} height={16} rx={1.9} fill={C.blue} />
        <Ellipse cx={28.6} cy={32.4} rx={2.4} ry={1.5} fill="#FFFFFF" opacity={0.75} transform="rotate(-32 28.6 32.4)" />

        {/* Delivery box */}
        <Rect
          x={18.5}
          y={47.5}
          width={27}
          height={14.5}
          rx={3.2}
          fill="url(#box)"
          stroke={C.blueDeep}
          strokeWidth={1.4}
        />
        {/* Straps over the box edges */}
        <Rect x={22.4} y={47} width={1.6} height={15.5} rx={0.8} fill={C.dark} opacity={0.28} />
        <Rect x={40} y={47} width={1.6} height={15.5} rx={0.8} fill={C.dark} opacity={0.28} />
        {/* Medical cross */}
        <Rect x={30} y={50} width={4} height={9.6} rx={1.3} fill={C.blue} />
        <Rect x={27.2} y={52.8} width={9.6} height={4} rx={1.3} fill={C.green} />

        {/* Rear wheel peeking out */}
        <Rect x={29.6} y={61.2} width={4.8} height={2.6} rx={1.3} fill={C.darker} />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    backgroundColor: 'transparent',
  },
});

export default ScooterTopView;
