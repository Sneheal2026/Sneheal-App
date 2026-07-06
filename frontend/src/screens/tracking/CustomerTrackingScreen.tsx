import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  StatusBar,
  Animated as RNAnimated,
} from 'react-native';
import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
} from 'react-native-maps';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RouteProp } from '@react-navigation/native';
import type { AuthStackParamList } from '@/navigation/types';
import { useAgentTracking } from '@/hooks/useAgentTracking';
import TrackingProgressBar from '@/components/tracking/TrackingProgressBar';
import theme from '@/styles/theme';

const { colors, spacing, typography, borderRadius, shadows } = theme;

const GOOGLE_MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY ?? '';

const MEDICINE_HUB = {
  latitude: 18.6729,
  longitude: 78.1047,
  title: 'Sneheal Medicine Hub',
};

interface Coords {
  latitude: number;
  longitude: number;
}

function distanceBetween(a: Coords, b: Coords): number {
  const R = 6371000;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function projectOnSegment(p: Coords, a: Coords, b: Coords): Coords {
  const dx = b.longitude - a.longitude;
  const dy = b.latitude - a.latitude;
  if (dx === 0 && dy === 0) return a;
  let t =
    ((p.longitude - a.longitude) * dx + (p.latitude - a.latitude) * dy) /
    (dx * dx + dy * dy);
  t = Math.max(0, Math.min(1, t));
  return { latitude: a.latitude + t * dy, longitude: a.longitude + t * dx };
}

function snapToPolyline(
  point: Coords,
  polyline: Coords[],
): { index: number; snapped: Coords } {
  let minDist = Infinity;
  let bestIdx = 0;
  let bestPoint: Coords = polyline[0];

  for (let i = 0; i < polyline.length - 1; i++) {
    const a = polyline[i];
    const b = polyline[i + 1];
    const proj = projectOnSegment(point, a, b);
    const d = distanceBetween(point, proj);
    if (d < minDist) {
      minDist = d;
      bestIdx = i;
      bestPoint = proj;
    }
  }
  return { index: bestIdx, snapped: bestPoint };
}

function decodePolyline(encoded: string): Coords[] {
  const points: Coords[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;
    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
}

function polylineLength(points: Coords[]): number {
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    total += distanceBetween(points[i], points[i + 1]);
  }
  return total;
}

// Stitch per-step polylines for road-accurate geometry (overview_polyline
// is heavily simplified and cuts across buildings).
function extractDetailedRoute(route: any): Coords[] {
  const steps = route?.legs?.[0]?.steps;
  if (!Array.isArray(steps) || steps.length === 0) {
    return decodePolyline(route?.overview_polyline?.points ?? '');
  }
  const points: Coords[] = [];
  for (const step of steps) {
    const encoded = step?.polyline?.points;
    if (!encoded) continue;
    const decoded = decodePolyline(encoded);
    if (points.length > 0 && decoded.length > 0) decoded.shift();
    points.push(...decoded);
  }
  return points.length > 1
    ? points
    : decodePolyline(route?.overview_polyline?.points ?? '');
}

// ── Pulse ring component (Reanimated, UI-thread) ───────────────
const PulseRing = () => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(2.2, { duration: 1500, easing: Easing.out(Easing.quad) }),
      -1,
      false,
    );
    opacity.value = withRepeat(
      withTiming(0, { duration: 1500, easing: Easing.out(Easing.quad) }),
      -1,
      false,
    );
  }, [scale, opacity]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.pulseRing, ringStyle]} />;
};

// ── Main Screen ────────────────────────────────────────────────

const CustomerTrackingScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<AuthStackParamList, 'CustomerTracking'>>();
  const insets = useSafeAreaInsets();

  const { orderId, customerCoords, customerAddress } = route.params;
  const destination: Coords = customerCoords;

  const {
    coords: agentCoords,
    heading,
    phase,
    isActive,
    isWaiting,
    isStale,
  } = useAgentTracking(orderId);

  // Android needs tracksViewChanges briefly so custom marker views render
  const [tracksBike, setTracksBike] = useState(true);
  useEffect(() => {
    if (!agentCoords) return;
    setTracksBike(true);
    const t = setTimeout(() => setTracksBike(false), 800);
    return () => clearTimeout(t);
  }, [agentCoords?.latitude, agentCoords?.longitude, heading]);

  const mapRef = useRef<MapView>(null);
  const fullRouteRef = useRef<Coords[]>([]);
  const [remainingPolyline, setRemainingPolyline] = useState<Coords[]>([]);
  const [totalDistance, setTotalDistance] = useState(0);
  const [etaText, setEtaText] = useState('Calculating...');
  const [distText, setDistText] = useState('');

  const prevPhaseRef = useRef(phase);
  const routeFetchedForPhase = useRef<string | null>(null);
  const fetchInFlight = useRef(false);
  const lastFetchAttempt = useRef(0);
  const deliveredAnim = useRef(new RNAnimated.Value(0)).current;
  const [showDelivered, setShowDelivered] = useState(false);

  const currentDest = useMemo<Coords>(
    () => (phase === 'to_hub' ? MEDICINE_HUB : destination),
    [phase, destination],
  );

  const applyRemainingRoute = useCallback((agentPos: Coords) => {
    const fullRoute = fullRouteRef.current;
    if (fullRoute.length < 2) {
      // Fallback straight line until Directions responds
      setRemainingPolyline([agentPos, currentDest]);
      return;
    }

    const { index, snapped } = snapToPolyline(agentPos, fullRoute);
    // Start the line from the snapped on-road point so it never cuts across
    // buildings between the agent's raw GPS and the route.
    const remaining = [snapped, ...fullRoute.slice(index + 1)];
    setRemainingPolyline(remaining);

    const remainingMeters = polylineLength(remaining);
    setDistText(
      remainingMeters > 1000
        ? `${(remainingMeters / 1000).toFixed(1)} km`
        : `${Math.round(remainingMeters)} m`,
    );
    const etaMin = Math.ceil(remainingMeters / (25000 / 60));
    setEtaText(etaMin > 1 ? `${etaMin} min` : '< 1 min');
  }, [currentDest]);

  // ── Fetch full road-accurate route (retries until it succeeds) ─
  const fetchRoute = useCallback(
    async (origin: Coords, dest: Coords, phaseKey: string) => {
      if (fetchInFlight.current) return;
      fetchInFlight.current = true;
      lastFetchAttempt.current = Date.now();
      try {
        const url =
          `https://maps.googleapis.com/maps/api/directions/json` +
          `?origin=${origin.latitude},${origin.longitude}` +
          `&destination=${dest.latitude},${dest.longitude}` +
          `&mode=driving&key=${GOOGLE_MAPS_KEY}`;

        const res = await fetch(url);
        const data = await res.json();

        if (data.status !== 'OK') {
          console.warn('[Tracking] Directions API:', data.status, data.error_message);
        }

        if (data.routes?.length > 0) {
          const leg = data.routes[0].legs[0];
          const points = extractDetailedRoute(data.routes[0]);
          fullRouteRef.current = points;
          setTotalDistance(leg.distance.value);
          setEtaText(leg.duration.text);
          setDistText(leg.distance.text);
          // Only lock the phase once we have a REAL road route
          routeFetchedForPhase.current = phaseKey;
          applyRemainingRoute(origin);
          return;
        }
      } catch (e) {
        console.warn('[Tracking] Route fetch failed:', e);
      } finally {
        fetchInFlight.current = false;
      }

      // Directions failed — show a temporary straight line but DO NOT lock
      // the phase, so the next location update retries the real route.
      if (fullRouteRef.current.length < 2) {
        fullRouteRef.current = [origin, dest];
        setTotalDistance(distanceBetween(origin, dest));
        applyRemainingRoute(origin);
      }
    },
    [applyRemainingRoute],
  );

  // Fetch route on first agent ping / phase change; trim on every move
  useEffect(() => {
    if (!agentCoords) return;

    const phaseChanged = prevPhaseRef.current !== phase;
    if (phaseChanged) {
      prevPhaseRef.current = phase;
      fullRouteRef.current = [];
      setRemainingPolyline([]);
      routeFetchedForPhase.current = null;
    }

    const hasRealRoute = routeFetchedForPhase.current === phase;

    if (!hasRealRoute) {
      // Retry at most every 4s to avoid hammering the Directions API
      const since = Date.now() - lastFetchAttempt.current;
      if (!fetchInFlight.current && (since > 4000 || fullRouteRef.current.length < 2)) {
        fetchRoute(agentCoords, currentDest, phase);
      }
      // Still trim whatever route we have (straight fallback or none)
      applyRemainingRoute(agentCoords);
      return;
    }

    applyRemainingRoute(agentCoords);
  }, [agentCoords, phase, currentDest, fetchRoute, applyRemainingRoute]);

  // ── Progress ratio for bar ───────────────────────────────────
  const progress = useMemo(() => {
    if (!agentCoords || totalDistance === 0) return 0;
    const remainingMeters =
      remainingPolyline.length >= 2
        ? polylineLength(remainingPolyline)
        : distanceBetween(agentCoords, currentDest);
    return Math.max(0, Math.min(1, 1 - remainingMeters / totalDistance));
  }, [agentCoords, currentDest, totalDistance, remainingPolyline]);

  // ── Camera follow ────────────────────────────────────────────
  useEffect(() => {
    if (!agentCoords || !mapRef.current) return;
    mapRef.current.animateCamera(
      { center: agentCoords, zoom: 15.5, pitch: 0, heading: 0 },
      { duration: 1000 },
    );
  }, [agentCoords]);

  // ── Fit markers on mount ─────────────────────────────────────
  const fitMap = useCallback(() => {
    if (!agentCoords || !mapRef.current) return;
    const points = [agentCoords, currentDest];
    if (phase === 'to_hub') points.push(MEDICINE_HUB);
    mapRef.current.fitToCoordinates(points, {
      edgePadding: { top: 120, bottom: 320, left: 60, right: 60 },
      animated: true,
    });
  }, [agentCoords, currentDest, phase]);

  useEffect(() => {
    if (agentCoords) {
      const timer = setTimeout(fitMap, 600);
      return () => clearTimeout(timer);
    }
  }, [agentCoords !== null]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Delivery complete (only after we had live location) ──────
  useEffect(() => {
    if (!isActive && !isWaiting && agentCoords) {
      setShowDelivered(true);
      RNAnimated.spring(deliveredAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    }
  }, [isActive, isWaiting, agentCoords, deliveredAnim]);

  const deliveredScale = deliveredAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  // ── Phase display info ───────────────────────────────────────
  const phaseInfo = useMemo(() => {
    if (isWaiting || !agentCoords) {
      return {
        title: 'Waiting for delivery agent',
        subtitle: 'Live location will appear once agent starts',
        icon: 'hourglass-outline' as const,
        color: colors.textMuted,
      };
    }
    if (phase === 'to_hub') {
      return {
        title: 'Picking up your medicines',
        subtitle: 'Agent is heading to Sneheal Hub',
        icon: 'medkit' as const,
        color: colors.warning,
      };
    }
    return {
      title: 'On the way to you!',
      subtitle: 'Medicines picked up — arriving soon',
      icon: 'bicycle' as const,
      color: colors.primary,
    };
  }, [phase, isWaiting, agentCoords]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      {/* ── Map ─────────────────────────────────────────── */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        initialRegion={{
          latitude: destination.latitude,
          longitude: destination.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        mapPadding={{ top: insets.top + 70, bottom: 280, left: 0, right: 0 }}
      >
        {/* Customer destination marker */}
        <Marker coordinate={destination} anchor={{ x: 0.5, y: 1 }}>
          <View style={styles.destPin}>
            <Ionicons name="home" size={16} color="#fff" />
          </View>
        </Marker>

        {/* Hub marker — visible during to_hub, faded during to_customer */}
        <Marker
          coordinate={MEDICINE_HUB}
          anchor={{ x: 0.5, y: 1 }}
          opacity={phase === 'to_hub' ? 1 : 0.35}
        >
          <View
            style={[
              styles.hubPin,
              phase === 'to_customer' && { backgroundColor: '#94A3B8' },
            ]}
          >
            <Ionicons name="medkit" size={14} color="#fff" />
            {phase === 'to_customer' && (
              <View style={styles.hubCheck}>
                <Ionicons name="checkmark" size={8} color="#fff" />
              </View>
            )}
          </View>
        </Marker>

        {/* Bike marker — plain Marker + live coords (reliable on Android) */}
        {agentCoords && (
          <Marker
            key={`agent-${agentCoords.latitude.toFixed(5)}-${agentCoords.longitude.toFixed(5)}`}
            coordinate={agentCoords}
            anchor={{ x: 0.5, y: 0.5 }}
            flat
            rotation={heading}
            tracksViewChanges={tracksBike}
          >
            <View style={styles.bikeMarkerWrap} pointerEvents="none">
              <PulseRing />
              <View style={styles.bikeMarker}>
                <Ionicons name="bicycle" size={18} color="#fff" />
              </View>
            </View>
          </Marker>
        )}

        {/* Route polyline — key forces native redraw on Android */}
        {remainingPolyline.length > 1 && (
          <Polyline
            key={`route-${phase}-${remainingPolyline.length}-${remainingPolyline[0].latitude.toFixed(5)}-${remainingPolyline[0].longitude.toFixed(5)}`}
            coordinates={remainingPolyline}
            strokeColor={colors.primary}
            strokeWidth={5}
            lineCap="round"
            lineJoin="round"
          />
        )}
      </MapView>

      {/* ── Top bar ──────────────────────────────────────── */}
      <View style={[styles.topBar, { top: insets.top + spacing.sm }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.topTitle}>Live Tracking</Text>
        <Pressable onPress={fitMap} style={styles.backBtn}>
          <Ionicons name="locate" size={20} color={colors.textPrimary} />
        </Pressable>
      </View>

      {/* ── Stale indicator ──────────────────────────────── */}
      {isStale && isActive && (
        <View style={[styles.staleBanner, { top: insets.top + 72 }]}>
          <Ionicons name="time-outline" size={14} color={colors.warning} />
          <Text style={styles.staleText}>Updating location...</Text>
        </View>
      )}

      {/* ── Bottom card ──────────────────────────────────── */}
      {!showDelivered && (
        <View style={[styles.bottomCard, { paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.sheetHandle} />

          {/* Phase header */}
          <View style={styles.phaseRow}>
            <View style={[styles.phaseIcon, { backgroundColor: phaseInfo.color + '18' }]}>
              <Ionicons name={phaseInfo.icon} size={22} color={phaseInfo.color} />
            </View>
            <View style={styles.phaseTextWrap}>
              <Text style={styles.phaseTitle}>{phaseInfo.title}</Text>
              <Text style={styles.phaseSubtitle}>{phaseInfo.subtitle}</Text>
            </View>
          </View>

          {/* Progress bar */}
          <TrackingProgressBar phase={phase} progress={progress} />

          {/* ETA strip */}
          <View style={styles.etaStrip}>
            <View style={styles.etaItem}>
              <Ionicons name="time-outline" size={18} color={colors.primary} />
              <View>
                <Text style={styles.etaValue}>{etaText}</Text>
                <Text style={styles.etaLabel}>Estimated time</Text>
              </View>
            </View>
            <View style={styles.etaDivider} />
            <View style={styles.etaItem}>
              <Ionicons name="navigate-outline" size={18} color={colors.primary} />
              <View>
                <Text style={styles.etaValue}>{distText || '—'}</Text>
                <Text style={styles.etaLabel}>Distance</Text>
              </View>
            </View>
          </View>

          {/* Delivery address */}
          <View style={styles.addressRow}>
            <View style={styles.addressDot} />
            <Text style={styles.addressText} numberOfLines={2}>
              {customerAddress}
            </Text>
          </View>
        </View>
      )}

      {/* ── Delivered overlay ────────────────────────────── */}
      {showDelivered && (
        <View style={styles.deliveredOverlay}>
          <RNAnimated.View
            style={[
              styles.deliveredCard,
              { transform: [{ scale: deliveredScale }], opacity: deliveredAnim },
            ]}
          >
            <View style={styles.deliveredIcon}>
              <Ionicons name="checkmark-circle" size={56} color={colors.success} />
            </View>
            <Text style={styles.deliveredTitle}>Medicines Delivered!</Text>
            <Text style={styles.deliveredSubtitle}>
              Your order has been delivered successfully
            </Text>
            <Pressable
              onPress={() => navigation.goBack()}
              style={styles.deliveredBtn}
            >
              <Text style={styles.deliveredBtnText}>Done</Text>
            </Pressable>
          </RNAnimated.View>
        </View>
      )}
    </View>
  );
};

// ── Styles ──────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  map: { ...StyleSheet.absoluteFillObject },

  // Top bar
  topBar: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    ...shadows.md,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  // Stale banner
  staleBanner: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.warningLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
  },
  staleText: {
    ...typography.caption,
    color: colors.warning,
    fontWeight: '600',
  },

  // Markers
  destPin: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  hubPin: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.warning,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  hubCheck: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  bikeMarkerWrap: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bikeMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#fff',
    ...shadows.md,
    zIndex: 2,
  },
  pulseRing: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
  },

  // Bottom card
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.xl,
    ...shadows.lg,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.lg,
  },

  // Phase header
  phaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  phaseIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseTextWrap: { flex: 1 },
  phaseTitle: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  phaseSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // ETA strip
  etaStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  etaItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  etaDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },
  etaValue: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  etaLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 10,
  },

  // Address
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  addressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  addressText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },

  // Delivered overlay
  deliveredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  deliveredCard: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.xxl,
    padding: spacing.xxxl,
    alignItems: 'center',
    marginHorizontal: spacing.xl,
    width: '85%',
    ...shadows.lg,
  },
  deliveredIcon: {
    marginBottom: spacing.lg,
  },
  deliveredTitle: {
    ...typography.h3,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  deliveredSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  deliveredBtn: {
    width: '100%',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md + 2,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  deliveredBtnText: {
    ...typography.button,
    color: '#fff',
    fontSize: 16,
  },
});

export default CustomerTrackingScreen;
