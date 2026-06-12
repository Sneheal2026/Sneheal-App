import Constants from 'expo-constants';
import { requireOptionalNativeModule } from 'expo-modules-core';

export interface SpeechRecognitionStartOptions {
  lang?: string;
  interimResults?: boolean;
  continuous?: boolean;
  maxAlternatives?: number;
  iosTaskHint?: string;
  androidIntentOptions?: Record<string, unknown>;
  iosCategory?: {
    category: string;
    categoryOptions: string[];
    mode: string;
  };
}

export interface SpeechResultEvent {
  isFinal: boolean;
  results: Array<{ transcript: string; confidence: number }>;
}

export interface SpeechErrorEvent {
  error: string;
  message: string;
  code?: number;
}

type SpeechRecognitionModule = {
  isRecognitionAvailable: () => boolean;
  getPermissionsAsync: () => Promise<{
    granted: boolean;
    canAskAgain: boolean;
    restricted?: boolean;
  }>;
  requestPermissionsAsync: () => Promise<{
    granted: boolean;
    canAskAgain: boolean;
    restricted?: boolean;
  }>;
  start: (options: SpeechRecognitionStartOptions) => void;
  stop: () => void;
  abort: () => void;
  addListener: (
    eventName: string,
    listener: (event: unknown) => void,
  ) => { remove: () => void };
};

let cachedModule: SpeechRecognitionModule | null | undefined;

export function isExpoGoEnvironment(): boolean {
  return Constants.executionEnvironment === 'storeClient';
}

/**
 * Safely loads the native module. Returns null in Expo Go or when the
 * native binary was not rebuilt with expo-speech-recognition linked.
 */
export function getSpeechRecognitionModule(): SpeechRecognitionModule | null {
  if (cachedModule !== undefined) {
    return cachedModule;
  }

  if (isExpoGoEnvironment()) {
    cachedModule = null;
    return null;
  }

  try {
    cachedModule =
      (requireOptionalNativeModule('ExpoSpeechRecognition') as SpeechRecognitionModule | null) ??
      null;
  } catch {
    cachedModule = null;
  }

  return cachedModule;
}

export function isNativeSpeechRecognitionAvailable(): boolean {
  if (isExpoGoEnvironment()) return false;

  const module = getSpeechRecognitionModule();
  if (!module) return false;

  try {
    return module.isRecognitionAvailable();
  } catch {
    return false;
  }
}
