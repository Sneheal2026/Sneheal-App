import { useCallback, useEffect, useState } from 'react';
import {
  getSavedAddresses,
  getSelectedAddress,
  setSelectedAddressId,
} from '@/services/addressStorage';
import type { SavedAddress } from '@/types/location.types';

export function useSavedAddresses() {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<SavedAddress | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [all, selected] = await Promise.all([
        getSavedAddresses(),
        getSelectedAddress(),
      ]);
      setAddresses(all);
      setSelectedAddress(selected);
    } catch {
      setAddresses([]);
      setSelectedAddress(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const selectAddress = useCallback(
    async (id: string) => {
      await setSelectedAddressId(id);
      const all = await getSavedAddresses();
      const found = all.find((a) => a.id === id) ?? null;
      setSelectedAddress(found);
    },
    [],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { addresses, selectedAddress, loading, refresh, selectAddress };
}
