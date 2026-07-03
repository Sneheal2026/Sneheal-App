// Global TypeScript types and interfaces

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
}

export interface Order {
  id: string;
  name: string;
  status: 'processing' | 'in_transit' | 'delivered' | 'cancelled';
  createdAt: string;
  total: number;
}

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type {
  VoiceRecognitionState,
  SpeechPermissionStatus,
  SpeechErrorCategory,
  SpeechRecognitionError,
  UseVoiceRecognitionOptions,
  UseVoiceRecognitionReturn,
} from './speech.types';

export { mapSpeechError, mapPermissionError } from './speech.types';

export type {
  LocationStatus,
  Coordinates,
  LiveLocation,
  AddressType,
  AddressDraft,
  SavedAddress,
} from './location.types';
