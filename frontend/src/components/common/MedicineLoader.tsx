/**
 * MedicineLoader – A spinning, opening/closing pill with floating medicine dust.
 *
 * Faithful React-Native port of the original HTML + CSS loader.
 * Uses react-native-reanimated v3/v4 for buttery-smooth UI-thread animations.
 *
 * ── Animation map ──────────────────────────────────────────────────────────────
 *  CSS @keyframes       →  Reanimated equivalent
 *  ──────────────────────────────────────────────────────────────────────────────
 *  spin         (4 s)   →  spinSV : 180° → −540°  (withRepeat × ∞, linear)
 *  open         (2 s)   →  openSV : 0 → 25 px gap → 0  (withSequence)
 *  shine        (1 s)   →  shineSV: 3.75 px ↔ 18.75 px (withSequence ping-pong)
 *  shadow       (1 s)   →  shadowSV: rotateY 0° ↔ 180°, left 0 ↔ −7.5 px
 *  medicine-dust(1.75s) →  dustAVs[i]: per-particle translate3d oscillation
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  interpolate,
  Extrapolation,
  ReduceMotion,
} from 'react-native-reanimated';

/* ── Screen metrics ─────────────────────────────────────────────────────────── */
const { width: SW, height: SH } = Dimensions.get('window');
const VMIN = Math.min(SW, SH) / 100;
const vmin = (n: number) => n * VMIN;

/* ── Colour palette (exact matches from the CSS source) ─────────────────────── */
const C = {
  bg:          '#000000',
  topHalf:     '#f7c340',   // golden yellow
  bottomHalf:  '#d9680c',   // burnt orange
  band:        '#621e1a',   // dark maroon seam between halves
  dust:        '#47c',      // blue medicine specks
  shine:       'rgba(255,255,255,0.133)',
  shadowEdge:  'rgba(0,0,0,0.133)',
};

/* ── Per-particle seed data (margin-top, margin-right, delay) ───────────────── */
const DUST_SEEDS = [
  { mt:  0,  mr:  0,    delay: 0      },
  { mt: -5,  mr: -5,    delay: 0.2    },
  { mt:  4,  mr:  3,    delay: 0.33   },
  { mt: -5,  mr:  4,    delay: 0.4    },
  { mt:  5,  mr: -4,    delay: 0.5    },
  { mt:  0,  mr: -3.5,  delay: 0.66   },
  { mt: -1,  mr:  7,    delay: 0.7    },
  { mt:  6,  mr: -1,    delay: 0.8    },
  { mt:  4,  mr: -7,    delay: 0.99   },
  { mt: -6,  mr:  0,    delay: 1.11   },
  { mt:  6,  mr:  6,    delay: 1.125  },
  { mt: -7,  mr: -7,    delay: 1.275  },
  { mt: -1,  mr:  3,    delay: 1.33   },
  { mt: -3,  mr: -1,    delay: 1.4    },
  { mt: -1,  mr: -7,    delay: 1.55   },
  { mt:  2,  mr:  5,    delay: 0.15   },
  { mt: -4,  mr: -3,    delay: 0.45   },
  { mt:  3,  mr:  2,    delay: 0.75   },
  { mt: -2,  mr:  6,    delay: 1.0    },
  { mt:  5,  mr: -2,    delay: 1.25   },
] as const;

const DUST_DURATION = 1750;

/* ── Props ──────────────────────────────────────────────────────────────────── */
export interface MedicineLoaderProps {
  message?: string;
}

