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
import { useLocationPermission } from '@/hooks/useLocationPermission';
import { useReverseGeocode } from '@/hooks/useReverseGeocode';
import CenterMapPin from '@/components/location/CenterMapPin';
import CurrentLocationButton from '@/components/location/CurrentLocationButton';
import LocationPreviewCard from '@/components/location/LocationPreviewCard';
import AddressDetailsSheet, { AddressFormData } from '@/components/location/AddressDetailsSheet';
import { saveDeliveryAddress } from '@/services/addressStorage';
import { resolveInitialMapRegion, type MapRegion } from '@/services/mapLocationInit';
import type { DeliveryAddress } from '@/types/address';
import theme from '@/styles/theme';

const { colors, spacing, shadows, moderateScale, typography } = theme;

type ScreenPhase =
  | { status: 'loading' }
  | { status: 'ready'; region: MapRegion; permissionDenied: boolean };

const LOADING_MESSAGE = 'Finding your location...';

const SelectLocationScreen: React.FC = () => {
  const navigation = useNavigation();
  const mapRef = useRef<{ animateToRegion: (r: MapRegion, d?: number) => void } | null>(null);
  const centerRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const skipNextRegionGeocode = useRef(true);

  const { getCurrentLocation } = useLocationPermission();
  const { address, isGeocoding, reverseGeocode, resetGeocodeCache } = useReverseGeocode();

  const [phase, setPhase] = useState<ScreenPhase>({ status: 'loading' });
  const [MapViewComponent, setMapViewComponent] = useState<React.ComponentType<any> | null>(null);
  const [isSheetVisible, setIsSheetVisible] = useState(false);

  useEffect(() => {
    try {
      const maps = require('react-native-maps');
      setMapViewComponent(() => maps.default);
    } catch {
      Alert.alert('Map unavailable', 'Could not load the map. Please restart the app.');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const result = await resolveInitialMapRegion();
      if (cancelled) return;

      centerRef.current = {
        latitude: result.region.latitude,
        longitude: result.region.longitude,
      };
      skipNextRegionGeocode.current = true;
      reverseGeocode(
        { latitude: result.region.latitude, longitude: result.region.longitude },
        { immediate: true },
      );

      setPhase({
        status: 'ready',
        region: result.region,
        permissionDenied: result.permissionDenied,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [reverseGeocode]);

  const goToCoords = useCallback((latitude: number, longitude: number) => {
    centerRef.current = { latitude, longitude };
    skipNextRegionGeocode.current = true;
    mapRef.current?.animateToRegion(
      { latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 },
      300,
    );
    resetGeocodeCache();
    reverseGeocode({ latitude, longitude }, { immediate: true });
  }, [reverseGeocode, resetGeocodeCache]);

  const handleRegionChangeComplete = useCallback((newRegion: MapRegion) => {
    centerRef.current = { latitude: newRegion.latitude, longitude: newRegion.longitude };
    if (skipNextRegionGeocode.current) {
      skipNextRegionGeocode.current = false;
      return;
    }
    reverseGeocode({ latitude: newRegion.latitude, longitude: newRegion.longitude });
  }, [reverseGeocode]);

  const handleCurrentLocation = async () => {
    const location = await getCurrentLocation();
    if (location) {
      goToCoords(location.coords.latitude, location.coords.longitude);
    }
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

  if (phase.status === 'loading' || !MapViewComponent) {
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
      <MapViewComponent
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

      {phase.permissionDenied && (
        <View style={styles.permissionCard}>
          <Text style={styles.permissionTitle}>Location permission denied</Text>
          <Text style={styles.permissionText}>You can still move the map to pick your address.</Text>
          <TouchableOpacity style={styles.settingsButton} onPress={() => Linking.openSettings()}>
            <Text style={styles.settingsButtonText}>Open Settings</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.bottomSection}>
        <CurrentLocationButton onPress={handleCurrentLocation} />
        <View style={styles.sheetWrapper}>
          <LocationPreviewCard
            areaName={displayAreaName}
            formattedAddress={displayAddress}
            isLoading={isGeocoding && !address}
            isUpdating={isGeocoding && !!address}
            confirmDisabled={isGeocoding || !address}
            onConfirm={() => setIsSheetVisible(true)}
          />
        </View>
      </View>

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
