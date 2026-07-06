import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  Platform,
  StatusBar,
  Animated as RNAnimated,
  Linking,
} from 'react-native';
import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
  AnimatedRegion,
} from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import type { RouteProp } from '@react-navigation/native';
import type { AuthStackParamList } from '@/navigation/types';
import { deliveryTheme } from '@/components/delivery/deliveryTheme';
import { updateAgentLocation, clearOrderTracking } from '@/services/firebase';
import theme from '@/styles/theme';
import { GOOGLE_MAPS_KEY } from '@/constants/googleMaps';

const { spacing, typography, borderRadius, shadows } = theme;

// ── Fixed medicine hub (Pune) ────────────────────────────────────
const MEDICINE_HUB = {
  latitude: 18.6729,
  longitude: 78.1047,
  title: 'Sneheal Medicine Hub',
};

// ── Helpers ──────────────────────────────────────────────────────

type Phase = 'to_hub' | 'to_customer';

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
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function snapToPolyline(point: Coords, polyline: Coords[]): { index: number; snapped: Coords } {
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

function projectOnSegment(p: Coords, a: Coords, b: Coords): Coords {
  const dx = b.longitude - a.longitude;
  const dy = b.latitude - a.latitude;
  if (dx === 0 && dy === 0) return a;
  let t = ((p.longitude - a.longitude) * dx + (p.latitude - a.latitude) * dy) / (dx * dx + dy * dy);
  t = Math.max(0, Math.min(1, t));
  return { latitude: a.latitude + t * dy, longitude: a.longitude + t * dx };
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
    // Avoid duplicating the shared vertex between consecutive steps
    if (points.length > 0 && decoded.length > 0) decoded.shift();
    points.push(...decoded);
  }
  return points.length > 1
    ? points
    : decodePolyline(route?.overview_polyline?.points ?? '');
}

// ── Constants ────────────────────────────────────────────────────
const HUB_REACHED_DISTANCE = 60; // meters
const ANIMATION_DURATION = 400; // ms

// ── Main Screen ──────────────────────────────────────────────────

const DeliveryNavigationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<AuthStackParamList, 'DeliveryNavigation'>>();
  const insets = useSafeAreaInsets();

  const { orderId, customerAddress, customerCoords } = route.params;

  const destination = useMemo<Coords>(
    () =>
      customerCoords ?? {
        latitude: 18.6725,
        longitude: 78.0941,
      },
    [customerCoords],
  );

  const [phase, setPhase] = useState<Phase>('to_hub');
  const [remainingPolyline, setRemainingPolyline] = useState<Coords[]>([]);
  const [agentPosition, setAgentPosition] = useState<Coords | null>(null);
  const [heading, setHeading] = useState(0);
  const [showHubSheet, setShowHubSheet] = useState(false);
  const [etaText, setEtaText] = useState('');
  const [distText, setDistText] = useState('');

  const mapRef = useRef<MapView>(null);
  const animatedCoord = useRef(
    new AnimatedRegion({ latitude: 0, longitude: 0, latitudeDelta: 0.001, longitudeDelta: 0.001 }),
  ).current;
  const locationSub = useRef<Location.LocationSubscription | null>(null);
  const sheetAnim = useRef(new RNAnimated.Value(0)).current;

  // ── Refs to avoid stale closures inside GPS watcher ────────────
  const routeRef = useRef<Coords[]>([]);
  const phaseRef = useRef<Phase>('to_hub');
  const hubSheetShownRef = useRef(false);
  const headingRef = useRef(0);

  const currentDestination = useMemo(
    () => (phase === 'to_hub' ? MEDICINE_HUB : destination),
    [phase, destination],
  );

  // ── Fetch route from Directions API ────────────────────────────
  const fetchRoute = useCallback(
    async (origin: Coords, dest: Coords) => {
      try {
        const url =
          `https://maps.googleapis.com/maps/api/directions/json` +
          `?origin=${origin.latitude},${origin.longitude}` +
          `&destination=${dest.latitude},${dest.longitude}` +
          `&mode=driving` +
          `&key=${GOOGLE_MAPS_KEY}`;

        const res = await fetch(url);
        const data = await res.json();

        if (__DEV__ && data.status !== 'OK') {
          console.warn('[DeliveryNav] Directions API:', data.status, data.error_message);
        }

        if (data.routes?.length > 0) {
          const leg = data.routes[0].legs[0];
          const points = extractDetailedRoute(data.routes[0]);
          routeRef.current = points;
          setRemainingPolyline(points);
          setEtaText(leg.duration.text);
          setDistText(leg.distance.text);
        }
      } catch (e) {
        if (__DEV__) console.warn('[DeliveryNav] Route fetch failed:', e);
      }
    },
    [],
  );

  // ── Core: called on every GPS tick (reads refs, never stale) ───
  const handleLocationUpdate = useCallback(
    (loc: Location.LocationObject) => {
      const newPos: Coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      const newHeading = loc.coords.heading ?? 0;
      headingRef.current = newHeading;

      setAgentPosition(newPos);
      setHeading(newHeading);

      // Animate marker
      (animatedCoord as any)
        .timing({
          ...newPos,
          latitudeDelta: 0.001,
          longitudeDelta: 0.001,
          duration: ANIMATION_DURATION,
          useNativeDriver: false,
          toValue: 0,
        })
        .start();

      mapRef.current?.animateCamera(
        { center: newPos, heading: newHeading, zoom: 17, pitch: 20 },
        { duration: ANIMATION_DURATION },
      );

      // Trim polyline — always starts exactly at agent position
      const fullRoute = routeRef.current;
      if (fullRoute.length >= 2) {
        const { index, snapped } = snapToPolyline(newPos, fullRoute);
        // Start from the snapped on-road point so the line hugs the road
        // instead of cutting straight across buildings from raw GPS.
        const remaining = [snapped, ...fullRoute.slice(index + 1)];
        setRemainingPolyline(remaining);

        // Update remaining distance
        let totalDist = 0;
        for (let i = 0; i < remaining.length - 1; i++) {
          totalDist += distanceBetween(remaining[i], remaining[i + 1]);
        }
        setDistText(
          totalDist > 1000
            ? `${(totalDist / 1000).toFixed(1)} km`
            : `${Math.round(totalDist)} m`,
        );

        // Estimate ETA (assume ~25 km/h avg for city delivery)
        const etaMin = Math.ceil(totalDist / (25000 / 60));
        setEtaText(etaMin > 1 ? `${etaMin} min` : '< 1 min');
      }

      // Check hub arrival
      if (phaseRef.current === 'to_hub' && !hubSheetShownRef.current) {
        const distToHub = distanceBetween(newPos, MEDICINE_HUB);
        if (distToHub <= HUB_REACHED_DISTANCE) {
          hubSheetShownRef.current = true;
          setShowHubSheet(true);
          RNAnimated.spring(sheetAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 50,
            friction: 9,
          }).start();
        }
      }

      // Firebase write (fire-and-forget)
      updateAgentLocation(orderId, {
        lat: newPos.latitude,
        lng: newPos.longitude,
        heading: newHeading,
        updatedAt: Date.now(),
        phase: phaseRef.current,
      }).catch((err) => {
        if (__DEV__) console.warn('[DeliveryNav] Firebase write failed:', err);
      });
    },
    [animatedCoord, orderId, sheetAnim],
  );

  // Keep a ref so the watcher always calls the latest version
  const handleLocationUpdateRef = useRef(handleLocationUpdate);
  handleLocationUpdateRef.current = handleLocationUpdate;

  // ── Start GPS tracking (runs once) ─────────────────────────────
  useEffect(() => {
    let mounted = true;

    const startTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || !mounted) return;

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      if (!mounted) return;

      const pos: Coords = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      };
      setAgentPosition(pos);
      animatedCoord.setValue({ ...pos, latitudeDelta: 0.001, longitudeDelta: 0.001 });

      await fetchRoute(pos, MEDICINE_HUB);

      if (!mounted) return;

      locationSub.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 5,
          timeInterval: 3000,
        },
        (loc) => {
          if (!mounted) return;
          handleLocationUpdateRef.current(loc);
        },
      );
    };

    startTracking();

    return () => {
      mounted = false;
      locationSub.current?.remove();
      locationSub.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Switch to customer phase ───────────────────────────────────
  const handleGoToCustomer = useCallback(async () => {
    setShowHubSheet(false);
    hubSheetShownRef.current = false;
    RNAnimated.timing(sheetAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();

    phaseRef.current = 'to_customer';
    setPhase('to_customer');
    routeRef.current = [];
    setRemainingPolyline([]);

    if (agentPosition) {
      await fetchRoute(agentPosition, destination);
    }
  }, [agentPosition, destination, fetchRoute, sheetAnim]);

  // ── Open Google Maps for turn-by-turn ──────────────────────────
  const openGoogleMaps = useCallback(() => {
    const dest = currentDestination;
    const url = Platform.select({
      ios: `comgooglemaps://?daddr=${dest.latitude},${dest.longitude}&directionsmode=driving`,
      android: `google.navigation:q=${dest.latitude},${dest.longitude}&mode=d`,
    });
    const fallback = `https://www.google.com/maps/dir/?api=1&destination=${dest.latitude},${dest.longitude}&travelmode=driving`;

    if (url) {
      Linking.canOpenURL(url).then((supported) => {
        Linking.openURL(supported ? url : fallback);
      });
    }
  }, [currentDestination]);

  // ── Finish delivery ────────────────────────────────────────────
  const handleDelivered = useCallback(() => {
    locationSub.current?.remove();
    clearOrderTracking(orderId);
    navigation.goBack();
  }, [orderId, navigation]);

  // ── Sheet translate ────────────────────────────────────────────
  const sheetTranslateY = sheetAnim.interpolate({ inputRange: [0, 1], outputRange: [300, 0] });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      {/* ── Map ─────────────────────────────────── */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_GOOGLE}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        initialRegion={{
          latitude: agentPosition?.latitude ?? MEDICINE_HUB.latitude,
          longitude: agentPosition?.longitude ?? MEDICINE_HUB.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        mapPadding={{ top: insets.top + 80, bottom: 180, left: 0, right: 0 }}
      >
        {/* Destination marker */}
        <Marker
          coordinate={currentDestination}
          anchor={{ x: 0.5, y: 1 }}
        >
          <View style={styles.destPin}>
            <Ionicons
              name={phase === 'to_hub' ? 'medkit' : 'home'}
              size={18}
              color="#fff"
            />
          </View>
        </Marker>

        {/* Hub marker (always visible) */}
        {phase === 'to_customer' && (
          <Marker coordinate={MEDICINE_HUB} anchor={{ x: 0.5, y: 1 }} opacity={0.5}>
            <View style={[styles.destPin, { backgroundColor: '#64748B' }]}>
              <Ionicons name="medkit" size={14} color="#fff" />
            </View>
          </Marker>
        )}

        {/* Agent animated marker */}
        {agentPosition && (
          <Marker.Animated
            coordinate={animatedCoord as any}
            anchor={{ x: 0.5, y: 0.5 }}
            flat
            rotation={heading}
          >
            <View style={styles.agentMarker}>
              <View style={styles.agentDot} />
            </View>
          </Marker.Animated>
        )}

        {/* Route polyline — key forces native redraw on Android */}
        {remainingPolyline.length > 1 && (
          <Polyline
            key={`route-${remainingPolyline.length}-${remainingPolyline[0].latitude.toFixed(6)}`}
            coordinates={remainingPolyline}
            strokeColor={deliveryTheme.accent}
            strokeWidth={5}
            lineCap="round"
            lineJoin="round"
          />
        )}
      </MapView>

      {/* ── Top bar ────────────────────────────── */}
      <View style={[styles.topBar, { top: insets.top + spacing.sm }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.textPrimary} />
        </Pressable>
        <View style={styles.topInfo}>
          <Text style={styles.phaseLabel}>
            {phase === 'to_hub' ? 'Heading to Medicine Hub' : `Delivering to customer`}
          </Text>
          <Text style={styles.orderLabel}>{orderId}</Text>
        </View>
      </View>

      {/* ── Bottom info card ──────────────────── */}
      {!showHubSheet && (
        <View style={[styles.bottomCard, { paddingBottom: insets.bottom + spacing.md }]}>
          <View style={styles.etaRow}>
            <View>
              <Text style={styles.etaValue}>{etaText || '—'}</Text>
              <Text style={styles.etaLabel}>{distText || 'Calculating...'}</Text>
            </View>
            <Pressable onPress={openGoogleMaps} style={styles.navBtn}>
              <Ionicons name="navigate" size={20} color="#fff" />
              <Text style={styles.navBtnText}>Google Maps</Text>
            </Pressable>
          </View>

          {phase === 'to_customer' && (
            <Pressable onPress={handleDelivered} style={styles.deliveredBtn}>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.deliveredBtnText}>Mark Delivered</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* ── Hub reached bottom sheet ──────────── */}
      {showHubSheet && (
        <RNAnimated.View
          style={[
            styles.hubSheet,
            { paddingBottom: insets.bottom + spacing.lg, transform: [{ translateY: sheetTranslateY }] },
          ]}
        >
          <View style={styles.sheetHandle} />
          <View style={styles.hubIconWrap}>
            <Ionicons name="checkmark-circle" size={48} color={deliveryTheme.online} />
          </View>
          <Text style={styles.hubTitle}>You reached the Medicine Hub!</Text>
          <Text style={styles.hubSubtitle}>
            Collect medicines for order {orderId} and continue to customer.
          </Text>
          <Pressable onPress={handleGoToCustomer} style={styles.goCustomerBtn}>
            <Ionicons name="navigate" size={20} color="#fff" />
            <Text style={styles.goCustomerText}>Go to Customer Location</Text>
          </Pressable>
        </RNAnimated.View>
      )}
    </View>
  );
};

// ── Styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  topBar: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    ...shadows.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  topInfo: { flex: 1 },
  phaseLabel: { ...typography.body, fontWeight: '700', color: theme.colors.textPrimary },
  orderLabel: { ...typography.caption, color: theme.colors.textSecondary, marginTop: 2 },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    padding: spacing.lg,
    ...shadows.lg,
  },
  etaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  etaValue: { ...typography.h3, fontWeight: '700', color: theme.colors.textPrimary },
  etaLabel: { ...typography.caption, color: theme.colors.textSecondary, marginTop: 2 },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: deliveryTheme.accent,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  navBtnText: { ...typography.button, color: '#fff', fontSize: 14 },
  deliveredBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    backgroundColor: deliveryTheme.online,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  deliveredBtnText: { ...typography.button, color: '#fff', fontSize: 15 },
  destPin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: deliveryTheme.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  agentMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(37,99,235,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#2563EB',
    borderWidth: 2,
    borderColor: '#fff',
  },
  hubSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.lg,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    marginBottom: spacing.lg,
  },
  hubIconWrap: { marginBottom: spacing.md },
  hubTitle: { ...typography.h3, fontWeight: '700', color: theme.colors.textPrimary, textAlign: 'center' },
  hubSubtitle: {
    ...typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  goCustomerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    width: '100%',
    backgroundColor: deliveryTheme.accent,
    paddingVertical: spacing.md + 2,
    borderRadius: borderRadius.lg,
  },
  goCustomerText: { ...typography.button, color: '#fff', fontSize: 16 },
});

export default DeliveryNavigationScreen;
