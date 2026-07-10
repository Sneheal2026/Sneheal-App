import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { G, Path, Circle } from 'react-native-svg';
import type { PatientCondition } from '@/constants/doctorPatients';
import { doctorTheme } from './doctorTheme';
import theme from '@/styles/theme';

const { spacing, typography } = theme;

const SIZE = 168;
const STROKE = 28;
const RADIUS = (SIZE - STROKE) / 2;
const CX = SIZE / 2;
const CY = SIZE / 2;

type ConditionDonutProps = {
  conditions: PatientCondition[];
};

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

const ConditionDonut: React.FC<ConditionDonutProps> = ({ conditions }) => {
  const segments = useMemo(() => {
    let angle = 0;
    return conditions.map((c) => {
      const sweep = (c.careFocusPercent / 100) * 360;
      const start = angle;
      const end = angle + sweep;
      angle = end;
      return {
        ...c,
        path: describeArc(CX, CY, RADIUS, start, end - 0.4),
      };
    });
  }, [conditions]);

  const count = conditions.length;

  return (
    <View style={styles.wrap}>
      <View style={styles.chartBox}>
        <Svg width={SIZE} height={SIZE}>
          <Circle
            cx={CX}
            cy={CY}
            r={RADIUS}
            stroke={doctorTheme.accentMuted}
            strokeWidth={STROKE}
            fill="none"
          />
          <G>
            {segments.map((seg) => (
              <Path
                key={seg.id}
                d={seg.path}
                stroke={seg.color}
                strokeWidth={STROKE}
                fill="none"
                strokeLinecap="butt"
              />
            ))}
          </G>
        </Svg>
        <View style={styles.centerLabel} pointerEvents="none">
          <Text style={styles.centerValue}>{count}</Text>
          <Text style={styles.centerHint}>conditions</Text>
        </View>
      </View>

      <View style={styles.legend}>
        {conditions.map((c) => (
          <View key={c.id} style={styles.legendRow}>
            <View style={[styles.swatch, { backgroundColor: c.color }]} />
            <Text style={styles.legendName} numberOfLines={1}>
              {c.name}
            </Text>
            <Text style={styles.legendPct}>{c.careFocusPercent}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  chartBox: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerValue: {
    fontSize: 28,
    fontWeight: '800',
    color: doctorTheme.textPrimary,
    letterSpacing: -0.5,
  },
  centerHint: {
    ...typography.caption,
    color: doctorTheme.textSecondary,
    marginTop: -2,
  },
  legend: {
    flex: 1,
    gap: spacing.sm,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendName: {
    ...typography.bodySmall,
    flex: 1,
    color: doctorTheme.textPrimary,
    fontWeight: '600',
  },
  legendPct: {
    ...typography.caption,
    color: doctorTheme.textSecondary,
    fontWeight: '700',
  },
});

export default ConditionDonut;
