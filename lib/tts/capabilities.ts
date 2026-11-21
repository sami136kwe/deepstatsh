"use client";

import { useEffect, useState } from "react";

export type TtsCapabilities = { kokoro: boolean };

let pending: Promise<TtsCapabilities> | null = null;

function load(): Promise<TtsCapabilities> {
  pending ??= fetch("/api/tts")
    .then((res) => (res.ok ? (res.json() as Promise<TtsCapabilities>) : { kokoro: false }))
    .catch(() => ({ kokoro: false }));
  return pending;
}

/** Whether the fast local voice server (Kokoro) is reachable from the app server. */
export function useTtsCapabilities(): TtsCapabilities {
  const [caps, setCaps] = useState<TtsCapabilities>({ kokoro: false });
  useEffect(() => {
    let active = true;
    void load().then((value) => {
      if (active) setCaps(value);
    });
    return () => {
      active = false;
    };
  }, []);
  return caps;
}
