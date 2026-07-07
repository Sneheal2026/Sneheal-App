import type { SavedAddress } from '@/types/location.types';
import { authenticatedApiRequest } from './authTokenManager';

export type AddressPayload = {
  addressLine: string;
  flatNumber: string;
  landmark?: string;
  receiverName: string;
  mobile: string;
  type: SavedAddress['type'];
  customTypeLabel?: string;
  latitude: number;
  longitude: number;
  isDefault?: boolean;
};

const toPayload = (address: SavedAddress | AddressPayload): AddressPayload => ({
  addressLine: address.addressLine,
  flatNumber: address.flatNumber,
  landmark: address.landmark ?? '',
  receiverName: address.receiverName,
  mobile: address.mobile,
  type: address.type,
  customTypeLabel: address.customTypeLabel ?? '',
  latitude: 'coords' in address ? address.coords.latitude : address.latitude,
  longitude: 'coords' in address ? address.coords.longitude : address.longitude,
  isDefault: address.isDefault ?? false,
});

export const fetchAddressesFromApi = (): Promise<SavedAddress[]> =>
  authenticatedApiRequest<SavedAddress[]>('/api/addresses');

export const createAddressOnApi = (
  address: Omit<SavedAddress, 'id' | 'createdAt'> | AddressPayload,
): Promise<SavedAddress> =>
  authenticatedApiRequest<SavedAddress>('/api/addresses', {
    method: 'POST',
    body: toPayload(address as SavedAddress),
  });

export const updateAddressOnApi = (
  id: string,
  address: SavedAddress | AddressPayload,
): Promise<SavedAddress> =>
  authenticatedApiRequest<SavedAddress>(`/api/addresses/${id}`, {
    method: 'PUT',
    body: toPayload(address as SavedAddress),
  });

export const deleteAddressOnApi = (id: string): Promise<{ deleted: boolean }> =>
  authenticatedApiRequest<{ deleted: boolean }>(`/api/addresses/${id}`, {
    method: 'DELETE',
  });
