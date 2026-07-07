import { useCallback, useState } from 'react';
import {
  deleteAddress,
  loadAddressSnapshot,
  readAddressSnapshotFromCache,
  setSelectedAddressId,
} from '@/services/addressStorage';
import type { SavedAddress } from '@/types/location.types';

export function useSavedAddresses() {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<SavedAddress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const applySnapshot = useCallback(
    (snapshot: Awaited<ReturnType<typeof loadAddressSnapshot>>) => {
      setAddresses(snapshot.addresses);
      setSelectedAddress(snapshot.selectedAddress);
    },
    [],
  );

  const refresh = useCallback(async (force = true) => {
    setLoading(true);
    setError(null);

    try {
      const snapshot = await loadAddressSnapshot(force);
      applySnapshot(snapshot);
    } catch {
      setError('Could not load addresses. Please try again.');
      const snapshot = await readAddressSnapshotFromCache();
      applySnapshot(snapshot);
    } finally {
      setLoading(false);
    }
  }, [applySnapshot]);

  const selectAddress = useCallback(
    async (id: string) => {
      const selected = await setSelectedAddressId(id);
      if (!selected) {
        throw new Error('Address not found');
      }

      const snapshot = await readAddressSnapshotFromCache();
      applySnapshot(snapshot);
    },
    [applySnapshot],
  );

  const removeAddress = useCallback(async (id: string) => {
    const nextAddresses = await deleteAddress(id);
    setAddresses(nextAddresses);
    setSelectedAddress(nextAddresses.find((address) => address.isDefault) ?? null);
  }, []);

  return {
    addresses,
    selectedAddress,
    loading,
    error,
    refresh,
    selectAddress,
    removeAddress,
  };
}
