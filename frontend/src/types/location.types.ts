export type LocationStatus = 'idle' | 'loading' | 'success' | 'error';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LiveLocation {
  coords: Coordinates;
  addressLine: string;
  shortLabel?: string;
}