/* ── Component ──────────────────────────────────────────────────────────────── */
const MedicineLoader: React.FC<MedicineLoaderProps> = ({ message }) => {

  /* ── Master animation clocks ──────────────────────────────────────────────── */
  const spinSV   = useSharedValue(180);
  const openSV   = useSharedValue(0);
  const shineSV  = useSharedValue(0);
  const shadowSV = useSharedValue(0);

  /* ── Per-particle translate pairs (tx, ty) ────────────────────────────────── */
  const dustAVs = DUST_SEEDS.map(() => ({
    tx: useSharedValue(0),
    ty: useSharedValue(0),
  }));

  /* ── Kick off all animations on mount ─────────────────────────────────────── */
  useEffect(() => {

    // ── spin: continuous 720° rotation (linear, 4 s loop) ──────────────────
    spinSV.value = withRepeat(
      withTiming(-540, { duration: 4000, easing: Easing.linear }),
      -1,
      false,
      undefined,
      ReduceMotion.Never,
    );

    // ── open/close: pill halves separate then rejoin (2 s loop) ────────────
    openSV.value = withRepeat(
      withSequence(
        withDelay(400,  withTiming(25, { duration: 200, easing: Easing.inOut(Easing.ease) })),
        withDelay(800,  withTiming(0,  { duration: 200, easing: Easing.inOut(Easing.ease) })),
        withDelay(400,  withTiming(0,  { duration: 200 })),
      ),
      -1,
      false,
      undefined,
      ReduceMotion.Never,
    );

    // ── shine: highlight strip sweeps left ↔ right (1 s loop) ──────────────
    shineSV.value = withRepeat(
      withSequence(
        withDelay(460, withTiming(1, { duration:  80, easing: Easing.ease })),
        withDelay(460, withTiming(0, { duration:  80, easing: Easing.ease })),
      ),
      -1,
      false,
      undefined,
      ReduceMotion.Never,
    );

    // ── shadow: border depth flips side ↔ side (1 s loop) ─────────────────
    shadowSV.value = withRepeat(
      withSequence(
        withDelay(500, withTiming(1, { duration:  50, easing: Easing.linear })),
        withDelay(500, withTiming(0, { duration:  50, easing: Easing.linear })),
      ),
      -1,
      false,
      undefined,
      ReduceMotion.Never,
    );

    // ── medicine-dust: each particle oscillates on its own phase ───────────
    dustAVs.forEach((avs, i) => {
      const d = DUST_SEEDS[i];
      const duration = DUST_DURATION - d.delay * 1000;
      avs.tx.value = withRepeat(
        withSequence(
          withTiming( 0.25, { duration, easing: Easing.ease }),
          withTiming(-0.1,  { duration, easing: Easing.ease }),
          withTiming( 0,    { duration, easing: Easing.ease }),
        ),
        -1, false, undefined, ReduceMotion.Never,
      );
      avs.ty.value = withRepeat(
        withSequence(
          withTiming( 5, { duration, easing: Easing.ease }),
          withTiming(-4, { duration, easing: Easing.ease }),
          withTiming( 0, { duration, easing: Easing.ease }),
        ),
        -1, false, undefined, ReduceMotion.Never,
      );
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Animated styles ─────────────────────────────────────────────────────── */

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spinSV.value}deg` }],
  }));

  const bottomHalfStyle = useAnimatedStyle(() => ({
    marginTop: openSV.value,
  }));

  // Pre-compute all vmin values in JS context so worklets don't call the vmin function
  const shineLo    = vmin(1.5);
  const shineHi    = vmin(7.5);
  const shadowEdge = vmin(-3);

  const shineAnimStyle = useAnimatedStyle(() => {
    const rightVal = interpolate(shineSV.value, [0, 1], [shineLo, shineHi]);
    return { right: rightVal };
  });

  const shineBottomAnimStyle = useAnimatedStyle(() => {
    const rightVal = interpolate(shineSV.value, [0, 1], [shineLo, shineHi]);
    return { right: rightVal };
  });

  const shadowLeftStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(shadowSV.value, [0, 1], [0, 180]);
    const left    = interpolate(shadowSV.value, [0, 1], [0, shadowEdge]);
    return { transform: [{ rotateY: `${rotateY}deg` }], left };
  });

  const shadowRightStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(shadowSV.value, [0, 1], [180, 0]);
    const right   = interpolate(shadowSV.value, [0, 1], [shadowEdge, 0]);
    return { transform: [{ rotateY: `${rotateY}deg` }], right };
  });

  const dustStyles = DUST_SEEDS.map((seed, i) => {
    // Pre-compute all vmin values in JS context before entering the worklet
    const seedTx  = vmin(seed.mr);
    const seedTy  = vmin(seed.mt);
    const dustTxLo = vmin(-0.1);
    const dustTxHi = vmin(0.25);
    const dustTyLo = vmin(-4);
    const dustTyHi = vmin(5);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useAnimatedStyle(() => {
      const tx = seedTx + interpolate(
        dustAVs[i].tx.value, [-0.1, 0.25], [dustTxLo, dustTxHi], Extrapolation.CLAMP,
      );
      const ty = seedTy + interpolate(
        dustAVs[i].ty.value, [-4, 5], [dustTyLo, dustTyHi], Extrapolation.CLAMP,
      );
      return { transform: [{ translateX: tx }, { translateY: ty }] };
    });
  });

  /* ── Render ──────────────────────────────────────────────────────────────── */
  return (
    <View style={styles.overlay}>
      <View style={styles.content}>
        <Animated.View style={[styles.pill, pillStyle]}>

          {/* ── Top half (golden cap) ───────────────────────────────────── */}
          <View style={styles.halfWrap}>
            <View style={[styles.half, styles.halfTop]}>
              {/* shine strip */}
              <Animated.View style={[styles.shineStrip, styles.shineTop, shineAnimStyle]} />
              {/* depth shadows */}
              <Animated.View style={[styles.depthStrip, styles.depthLeft, shadowLeftStyle]} />
              <Animated.View style={[styles.depthStrip, styles.depthRight, shadowRightStyle]} />
            </View>
          </View>

          {/* ── Medicine dust (20 blue specks) ──────────────────────────── */}
          <View style={styles.dustContainer}>
            {DUST_SEEDS.map((d, i) => {
              const isLg = (i + 1) % 3 === 0;
              const isMd = (i + 1) % 2 === 0 && !isLg;
              const dotSize = isLg ? vmin(2) : isMd ? vmin(1.5) : vmin(1);
              const smDot = i >= 9;
              const sz = smDot ? vmin(0.6) : dotSize;
              return (
                <Animated.View
                  key={`dust-${i}`}
                  style={[
                    styles.dustDot,
                    {
                      width:  sz,
                      height: sz,
                    },
                    dustStyles[i],
                  ]}
                />
              );
            })}
          </View>

          {/* ── Bottom half (orange cap, opens & closes) ────────────────── */}
          <Animated.View style={[styles.halfWrap, bottomHalfStyle]}>
            <View style={[styles.half, styles.halfBottom]}>
              <View style={styles.bandLine} />
              {/* shine strip */}
              <Animated.View style={[styles.shineStrip, styles.shineBottom, shineBottomAnimStyle]} />
            </View>
          </Animated.View>

        </Animated.View>
      </View>

      {message ? <Text style={styles.msg}>{message}</Text> : null}
    </View>
  );
};

/* ── Stylesheet ─────────────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  /* Full-screen dark overlay */
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },

  /* Content wrapper (50vmin square, matching .content) */
  content: {
    width:  vmin(50),
    height: vmin(50),
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Pill body (rotates) */
  pill: {
    width:  vmin(15),
    height: vmin(40),
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Each half sits inside a clipped wrapper */
  halfWrap: {
    width:    vmin(11),
    height:   vmin(15),
    overflow: 'hidden',
  },

  half: {
    width:  vmin(11),
    height: vmin(15),
  },

  halfTop: {
    backgroundColor: C.topHalf,
    borderTopLeftRadius:  vmin(6),
    borderTopRightRadius: vmin(6),
  },

  halfBottom: {
    backgroundColor: C.bottomHalf,
    borderBottomLeftRadius:  vmin(6),
    borderBottomRightRadius: vmin(6),
  },

  /* Dark maroon seam between the two halves */
  bandLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: vmin(1),
    backgroundColor: C.band,
  },

  /* Semi-transparent highlight strip (replaces .side:before) */
  shineStrip: {
    position: 'absolute',
    width:  vmin(2),
    height: vmin(10),
    backgroundColor: C.shine,
    borderRadius: vmin(1),
  },
  shineTop: {
    bottom: 0,
    borderTopLeftRadius:  vmin(1),
    borderTopRightRadius: vmin(1),
    borderBottomLeftRadius:  0,
    borderBottomRightRadius: 0,
  },
  shineBottom: {
    top: 0,
    borderTopLeftRadius:  0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius:  vmin(1),
    borderBottomRightRadius: vmin(1),
  },

  /* Depth edge overlays (replaces .side:after border effect) */
  depthStrip: {
    position: 'absolute',
    top: 0,
    width:  vmin(1.75),
    height: vmin(15),
    backgroundColor: C.shadowEdge,
  },
  depthLeft: {
    left: 0,
    borderTopLeftRadius: vmin(6),
    borderBottomLeftRadius: 0,
  },
  depthRight: {
    right: 0,
    borderTopRightRadius: vmin(6),
    borderBottomRightRadius: 0,
  },

  /* Dust container (fills the pill interior, centred) */
  dustContainer: {
    position: 'absolute',
    top:    vmin(6),
    bottom: vmin(6),
    left:   vmin(3),
    right:  vmin(3),
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Individual dust speck */
  dustDot: {
    position: 'absolute',
    backgroundColor: C.dust,
    borderRadius: 999,
  },

  /* Optional loading message */
  msg: {
    marginTop: vmin(4),
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default MedicineLoader;
