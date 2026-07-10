import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SavedAddress } from '@/types/location.types';
import { ApiError } from './apiClient';
import {
  createAddressOnApi,
  deleteAddressOnApi,
  fetchAddressesFromApi,
  updateAddressOnApi,
} from './addressApiService';
import { getValidAccessToken } from './authTokenManager';

const ADDRESSES_KEY = '@sneheal/savedAddresses';
const SELECTED_ID_KEY = '@sneheal/selectedAddressId';
const ADDRESSES_LAST_SYNC_KEY = '@sneheal/addressesLastSyncAt';
/** Soft TTL: Home/focus loads stay cache-first; force refresh bypasses this. */
const ADDRESS_SYNC_TTL_MS = 10 * 60 * 1000;

let syncInFlight: Promise<SavedAddress[]> | null = null;

const parseAddresses = (raw: string | null): SavedAddress[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const pickSelectedAddress = (addresses: SavedAddress[]): SavedAddress | null =>
  addresses.find((address) => address.isDefault) ?? null;

const markAddressesSynced = async (): Promise<void> => {
  await AsyncStorage.setItem(ADDRESSES_LAST_SYNC_KEY, String(Date.now()));
};

const isAddressCacheFresh = async (): Promise<boolean> => {
  const raw = await AsyncStorage.getItem(ADDRESSES_LAST_SYNC_KEY);
  if (!raw) return false;

  const syncedAt = Number(raw);
  if (!Number.isFinite(syncedAt)) return false;

  return Date.now() - syncedAt < ADDRESS_SYNC_TTL_MS;
};

const cacheAddresses = async (addresses: SavedAddress[]): Promise<void> => {
  await AsyncStorage.setItem(ADDRESSES_KEY, JSON.stringify(addresses));

  const selected = pickSelectedAddress(addresses);
  await AsyncStorage.setItem(SELECTED_ID_KEY, selected?.id ?? '');
};

const readCachedAddresses = async (): Promise<SavedAddress[]> => {
  const raw = await AsyncStorage.getItem(ADDRESSES_KEY);
  return parseAddresses(raw);
};

const isServerAddressId = (id: string): boolean => /^\d+$/.test(id);

const mergeSavedAddress = (
  addresses: SavedAddress[],
  saved: SavedAddress,
): SavedAddress[] => {
  const index = addresses.findIndex((address) => address.id === saved.id);
  const next =
    index >= 0
      ? addresses.map((address, itemIndex) => (itemIndex === index ? saved : address))
      : [...addresses, saved];

  if (saved.isDefault) {
    return next.map((address) => ({
      ...address,
      isDefault: address.id === saved.id,
    }));
  }

  return next;
};

const applySelectedId = (addresses: SavedAddress[], id: string): SavedAddress[] =>
  addresses.map((address) => ({
    ...address,
    isDefault: address.id === id,
  }));

const syncAddressesFromApi = async (): Promise<SavedAddress[]> => {
  const token = await getValidAccessToken();

  if (!token) {
    return readCachedAddresses();
  }

  if (syncInFlight) {
    return syncInFlight;
  }

  syncInFlight = (async () => {
    try {
      const addresses = await fetchAddressesFromApi();
      await cacheAddresses(addresses);
      await markAddressesSynced();
      return addresses;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        throw error;
      }

      return readCachedAddresses();
    } finally {
      syncInFlight = null;
    }
  })();

  return syncInFlight;
};

export const getCachedAddresses = async (): Promise<SavedAddress[]> => {
  return readCachedAddresses();
};

export const getSavedAddresses = async (): Promise<SavedAddress[]> => {
  return syncAddressesFromApi();
};

