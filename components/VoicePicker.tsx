"use client";

import { useT } from "@/lib/i18n/client";
import { useTtsCapabilities } from "@/lib/tts/capabilities";
import { voicesFor, type TtsLanguage } from "@/lib/tts/voices";

type Props = { language: TtsLanguage; voice: string; onChange: (id: string) => void };

export function VoicePicker({ language, voice, onChange }: Props) {
  const t = useT();
  const { kokoro } = useTtsCapabilities();
  return (
    <label className="flex items-center gap-2 text-sm text-muted">
      {t.common.voice}
      <select className="input w-auto py-1.5 text-sm" value={voice} onChange={(e) => onChange(e.target.value)}>
        {voicesFor(language, kokoro).map((v) => (
          <option key={v.id} value={v.id}>
            {v.label}
          </option>
        ))}
      </select>
    </label>
  );
}
