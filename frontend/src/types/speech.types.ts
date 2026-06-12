export type ExpoSpeechRecognitionErrorCode =
  | 'aborted'
  | 'audio-capture'
  | 'interrupted'
  | 'bad-grammar'
  | 'language-not-supported'
  | 'network'
  | 'no-speech'
  | 'not-allowed'
  | 'service-not-allowed'
  | 'busy'
  | 'client'
  | 'speech-timeout'
  | 'unknown';

export type VoiceRecognitionState =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'success'
  | 'error';

export type SpeechPermissionStatus =
  | 'granted'
  | 'denied'
  | 'blocked'
  | 'undetermined'
  | 'restricted';

export type SpeechErrorCategory =
  | 'permission'
  | 'recognition'
  | 'device'
  | 'application';

export interface SpeechRecognitionError {
  category: SpeechErrorCategory;
  code: ExpoSpeechRecognitionErrorCode | 'permission-denied' | 'permission-blocked' | 'permission-revoked' | 'unavailable';
  message: string;
  recoverable: boolean;
}

export interface UseVoiceRecognitionOptions {
  language?: string;
  silenceTimeoutMs?: number;
  onTranscriptChange?: (text: string) => void;
  onFinalTranscript?: (text: string) => void;
  onSearchSubmit?: (text: string) => void;
}

export interface UseVoiceRecognitionReturn {
  state: VoiceRecognitionState;
  transcript: string;
  error: SpeechRecognitionError | null;
  isListening: boolean;
  startListening: () => Promise<void>;
  stopListening: () => void;
  toggleListening: () => Promise<void>;
  resetError: () => void;
}

const ERROR_MESSAGES: Record<string, string> = {
  'not-allowed': 'Microphone or speech recognition permission was not granted.',
  'permission-denied': 'Microphone permission was denied.',
  'permission-blocked': 'Microphone permission is blocked. Enable it in Settings.',
  'permission-revoked': 'Microphone permission was revoked.',
  'no-speech': 'No speech was detected. Please try again.',
  'speech-timeout': 'Speech recognition timed out. Please try again.',
  aborted: 'Speech recognition was cancelled.',
  'audio-capture': 'Microphone is unavailable or could not capture audio.',
  interrupted: 'Speech recognition was interrupted.',
  network: 'Network is unavailable for speech recognition.',
  'service-not-allowed': 'Speech recognition service is not available on this device.',
  'language-not-supported': 'The selected language is not supported.',
  busy: 'Speech recognizer is busy. Please try again.',
  client: 'A speech recognition error occurred.',
  unknown: 'An unknown speech recognition error occurred.',
  'bad-grammar': 'Speech recognition configuration error.',
  unavailable: 'Voice search is not available in this environment.',
};

const ERROR_CATEGORY_MAP: Record<string, SpeechErrorCategory> = {
  'not-allowed': 'permission',
  'permission-denied': 'permission',
  'permission-blocked': 'permission',
  'permission-revoked': 'permission',
  'no-speech': 'recognition',
  'speech-timeout': 'recognition',
  aborted: 'application',
  'bad-grammar': 'recognition',
  'language-not-supported': 'recognition',
  network: 'recognition',
  'service-not-allowed': 'recognition',
  busy: 'device',
  client: 'recognition',
  unknown: 'recognition',
  'audio-capture': 'device',
  interrupted: 'device',
  unavailable: 'application',
};

const RECOVERABLE_ERRORS = new Set<string>([
  'no-speech',
  'speech-timeout',
  'busy',
  'network',
  'interrupted',
  'audio-capture',
]);

export function mapSpeechError(
  code: ExpoSpeechRecognitionErrorCode | SpeechRecognitionError['code'],
  fallbackMessage?: string,
): SpeechRecognitionError {
  const message = fallbackMessage ?? ERROR_MESSAGES[code] ?? 'Speech recognition failed.';
  return {
    category: ERROR_CATEGORY_MAP[code] ?? 'recognition',
    code,
    message,
    recoverable: RECOVERABLE_ERRORS.has(code),
  };
}

export function mapPermissionError(status: SpeechPermissionStatus): SpeechRecognitionError {
  const code =
    status === 'blocked'
      ? 'permission-blocked'
      : status === 'restricted'
        ? 'permission-denied'
        : 'permission-denied';

  return mapSpeechError(code);
}
