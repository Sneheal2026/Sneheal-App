import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Alert, AppState, type AppStateStatus } from 'react-native';
import { speechRecognitionService } from '@/services/speechRecognitionService';
import {
  getSpeechRecognitionModule,
  type SpeechErrorEvent,
  type SpeechResultEvent,
} from '@/services/speechRecognitionNative';
import {
  mapPermissionError,
  mapSpeechError,
  type SpeechRecognitionError,
  type UseVoiceRecognitionOptions,
  type UseVoiceRecognitionReturn,
  type VoiceRecognitionState,
} from '@/types/speech.types';

const DEFAULT_LANGUAGE = 'en-IN';
const DEFAULT_SILENCE_MS = 3000;
const SUCCESS_RESET_MS = 800;
const ERROR_RESET_MS = 2500;

type SpeechNativeEventName = 'start' | 'result' | 'speechend' | 'volumechange' | 'error' | 'end';

function normalizeTranscript(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function removeDuplicatedPhrase(text: string): string {
  const normalized = normalizeTranscript(text);
  if (!normalized) return '';

  const words = normalized.split(' ');
  if (words.length >= 2 && words.length % 2 === 0) {
    const half = words.length / 2;
    const first = words.slice(0, half).join(' ');
    const second = words.slice(half).join(' ');
    if (first === second) return first;
  }

  return normalized;
}

function extractTranscript(event: SpeechResultEvent): string {
  const raw = event.results[0]?.transcript ?? '';
  return removeDuplicatedPhrase(raw);
}

function useSpeechNativeEvent(
  eventName: SpeechNativeEventName,
  handler: (event: unknown) => void,
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const module = getSpeechRecognitionModule();
    if (!module) return;

    const subscription = module.addListener(eventName, (event) => {
      handlerRef.current(event);
    });

    return () => subscription.remove();
  }, [eventName]);
}

