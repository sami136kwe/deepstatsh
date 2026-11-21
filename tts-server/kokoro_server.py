"""Local text-to-speech server for Stash, based on Kokoro (ONNX).

Fast, offline and free. Run it with `npm run tts:kokoro`, then set
KOKORO_URL=http://127.0.0.1:8788 in .env.local. The models (~350 MB) are
downloaded once, the first time the server starts.

POST /tts    {"text": "...", "language": "fr"|"en", "voice": "ff_siwis"}  -> audio/wav
GET  /health -> {"ok": true}
"""
import io
import os
import re
import threading
import urllib.request
import wave
from collections import OrderedDict
from pathlib import Path

import numpy as np
import uvicorn
from fastapi import FastAPI
from fastapi.responses import JSONResponse, Response
from kokoro_onnx import Kokoro
from pydantic import BaseModel

HERE = Path(__file__).parent
MODELS = HERE / "models"
MODELS.mkdir(exist_ok=True)
PORT = int(os.environ.get("KOKORO_PORT", "8788"))
BASE_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/"
FILES = ("kokoro-v1.0.onnx", "voices-v1.0.bin")
DEFAULT = {"fr": "ff_siwis", "en": "af_heart"}
MAX_CHARS = 400


def ensure_files():
    for name in FILES:
        path = MODELS / name
        if path.exists() and path.stat().st_size > 1_000_000:
            continue
        print(f"Downloading {name} (once)...")
        urllib.request.urlretrieve(BASE_URL + name, path)


ensure_files()
print("Loading Kokoro...")
kokoro = Kokoro(str(MODELS / FILES[0]), str(MODELS / FILES[1]))
ALL_VOICES = set(kokoro.get_voices())
FR_VOICES = {v for v in ALL_VOICES if v.startswith("ff_")}
EN_VOICES = {v for v in ALL_VOICES if v[:2] in ("af", "am", "bf", "bm")}
print(f"Kokoro ready: {len(FR_VOICES)} French voice, {len(EN_VOICES)} English voices.")

lock = threading.Lock()
cache = OrderedDict()
app = FastAPI()


class Req(BaseModel):
    text: str
    language: str = "fr"
    voice: str = ""


def pick_voice(language, voice):
    voice = (voice or "").replace("kokoro:", "").strip()
    allowed = (FR_VOICES | EN_VOICES) if language == "fr" else EN_VOICES
    return voice if voice in allowed else DEFAULT[language]


def lang_code(language, voice):
    if language == "fr":
        return "fr-fr"
    return "en-gb" if voice.startswith("b") else "en-us"


def split_text(text, limit=MAX_CHARS):
    parts = re.split(r"(?<=[.!?;:,])\s+", text.strip())
    out, cur = [], ""
    for p in parts:
        if cur and len(cur) + 1 + len(p) > limit:
            out.append(cur)
            cur = p
        else:
            cur = f"{cur} {p}".strip()
    if cur:
        out.append(cur)
    final = []
    for c in out:
        while len(c) > limit:
            k = c.rfind(" ", 0, limit)
            k = k if k > 40 else limit
            final.append(c[:k])
            c = c[k:].strip()
        if c:
            final.append(c)
    return final


def synth(text, language, voice):
    code = lang_code(language, voice)
    chunks = []
    gap = None
    sr = 24000
    for piece in split_text(text):
        samples, sr = kokoro.create(piece, voice=voice, speed=1.0, lang=code)
        if gap is None:
            gap = np.zeros(int(sr * 0.08), dtype=np.float32)
        chunks.append(np.asarray(samples, dtype=np.float32))
        chunks.append(gap)
    if not chunks:
        raise ValueError("Empty text")
    audio = np.concatenate(chunks)
    pcm = (np.clip(audio, -1.0, 1.0) * 32767).astype(np.int16)
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(pcm.tobytes())
    return buf.getvalue()


@app.get("/health")
def health():
    return {"ok": True, "engine": "kokoro"}


@app.post("/tts")
def tts_route(req: Req):
    text = req.text.strip()
    language = "en" if req.language == "en" else "fr"
    if not text:
        return JSONResponse({"error": "Empty text"}, status_code=400)
    voice = pick_voice(language, req.voice)
    key = (language, voice, text)
    if key in cache:
        cache.move_to_end(key)
        return Response(cache[key], media_type="audio/wav")
    try:
        with lock:
            data = synth(text, language, voice)
    except Exception as e:
        return JSONResponse({"error": f"Synthesis failed: {e}"}, status_code=500)
    cache[key] = data
    if len(cache) > 400:
        cache.popitem(last=False)
    return Response(data, media_type="audio/wav")


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=PORT)
