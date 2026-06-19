import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface ScanIconProps {
  size?: number;
  color?: string;
}

const STROKE = 1.5;

const ScanIcon = ({ size = 40, color = '#FFFFFF' }: ScanIconProps) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Path
      d="M7 13V7h5"
      stroke={color}
      strokeWidth={STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M25 13V7h-5"
      stroke={color}
      strokeWidth={STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M7 19v6h5"
      stroke={color}
      strokeWidth={STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M25 19v6h-5"
      stroke={color}
      strokeWidth={STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M13.5 16h5"
      stroke={color}
      strokeWidth={STROKE}
      strokeLinecap="round"
    />
  </Svg>
);

export default ScanIcon;
