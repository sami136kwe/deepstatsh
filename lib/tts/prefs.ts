"use client";

import { useSyncExternalStore } from "react";
import { defaultVoice, validVoice, type TtsLanguage } from "./voices";

const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage blocked: the preference only lasts until reload.
  }
  listeners.forEach((l) => l());
}

export function useVoicePref(language: TtsLanguage, kokoroAvailable = false): [string, (id: string) => void] {
  const voice = useSyncExternalStore(
    subscribe,
    () => validVoice(language, read(`tts-voice-${language}`), kokoroAvailable),
    () => defaultVoice(language),
  );
  return [voice, (id) => write(`tts-voice-${language}`, validVoice(language, id, kokoroAvailable))];
}

export function useAutoReadPref(): [boolean, (on: boolean) => void] {
  const on = useSyncExternalStore(subscribe, () => read("tts-auto") === "1", () => false);
  return [on, (value) => write("tts-auto", value ? "1" : "0")];
}