export const saveAddress = async (
  address: Omit<SavedAddress, 'id' | 'createdAt'> & { id?: string },
): Promise<SavedAddress> => {
  const token = await getValidAccessToken();

  if (token) {
    const saved =
      address.id && isServerAddressId(address.id)
        ? await updateAddressOnApi(address.id, address as SavedAddress)
        : await createAddressOnApi(address);

    const cached = await readCachedAddresses();
    const merged = mergeSavedAddress(cached, saved);
    await cacheAddresses(merged);
    await markAddressesSynced();
    return saved;
  }

  const localAddress: SavedAddress = {
    id: address.id ?? Date.now().toString(),
    coords: address.coords,
    addressLine: address.addressLine,
    flatNumber: address.flatNumber,
    landmark: address.landmark,
    receiverName: address.receiverName,
    mobile: address.mobile,
    type: address.type,
    customTypeLabel: address.customTypeLabel,
    isDefault: address.isDefault,
    createdAt: new Date().toISOString(),
  };

  const existing = await readCachedAddresses();
  const merged = mergeSavedAddress(existing, localAddress);
  await cacheAddresses(merged);
  await markAddressesSynced();
  return localAddress;
};

export const deleteAddress = async (id: string): Promise<SavedAddress[]> => {
  const token = await getValidAccessToken();

  if (token && isServerAddressId(id)) {
    await deleteAddressOnApi(id);
    return syncAddressesFromApi();
  }

  const existing = await readCachedAddresses();
  const filtered = existing.filter((address) => address.id !== id);

  if (filtered.length > 0 && !filtered.some((address) => address.isDefault)) {
    filtered[0].isDefault = true;
  }

  await cacheAddresses(filtered);
  await markAddressesSynced();
  return filtered;
};

export const setDefaultAddress = async (id: string): Promise<SavedAddress | null> => {
  return setSelectedAddressId(id);
};

export const getSelectedAddressId = async (): Promise<string | null> => {
  const addresses = await readCachedAddresses();
  const selected = pickSelectedAddress(addresses);
  if (selected) {
    return selected.id;
  }

  return AsyncStorage.getItem(SELECTED_ID_KEY);
};

export const setSelectedAddressId = async (id: string): Promise<SavedAddress | null> => {
  const token = await getValidAccessToken();
  let addresses = await readCachedAddresses();
  let target = addresses.find((address) => address.id === id);

  if (!target && token) {
    addresses = await syncAddressesFromApi();
    target = addresses.find((address) => address.id === id);
  }

  if (!target) {
    throw new Error('Address not found');
  }

  if (token && isServerAddressId(id)) {
    if (target.isDefault) {
      return target;
    }

    const saved = await updateAddressOnApi(id, { ...target, isDefault: true });
    const updated = applySelectedId(
      addresses.some((address) => address.id === saved.id)
        ? addresses.map((address) => (address.id === saved.id ? saved : address))
        : [...addresses, saved],
      id,
    );
    await cacheAddresses(updated);
    await markAddressesSynced();
    return saved;
  }

  const updated = applySelectedId(addresses, id);
  await cacheAddresses(updated);
  await markAddressesSynced();
  return updated.find((address) => address.id === id) ?? null;
};

export const getSelectedAddress = async (): Promise<SavedAddress | null> => {
  const addresses = await readCachedAddresses();
  const selected = pickSelectedAddress(addresses);
  if (selected) {
    return selected;
  }

  const synced = await syncAddressesFromApi();
  return pickSelectedAddress(synced);
};

export type AddressSnapshot = {
  addresses: SavedAddress[];
  selectedAddress: SavedAddress | null;
};

export const loadAddressSnapshot = async (force = false): Promise<AddressSnapshot> => {
  const token = await getValidAccessToken();

  if (!force) {
    const cacheFresh = await isAddressCacheFresh();
    // Fresh cache (including empty list) or logged-out: never hit the network.
    if (cacheFresh || !token) {
      const cached = await readCachedAddresses();
      return {
        addresses: cached,
        selectedAddress: pickSelectedAddress(cached),
      };
    }
  }

  const addresses = token ? await syncAddressesFromApi() : await readCachedAddresses();

  return {
    addresses,
    selectedAddress: pickSelectedAddress(addresses),
  };
};

export const readAddressSnapshotFromCache = async (): Promise<AddressSnapshot> => {
  const addresses = await readCachedAddresses();
  return {
    addresses,
    selectedAddress: pickSelectedAddress(addresses),
  };
};
