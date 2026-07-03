import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SavedAddress } from '@/types/location.types';

const ADDRESSES_KEY = '@sneheal/savedAddresses';
const SELECTED_ID_KEY = '@sneheal/selectedAddressId';

const parseAddresses = (raw: string | null): SavedAddress[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const getSavedAddresses = async (): Promise<SavedAddress[]> => {
  const raw = await AsyncStorage.getItem(ADDRESSES_KEY);
  return parseAddresses(raw);
};

export const saveAddress = async (address: SavedAddress): Promise<void> => {
  const existing = await getSavedAddresses();
  const index = existing.findIndex((a) => a.id === address.id);

  if (index >= 0) {
    existing[index] = address;
  } else {
    if (existing.length === 0) {
      address.isDefault = true;
    }
    existing.push(address);
  }

  await AsyncStorage.setItem(ADDRESSES_KEY, JSON.stringify(existing));
};

export const deleteAddress = async (id: string): Promise<void> => {
  const existing = await getSavedAddresses();
  const filtered = existing.filter((a) => a.id !== id);

  if (filtered.length > 0 && !filtered.some((a) => a.isDefault)) {
    filtered[0].isDefault = true;
  }

  await AsyncStorage.setItem(ADDRESSES_KEY, JSON.stringify(filtered));

  const selectedId = await AsyncStorage.getItem(SELECTED_ID_KEY);
  if (selectedId === id) {
    const newDefault = filtered.find((a) => a.isDefault);
    await AsyncStorage.setItem(SELECTED_ID_KEY, newDefault?.id ?? '');
  }
};

export const setDefaultAddress = async (id: string): Promise<void> => {
  const existing = await getSavedAddresses();
  const updated = existing.map((a) => ({ ...a, isDefault: a.id === id }));
  await AsyncStorage.setItem(ADDRESSES_KEY, JSON.stringify(updated));
};

export const getSelectedAddressId = async (): Promise<string | null> => {
  return AsyncStorage.getItem(SELECTED_ID_KEY);
};

export const setSelectedAddressId = async (id: string): Promise<void> => {
  await AsyncStorage.setItem(SELECTED_ID_KEY, id);
};

export const getSelectedAddress = async (): Promise<SavedAddress | null> => {
  const selectedId = await AsyncStorage.getItem(SELECTED_ID_KEY);
  if (!selectedId) return null;

  const addresses = await getSavedAddresses();
  return addresses.find((a) => a.id === selectedId) ?? null;
};
