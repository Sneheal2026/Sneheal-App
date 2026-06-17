import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  Linking,
  Text,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapView from 'react-native-maps';
import { useLocationPermission } from '@/hooks/useLocationPermission';
import { useReverseGeocode } from '@/hooks/useReverseGeocode';
import CenterMapPin from '@/components/location/CenterMapPin';
import CurrentLocationButton from '@/components/location/CurrentLocationButton';
import LocationPreviewCard from '@/components/location/LocationPreviewCard';
import AddressDetailsSheet, { AddressFormData } from '@/components/location/AddressDetailsSheet';
import { saveDeliveryAddress } from '@/services/addressStorage';
import { resolveInitialMapRegion, buildRegion, type MapRegion } from '@/services/mapLocationInit';
import type { DeliveryAddress } from '@/types/address';
import theme from '@/styles/theme';

const { colors, spacing, shadows, moderateScale, typography } = theme;
const MIN_MOVE_METERS_FOR_GEOCODE = 35;

type ScreenPhase =
  | { status: 'loading' }
  | { status: 'ready'; region: MapRegion };

const LOADING_MESSAGE = 'Finding your location...';

function distanceInMeters(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
  return 2 * earthRadius * Math.asin(Math.sqrt(h));
}

const SelectLocationScreen: React.FC = () => {
  const navigation = useNavigation();
  const mapRef = useRef<MapView | null>(null);
  const centerRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const lastGeocodedCenterRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const skipNextRegionGeocode = useRef(true);

  const { getCurrentLocation } = useLocationPermission();
  const { address, isGeocoding, reverseGeocode } = useReverseGeocode();

  const [phase, setPhase] = useState<ScreenPhase>({ status: 'loading' });
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isSheetVisible, setIsSheetVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const result = await resolveInitialMapRegion();
      if (cancelled) return;

      const center = {
        latitude: result.region.latitude,
        longitude: result.region.longitude,
      };

      centerRef.current = center;
      lastGeocodedCenterRef.current = center;
      skipNextRegionGeocode.current = true;
      setPermissionDenied(result.permissionDenied);

      setPhase({
        status: 'ready',
        region: result.region,
      });

      reverseGeocode(center, { immediate: true });
    })();

    return () => {
      cancelled = true;
    };
  }, [reverseGeocode]);

  const goToCoords = useCallback((latitude: number, longitude: number) => {
    const nextCenter = { latitude, longitude };
    centerRef.current = nextCenter;
    lastGeocodedCenterRef.current = nextCenter;
    skipNextRegionGeocode.current = true;
    mapRef.current?.animateToRegion(buildRegion(latitude, longitude), 300);
    reverseGeocode(nextCenter, { immediate: true });
  }, [reverseGeocode]);

  const handleRegionChangeComplete = useCallback((newRegion: MapRegion) => {
    const nextCenter = { latitude: newRegion.latitude, longitude: newRegion.longitude };
    centerRef.current = nextCenter;
    if (skipNextRegionGeocode.current) {
      skipNextRegionGeocode.current = false;
      return;
    }

    const lastGeocoded = lastGeocodedCenterRef.current;
    if (lastGeocoded) {
      const movedDistance = distanceInMeters(lastGeocoded, nextCenter);
      if (movedDistance < MIN_MOVE_METERS_FOR_GEOCODE) {
        return;
      }
    }

    lastGeocodedCenterRef.current = nextCenter;
    reverseGeocode(nextCenter);
  }, [reverseGeocode]);

  const handleCurrentLocation = async () => {
    const location = await getCurrentLocation({
      timeoutMs: 7000,
      accuracy: Location.Accuracy.High,
      maxLastKnownAgeMs: 60 * 1000,
      maxLastKnownAccuracyM: 50,
    });
    if (location) {
      setPermissionDenied(false);
      goToCoords(location.coords.latitude, location.coords.longitude);
      return;
    }
    setPermissionDenied(true);
  };

  const handleSaveAddress = async (formData: AddressFormData) => {
    const center = centerRef.current;
    if (!center) return;

    const { latitude, longitude } = center;
    try {
      const deliveryAddress: DeliveryAddress = {
        latitude,
        longitude,
        areaName: formData.areaName,
        formattedAddress: address?.formattedAddress || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        locality: address?.locality || formData.areaName,
        postalCode: address?.postalCode,
        flatHouse: formData.flatHouse,
        landmark: formData.landmark,
        receiverName: formData.receiverName,
        phone: formData.phone,
        label: formData.label,
        savedAt: new Date().toISOString(),
      };
      await saveDeliveryAddress(deliveryAddress);
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to save address. Please try again.');
    }
  };

  const displayAreaName = address?.areaName || 'Move map to select location';
  const displayAddress = address?.formattedAddress || 'Pan the map and place the pin on your delivery spot';

  if (phase.status === 'loading') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.topControls}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.fullLoader}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loaderTitle}>{LOADING_MESSAGE}</Text>
          <Text style={styles.loaderSubtitle}>This will only take a moment</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={phase.region}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
      />

      <CenterMapPin />

      <View style={styles.topControls}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {permissionDenied && (
        <View style={styles.permissionCard}>
          <Text style={styles.permissionTitle}>Location permission denied</Text>
          <Text style={styles.permissionText}>You can still move the map to pick your address.</Text>
          <TouchableOpacity style={styles.settingsButton} onPress={() => Linking.openSettings()}>
            <Text style={styles.settingsButtonText}>Open Settings</Text>
          </TouchableOpacity>
        </View>
      )}

      {!isSheetVisible && (
        <View style={styles.bottomSection}>
          <CurrentLocationButton onPress={handleCurrentLocation} />
          <View style={styles.sheetWrapper}>
            <LocationPreviewCard
              areaName={displayAreaName}
              formattedAddress={displayAddress}
              isLoading={isGeocoding && !address}
              isUpdating={isGeocoding && !!address}
              confirmDisabled={!address}
              onConfirm={() => setIsSheetVisible(true)}
            />
          </View>
        </View>
      )}

      <AddressDetailsSheet
        isVisible={isSheetVisible}
        detectedAreaName={address?.areaName}
        onClose={() => setIsSheetVisible(false)}
        onSave={handleSaveAddress}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  map: { ...StyleSheet.absoluteFillObject },
  fullLoader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  loaderTitle: {
    ...typography.body,
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  loaderSubtitle: {
    ...typography.body,
    fontSize: moderateScale(13),
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  topControls: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? spacing.md : spacing.lg,
    left: spacing.xl,
    zIndex: 10,
  },
  backButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: spacing.md,
    zIndex: 10,
  },
  sheetWrapper: {
    alignSelf: 'stretch',
  },
  permissionCard: {
    position: 'absolute',
    top: 80,
    left: spacing.xl,
    right: spacing.xl,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    ...shadows.md,
    zIndex: 20,
  },
  permissionTitle: {
    fontSize: moderateScale(15),
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  permissionText: {
    fontSize: moderateScale(13),
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  settingsButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  settingsButtonText: { fontSize: moderateScale(13), fontWeight: '600', color: colors.white },
});

export default SelectLocationScreen;
