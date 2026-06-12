import type { SpeechPermissionStatus } from '@/types/speech.types';
import {
  getSpeechRecognitionModule,
  isExpoGoEnvironment,
  isNativeSpeechRecognitionAvailable,
  type SpeechRecognitionStartOptions,
} from './speechRecognitionNative';

const DEFAULT_LANGUAGE = 'en-IN';
const FALLBACK_LANGUAGE = 'en-US';
const SILENCE_TIMEOUT_MS = 3000;
const BUSY_RETRY_DELAY_MS = 300;
const POST_PERMISSION_DELAY_MS = 250;

function mapPermissionResponse(
  granted: boolean,
  canAskAgain: boolean,
  restricted?: boolean,
): SpeechPermissionStatus {
  if (granted) return 'granted';
  if (restricted) return 'restricted';
  if (!canAskAgain) return 'blocked';
  return 'denied';
}

function buildStartOptions(language: string): SpeechRecognitionStartOptions {
  return {
    lang: language,
    interimResults: true,
    continuous: false,
    maxAlternatives: 1,
    iosTaskHint: 'search',
    androidIntentOptions: {
      EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: SILENCE_TIMEOUT_MS,
    },
    iosCategory: {
      category: 'playAndRecord',
      categoryOptions: ['defaultToSpeaker', 'allowBluetooth'],
      mode: 'measurement',
    },
  };
}

function getModuleOrThrow() {
  const module = getSpeechRecognitionModule();
  if (!module) {
    throw new Error('Speech recognition native module is not available');
  }
  return module;
}

class SpeechRecognitionService {
  private sessionActive = false;
  private starting = false;
  private sessionOwnerId: symbol | null = null;

  isAvailable(): boolean {
    return isNativeSpeechRecognitionAvailable();
  }

  isExpoGoEnvironment(): boolean {
    return isExpoGoEnvironment();
  }

  getSpeechModule() {
    return getSpeechRecognitionModule();
  }

  createOwnerId(): symbol {
    return Symbol('speech-session-owner');
  }

  isOwner(ownerId: symbol): boolean {
    return this.sessionOwnerId === ownerId;
  }

  async getPermissions(): Promise<SpeechPermissionStatus> {
    const module = getSpeechRecognitionModule();
    if (!module) return 'denied';

    try {
      const result = await module.getPermissionsAsync();
      return mapPermissionResponse(
        result.granted,
        result.canAskAgain,
        result.restricted,
      );
    } catch {
      return 'denied';
    }
  }

  async requestPermissions(): Promise<SpeechPermissionStatus> {
    const module = getSpeechRecognitionModule();
    if (!module) return 'denied';

    try {
      const result = await module.requestPermissionsAsync();
      return mapPermissionResponse(
        result.granted,
        result.canAskAgain,
        result.restricted,
      );
    } catch {
      return 'denied';
    }
  }

  isSessionActive(): boolean {
    return this.sessionActive || this.starting;
  }

  markSessionStarted(ownerId: symbol): void {
    this.sessionOwnerId = ownerId;
    this.sessionActive = true;
    this.starting = false;
  }

  markSessionEnded(): void {
    this.sessionActive = false;
    this.starting = false;
    this.sessionOwnerId = null;
  }

  private async abortNativeSession(): Promise<void> {
    const module = getSpeechRecognitionModule();
    if (!module) return;

    try {
      module.abort();
    } catch {
      // ignore cleanup errors
    }

    await new Promise((resolve) => setTimeout(resolve, 80));
  }

  private async ensureCleanSession(): Promise<void> {
    if (!this.sessionActive && !this.starting) return;
    await this.abortNativeSession();
    this.sessionActive = false;
    this.starting = false;
  }

  async startSession(ownerId: symbol, language: string = DEFAULT_LANGUAGE): Promise<void> {
    if (this.starting) {
      await new Promise((resolve) => setTimeout(resolve, BUSY_RETRY_DELAY_MS));
    }

    const module = getModuleOrThrow();
    await this.ensureCleanSession();

    this.starting = true;
    this.sessionOwnerId = ownerId;

    try {
      module.start(buildStartOptions(language));
      this.sessionActive = true;
    } catch (error) {
      this.sessionActive = false;
      this.sessionOwnerId = null;
      throw error;
    } finally {
      this.starting = false;
    }
  }

  async startSessionWithFallback(ownerId: symbol, language: string = DEFAULT_LANGUAGE): Promise<void> {
    try {
      await this.startSession(ownerId, language);
    } catch {
      await this.ensureCleanSession();
      await this.startSession(ownerId, FALLBACK_LANGUAGE);
    }
  }

  async waitAfterPermissionGrant(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, POST_PERMISSION_DELAY_MS));
  }

  stopSession(): void {
    if (!this.sessionActive) return;

    const module = getSpeechRecognitionModule();
    if (!module) {
      this.sessionActive = false;
      return;
    }

    try {
      module.stop();
    } catch {
      this.sessionActive = false;
    }
  }

  abortSession(): void {
    if (!this.sessionActive && !this.starting) return;

    const module = getSpeechRecognitionModule();
    if (module) {
      try {
        module.abort();
      } catch {
        // ignore abort errors
      }
    }

    this.sessionActive = false;
    this.starting = false;
    this.sessionOwnerId = null;
  }
}

export const speechRecognitionService = new SpeechRecognitionService();
