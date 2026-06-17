import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DeliveryAddress } from '@/types/address';
import { sanitizeDisplayAddress } from '@/utils/addressFormatting';

const STORAGE_KEY = '@sneheal/delivery_address';

/** Normalize older saved JSON so missing fields don't break the UI */
function normalizeAddress(raw: Partial<DeliveryAddress>): DeliveryAddress | null {
  if (typeof raw.latitude !== 'number' || typeof raw.longitude !== 'number') {
    return null;
  }

  const areaName = raw.areaName || raw.locality || 'Saved address';

  return {
    latitude: raw.latitude,
    longitude: raw.longitude,
    areaName,
    formattedAddress: raw.formattedAddress || areaName,
    locality: raw.locality || areaName,
    postalCode: raw.postalCode,
    flatHouse: raw.flatHouse || '',
    landmark: raw.landmark,
    receiverName: raw.receiverName || '',
    phone: raw.phone || '',
    label: raw.label || 'home',
    savedAt: raw.savedAt || new Date().toISOString(),
  };
}

/** Full address string for header / summary display */
export function formatAddressDisplay(address: DeliveryAddress): string {
  const base = sanitizeDisplayAddress(
    address.formattedAddress || address.areaName || address.locality,
  );
  const parts: string[] = [];

  if (address.flatHouse?.trim()) {
    parts.push(address.flatHouse.trim());
  }
  if (base?.trim()) {
    parts.push(base.trim());
  }
  if (address.landmark?.trim()) {
    parts.push(address.landmark.trim());
  }

  return parts.join(', ') || 'Add delivery address';
}

/**
 * Get the saved delivery address from AsyncStorage
 */
export async function getDeliveryAddress(): Promise<DeliveryAddress | null> {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
    if (jsonValue == null) return null;
    return normalizeAddress(JSON.parse(jsonValue));
  } catch (error) {
    console.error('Error loading delivery address:', error);
    return null;
  }
}

/**
 * Save delivery address to AsyncStorage
 */
export async function saveDeliveryAddress(address: DeliveryAddress): Promise<void> {
  try {
    const jsonValue = JSON.stringify(address);
    await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
  } catch (error) {
    console.error('Error saving delivery address:', error);
    throw error;
  }
}

/**
 * Clear saved delivery address
 */
export async function clearDeliveryAddress(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing delivery address:', error);
    throw error;
  }
}
