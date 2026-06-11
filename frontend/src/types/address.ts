export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface DeliveryAddress {
  latitude: number;
  longitude: number;
  areaName: string;
  formattedAddress: string;
  locality: string;
  postalCode?: string;
  flatHouse: string;
  landmark?: string;
  receiverName: string;
  phone: string;
  label: 'home' | 'work' | 'other';
  savedAt: string;
}

export type AddressLabel = 'home' | 'work' | 'other';
