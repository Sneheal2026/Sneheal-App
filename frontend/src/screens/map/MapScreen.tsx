import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Platform,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Loader from '@/components/common/Loader';
import { fetchLiveLocation, reverseGeocodeGoogle } from '@/services/locationService';
import type { Coordinates } from '@/types/location.types';
import type { AuthStackParamList } from '@/navigation/types';
import theme from '@/styles/theme';

const { colors, spacing, typography, moderateScale, shadows } = theme;

const DELTA = { latitudeDelta: 0.004, longitudeDelta: 0.004 };
const GEOCODE_DEBOUNCE_MS = 450;

const MapScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList, 'LocationMap'>>();
  const route = useRoute<RouteProp<AuthStackParamList, 'LocationMap'>>();

  const editAddress = route.params?.editAddress;

  const mapRef = useRef<MapView>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pinCoords, setPinCoords] = useState<Coordinates | null>(null);
  const [addressLine, setAddressLine] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      if (editAddress) {
        setPinCoords(editAddress.coords);
        setAddressLine(editAddress.addressLine);
        setLoading(false);
        return;
      }

      try {
        const result = await fetchLiveLocation();
        if (!cancelled) {
          setPinCoords(result.coords);
          setAddressLine(result.addressLine);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Unable to get location');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void init();
    return () => { cancelled = true; };
  }, [editAddress]);

  const geocodeCenter = useCallback((coords: Coordinates) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      setIsGeocoding(true);
      const result = await reverseGeocodeGoogle(coords);
      setAddressLine(result);
      setIsGeocoding(false);
    }, GEOCODE_DEBOUNCE_MS);
  }, []);

  const handleRegionChangeComplete = useCallback(
    (region: Region) => {
      const coords: Coordinates = {
        latitude: region.latitude,
        longitude: region.longitude,
      };
      setPinCoords(coords);
      geocodeCenter(coords);
      setIsDragging(false);
    },
    [geocodeCenter],
  );

  const handleRelocate = useCallback(async () => {
    try {
      const result = await fetchLiveLocation();
      setPinCoords(result.coords);
      setAddressLine(result.addressLine);
      mapRef.current?.animateToRegion(
        { ...result.coords, ...DELTA },
        400,
      );
    } catch {
      // GPS unavailable — stay on current pin
    }
  }, []);

  const handleConfirm = useCallback(() => {
    if (!pinCoords || isGeocoding) return;

    navigation.navigate('AddressDetails', {
      draft: { coords: pinCoords, addressLine },
      editAddress: editAddress ?? undefined,
    });
  }, [navigation, pinCoords, addressLine, isGeocoding, editAddress]);

  if (loading) {
    return <Loader message="Fetching your location..." />;
  }

  if (error || !pinCoords) {
    return (
      <SafeAreaView style={styles.errorSafe} edges={['top']}>
        <View style={styles.errorContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={moderateScale(22)} color={colors.textPrimary} />
          </TouchableOpacity>
          <Ionicons
            name="location-outline"
            size={moderateScale(48)}
            color={colors.textMuted}
            style={styles.errorIcon}
          />
          <Text style={styles.errorTitle}>Location unavailable</Text>
          <Text style={styles.errorMessage}>
            {error ?? 'Please enable location permissions and try again.'}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setLoading(true);
              void fetchLiveLocation()
                .then((r) => { setPinCoords(r.coords); setAddressLine(r.addressLine); })
                .catch((e) => setError(e instanceof Error ? e.message : 'Unable to get location'))
                .finally(() => setLoading(false));
            }}
          >
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_GOOGLE}
        initialRegion={{ ...pinCoords, ...DELTA }}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        mapPadding={{ top: 0, right: 0, bottom: 220, left: 0 }}
        onRegionChange={() => { if (!isDragging) setIsDragging(true); }}
        onRegionChangeComplete={handleRegionChangeComplete}
      />

      {/* ── Fixed center pin ── */}
      <View style={styles.pinWrapper} pointerEvents="none">
        <Ionicons
          name="location-sharp"
          size={moderateScale(40)}
          color={colors.primary}
          style={isDragging ? styles.pinLifted : undefined}
        />
        <View style={styles.pinShadow} />
      </View>

      {/* ── Top bar: back + relocate ── */}
      <SafeAreaView style={styles.topBar} edges={['top']} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.circleButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={moderateScale(20)} color={colors.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.circleButton}
          onPress={handleRelocate}
          accessibilityRole="button"
          accessibilityLabel="Centre on my location"
        >
          <Ionicons name="locate" size={moderateScale(20)} color={colors.primary} />
        </TouchableOpacity>
      </SafeAreaView>

      {/* ── Bottom card: address + confirm ── */}
      <SafeAreaView style={styles.bottomSafe} edges={['bottom']} pointerEvents="box-none">
        <View style={styles.bottomCard}>
          <View style={styles.addressRow}>
            <Ionicons name="location-sharp" size={moderateScale(18)} color={colors.primary} />
            <View style={styles.addressContent}>
              {isGeocoding ? (
                <View style={styles.geocodingRow}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.geocodingText}>Finding address...</Text>
                </View>
              ) : (
                <Text style={styles.addressText} numberOfLines={2}>
                  {addressLine}
                </Text>
              )}
            </View>
          </View>

          <Text style={styles.helpText}>
            Move the map to adjust your delivery pinpoint
          </Text>

          <TouchableOpacity
            style={[styles.confirmButton, (isGeocoding) && styles.confirmDisabled]}
            onPress={handleConfirm}
            disabled={isGeocoding}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Confirm this location"
          >
            <Text style={styles.confirmText}>Confirm location</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ── Center pin ──
  pinWrapper: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -moderateScale(20),
    marginTop: -moderateScale(40) - 110,
    alignItems: 'center',
    zIndex: 10,
  },
  pinLifted: {
    transform: [{ translateY: -6 }],
  },
  pinShadow: {
    width: 10,
    height: 4,
    borderRadius: 5,
    backgroundColor: 'rgba(0,0,0,0.2)',
    marginTop: -2,
  },

  // ── Top bar ──
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  circleButton: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(21),
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },

  // ── Bottom card ──
  bottomSafe: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  bottomCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    ...shadows.lg,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  addressContent: {
    flex: 1,
  },
  addressText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  geocodingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  geocodingText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  helpText: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    borderRadius: moderateScale(12),
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDisabled: {
    opacity: 0.5,
  },
  confirmText: {
    ...typography.button,
    color: colors.textInverse,
  },

  // ── Error state ──
  errorSafe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
  },
  backButton: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(12),
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxxl,
    ...shadows.sm,
  },
  errorIcon: {
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  errorTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  errorMessage: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  retryButton: {
    alignSelf: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.sm + 2,
    borderRadius: moderateScale(10),
  },
  retryText: {
    ...typography.bodySmall,
    color: colors.textInverse,
    fontWeight: '600',
  },
});

export default MapScreen;
