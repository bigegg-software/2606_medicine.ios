declare module 'react-native-voice' {
  interface SpeechResultsEvent {
    value?: string[];
  }

  interface SpeechErrorEvent {
    error?: { message?: string };
  }

  const Voice: {
    onSpeechStart: (() => void) | null;
    onSpeechEnd: (() => void) | null;
    onSpeechResults: ((event: SpeechResultsEvent) => void) | null;
    onSpeechPartialResults: ((event: SpeechResultsEvent) => void) | null;
    onSpeechError: ((event: SpeechErrorEvent) => void) | null;
    start: (locale: string) => Promise<void>;
    stop: () => Promise<void>;
    cancel: () => Promise<void>;
    destroy: () => Promise<void>;
    removeAllListeners: () => void;
    isAvailable: () => Promise<boolean>;
  };

  export default Voice;
}
