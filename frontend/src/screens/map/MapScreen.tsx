import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Loader from '@/components/common/Loader';
import { fetchLiveLocation } from '@/services/locationService';
import type { LiveLocation } from '@/types/location.types';
import theme from '@/styles/theme';
import globalStyles from '@/styles/globalStyles';

const { colors, spacing, typography, moderateScale } = theme;

const MapScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<LiveLocation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadLocation = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchLiveLocation();
      setLocation(result);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unable to get location';
      setError(message);
      setLocation(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLocation();
  }, [loadLocation]);

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  if (loading) {
    return <Loader message="Fetching your live location..." />;
  }

  if (error || !location) {
    return (
      <SafeAreaView style={globalStyles.safeArea} edges={['top']}>
        <View style={styles.errorContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleGoBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={moderateScale(22)} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.errorTitle}>Location unavailable</Text>
          <Text style={styles.errorMessage}>
            {error ?? 'Please enable location permissions and try again.'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => void loadLocation()}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { latitude, longitude } = location.coords;

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: 0.008,
          longitudeDelta: 0.008,
        }}
        showsUserLocation
        showsMyLocationButton
      >
        <Marker
          coordinate={{ latitude, longitude }}
          title="You are here"
          description={location.addressLine}
        />
      </MapView>

      <SafeAreaView style={styles.overlay} edges={['top']} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.mapBackButton}
          onPress={handleGoBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={moderateScale(22)} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.addressCard}>
          <Ionicons name="location-sharp" size={moderateScale(16)} color={colors.primary} />
          <Text style={styles.addressText} numberOfLines={2}>
            {location.addressLine}
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  mapBackButton: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(12),
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: moderateScale(12),
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  addressText: {
    ...typography.bodySmall,
    flex: 1,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
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
    marginBottom: spacing.xl,
  },
  errorTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  errorMessage: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  retryButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: moderateScale(10),
  },
  retryText: {
    ...typography.bodySmall,
    color: colors.textInverse,
    fontWeight: '600',
  },
});

export default MapScreen;
