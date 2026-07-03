export type LocationStatus = 'idle' | 'loading' | 'success' | 'error';

export type AddressType = 'home' | 'work' | 'other';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LiveLocation {
  coords: Coordinates;
  addressLine: string;
  shortLabel?: string;
}

export interface AddressDraft {
  coords: Coordinates;
  addressLine: string;
}

export interface SavedAddress {
  id: string;
  coords: Coordinates;
  addressLine: string;
  flatNumber: string;
  landmark: string;
  receiverName: string;
  mobile: string;
  type: AddressType;
  customTypeLabel: string;
  isDefault: boolean;
  createdAt: string;
}