export function useVoiceRecognition(
  options: UseVoiceRecognitionOptions = {},
): UseVoiceRecognitionReturn {
  const {
    language = DEFAULT_LANGUAGE,
    silenceTimeoutMs = DEFAULT_SILENCE_MS,
    onTranscriptChange,
    onFinalTranscript,
    onSearchSubmit,
  } = options;

  const [state, setState] = useState<VoiceRecognitionState>('idle');
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<SpeechRecognitionError | null>(null);

  const ownerId = useMemo(() => speechRecognitionService.createOwnerId(), []);

  const mountedRef = useRef(true);
  const userAbortedRef = useRef(false);
  const finalHandledRef = useRef(false);
  const busyRetryUsedRef = useRef(false);
  const languageFallbackUsedRef = useRef(false);
  const permissionJustGrantedRef = useRef(false);
  const lastEmittedTextRef = useRef('');
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onTranscriptChangeRef = useRef(onTranscriptChange);
  const onFinalTranscriptRef = useRef(onFinalTranscript);
  const onSearchSubmitRef = useRef(onSearchSubmit);

  onTranscriptChangeRef.current = onTranscriptChange;
  onFinalTranscriptRef.current = onFinalTranscript;
  onSearchSubmitRef.current = onSearchSubmit;

  const isActiveOwner = useCallback(() => {
    return speechRecognitionService.isOwner(ownerId);
  }, [ownerId]);

  const safeSetState = useCallback((next: VoiceRecognitionState) => {
    if (mountedRef.current) {
      setState(next);
    }
  }, []);

  const clearTimer = useCallback((timerRef: { current: ReturnType<typeof setTimeout> | null }) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const clearAllTimers = useCallback(() => {
    clearTimer(silenceTimerRef);
    clearTimer(successTimerRef);
    clearTimer(errorTimerRef);
  }, [clearTimer]);

  const emitInterimTranscript = useCallback((text: string) => {
    if (!text || text === lastEmittedTextRef.current) return;

    lastEmittedTextRef.current = text;
    if (mountedRef.current) {
      setTranscript(text);
    }
    onTranscriptChangeRef.current?.(text);
  }, []);

  const emitFinalTranscript = useCallback((text: string) => {
    if (finalHandledRef.current) return;

    const normalized = removeDuplicatedPhrase(text);
    if (!normalized) return;

    finalHandledRef.current = true;
    const changed = normalized !== lastEmittedTextRef.current;
    lastEmittedTextRef.current = normalized;

    if (mountedRef.current) {
      setTranscript(normalized);
    }

    if (changed) {
      onTranscriptChangeRef.current?.(normalized);
    }

    onFinalTranscriptRef.current?.(normalized);
    onSearchSubmitRef.current?.(normalized);
  }, []);

  const resetToIdle = useCallback(() => {
    clearAllTimers();
    speechRecognitionService.markSessionEnded();
    safeSetState('idle');
  }, [clearAllTimers, safeSetState]);

  const scheduleSilenceStop = useCallback(() => {
    if (!isActiveOwner()) return;

    clearTimer(silenceTimerRef);
    silenceTimerRef.current = setTimeout(() => {
      silenceTimerRef.current = null;
      if (!isActiveOwner() || !speechRecognitionService.isSessionActive()) return;
      safeSetState('processing');
      speechRecognitionService.stopSession();
    }, silenceTimeoutMs);
  }, [clearTimer, isActiveOwner, safeSetState, silenceTimeoutMs]);

  const showError = useCallback((speechError: SpeechRecognitionError) => {
    if (mountedRef.current) {
      setError(speechError);
      safeSetState('error');
    }

    if (speechError.code !== 'aborted' && speechError.code !== 'no-speech') {
      Alert.alert('Voice search', speechError.message);
    }

    clearTimer(errorTimerRef);
    errorTimerRef.current = setTimeout(() => {
      errorTimerRef.current = null;
      if (mountedRef.current) {
        setError(null);
        safeSetState('idle');
      }
    }, ERROR_RESET_MS);
  }, [clearTimer, safeSetState]);

  const stopListening = useCallback(() => {
    if (!speechRecognitionService.isSessionActive() || !isActiveOwner()) return;

    userAbortedRef.current = true;
    clearAllTimers();
    safeSetState('processing');
    speechRecognitionService.stopSession();
  }, [clearAllTimers, isActiveOwner, safeSetState]);

  const startListening = useCallback(async () => {
    if (speechRecognitionService.isSessionActive()) {
      if (isActiveOwner()) {
        stopListening();
      }
      return;
    }

    if (speechRecognitionService.isExpoGoEnvironment()) {
      Alert.alert(
        'Voice search unavailable',
        'Voice search is not supported in Expo Go. Create a development or production build with EAS to use this feature.',
      );
      return;
    }

    if (!speechRecognitionService.isAvailable()) {
      Alert.alert(
        'Voice search unavailable',
        'Speech recognition is not available on this device. Rebuild the app after installing expo-speech-recognition.',
      );
      return;
    }

    userAbortedRef.current = false;
    finalHandledRef.current = false;
    busyRetryUsedRef.current = false;
    languageFallbackUsedRef.current = false;
    permissionJustGrantedRef.current = false;
    lastEmittedTextRef.current = '';
    clearAllTimers();

    if (mountedRef.current) {
      setError(null);
    }

    let permission = await speechRecognitionService.getPermissions();
    if (permission !== 'granted') {
      permission = await speechRecognitionService.requestPermissions();
      permissionJustGrantedRef.current = permission === 'granted';
    }

    if (permission !== 'granted') {
      showError(mapPermissionError(permission));
      return;
    }

    if (permissionJustGrantedRef.current) {
      await speechRecognitionService.waitAfterPermissionGrant();
    }

    try {
      safeSetState('listening');
      await speechRecognitionService.startSessionWithFallback(ownerId, language);
      if (!mountedRef.current || !isActiveOwner()) {
        speechRecognitionService.abortSession();
        return;
      }
      speechRecognitionService.markSessionStarted(ownerId);
    } catch (startError) {
      if (!mountedRef.current) return;
      const message = startError instanceof Error ? startError.message : undefined;
      showError(mapSpeechError('service-not-allowed', message));
    }
  }, [
    clearAllTimers,
    isActiveOwner,
    language,
    ownerId,
    showError,
    safeSetState,
    stopListening,
  ]);

  const toggleListening = useCallback(async () => {
    if (speechRecognitionService.isSessionActive() && isActiveOwner()) {
      stopListening();
      return;
    }

    if (!speechRecognitionService.isSessionActive()) {
      await startListening();
    }
  }, [isActiveOwner, startListening, stopListening]);

  const resetError = useCallback(() => {
    clearTimer(errorTimerRef);
    if (mountedRef.current) {
      setError(null);
      safeSetState('idle');
    }
  }, [clearTimer, safeSetState]);

  useSpeechNativeEvent('start', () => {
    if (!mountedRef.current || !isActiveOwner()) return;
    safeSetState('listening');
  });

  useSpeechNativeEvent('result', (event) => {
    if (!mountedRef.current || !isActiveOwner()) return;

    const result = event as SpeechResultEvent;
    if (finalHandledRef.current && !result.isFinal) return;

    const text = extractTranscript(result);
    if (!text) return;

    scheduleSilenceStop();

    if (result.isFinal) {
      emitFinalTranscript(text);
      return;
    }

    emitInterimTranscript(text);
  });

  useSpeechNativeEvent('speechend', () => {
    if (!isActiveOwner()) return;
    scheduleSilenceStop();
  });

  useSpeechNativeEvent('volumechange', () => {
    if (!isActiveOwner()) return;
    scheduleSilenceStop();
  });

  useSpeechNativeEvent('error', (event) => {
    if (!mountedRef.current || !isActiveOwner()) return;

    const speechError = event as SpeechErrorEvent;
    clearAllTimers();

    if (userAbortedRef.current && speechError.error === 'aborted') {
      resetToIdle();
      return;
    }

    if (speechError.error === 'busy' && !busyRetryUsedRef.current) {
      busyRetryUsedRef.current = true;
      void (async () => {
        try {
          speechRecognitionService.abortSession();
          await new Promise((resolve) => setTimeout(resolve, 300));
          await speechRecognitionService.startSessionWithFallback(ownerId, language);
          speechRecognitionService.markSessionStarted(ownerId);
          safeSetState('listening');
        } catch {
          showError(mapSpeechError('busy', speechError.message));
        }
      })();
      return;
    }

    const shouldTryLanguageFallback =
      !languageFallbackUsedRef.current &&
      (speechError.error === 'language-not-supported' ||
        speechError.error === 'service-not-allowed' ||
        speechError.error === 'client' ||
        speechError.error === 'unknown');

    if (shouldTryLanguageFallback) {
      languageFallbackUsedRef.current = true;
      void (async () => {
        try {
          speechRecognitionService.abortSession();
          await new Promise((resolve) => setTimeout(resolve, 300));
          await speechRecognitionService.startSessionWithFallback(ownerId, 'en-US');
          speechRecognitionService.markSessionStarted(ownerId);
          safeSetState('listening');
        } catch {
          showError(mapSpeechError(
            speechError.error as Parameters<typeof mapSpeechError>[0],
            speechError.message,
          ));
          speechRecognitionService.markSessionEnded();
        }
      })();
      return;
    }

    if (speechError.error === 'aborted') {
      resetToIdle();
      return;
    }

    if (speechError.error === 'no-speech') {
      resetToIdle();
      return;
    }

    showError(
      mapSpeechError(
        speechError.error as Parameters<typeof mapSpeechError>[0],
        speechError.message,
      ),
    );
    speechRecognitionService.markSessionEnded();
  });

  useSpeechNativeEvent('end', () => {
    if (!mountedRef.current || !isActiveOwner()) return;

    speechRecognitionService.markSessionEnded();
    clearTimer(silenceTimerRef);

    if (finalHandledRef.current) {
      safeSetState('success');
      clearTimer(successTimerRef);
      successTimerRef.current = setTimeout(() => {
        successTimerRef.current = null;
        safeSetState('idle');
      }, SUCCESS_RESET_MS);
      return;
    }

    if (userAbortedRef.current) {
      resetToIdle();
      return;
    }

    safeSetState('idle');
  });

  useEffect(() => {
    mountedRef.current = true;

    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active' || !isActiveOwner()) return;
      userAbortedRef.current = true;
      speechRecognitionService.abortSession();
      clearAllTimers();
      resetToIdle();
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      mountedRef.current = false;
      userAbortedRef.current = true;
      subscription.remove();
      if (isActiveOwner()) {
        speechRecognitionService.abortSession();
      }
      clearAllTimers();
    };
  }, [clearAllTimers, clearTimer, isActiveOwner, resetToIdle]);

  return {
    state,
    transcript,
    error,
    isListening: state === 'listening' || state === 'processing',
    startListening,
    stopListening,
    toggleListening,
    resetError,
  };
}
