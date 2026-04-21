import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Web Speech API 語音輸入 Hook
 * 支援瀏覽器：Chrome、Edge、Safari（iOS 14.5+）、Android Chrome
 * 不支援：Firefox
 */

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: { transcript: string; confidence: number };
    };
  };
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

interface UseVoiceInputOptions {
  language?: string;
  onFinalTranscript?: (text: string) => void;
  onInterimTranscript?: (text: string) => void;
}

export function useVoiceInput({
  language = "zh-TW",
  onFinalTranscript,
  onInterimTranscript,
}: UseVoiceInputOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const isSupported = typeof window !== "undefined" &&
    (Boolean(window.SpeechRecognition) || Boolean(window.webkitSpeechRecognition));

  const start = useCallback(() => {
    if (!isSupported) {
      setError("你的瀏覽器不支援語音輸入，請改用 Chrome、Edge 或 Safari");
      return;
    }

    setError(null);

    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onresult = (event) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        if (result.isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }
      if (final && onFinalTranscript) onFinalTranscript(final);
      if (interim && onInterimTranscript) onInterimTranscript(interim);
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed") {
        setError("請允許麥克風權限");
      } else if (event.error === "no-speech") {
        // 沒偵測到語音，不算錯誤
      } else {
        setError(`語音辨識錯誤：${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch (err) {
      console.error("Voice recognition start failed:", err);
      setError("無法啟動語音辨識");
    }
  }, [isSupported, language, onFinalTranscript, onInterimTranscript]);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const toggle = useCallback(() => {
    if (isListening) stop();
    else start();
  }, [isListening, start, stop]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch { /* ignore */ }
      }
    };
  }, []);

  return { isListening, isSupported, error, start, stop, toggle };
}
