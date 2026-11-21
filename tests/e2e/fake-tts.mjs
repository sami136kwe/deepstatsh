/**
 * Fake Kokoro server for end-to-end tests: same contract (GET /health, POST /tts),
 * returns a quiet WAV whose length follows the text length, after a configurable delay.
 *   FAKE_TTS_PORT (default 8799), FAKE_TTS_DELAY_MS (default 1200), FAKE_TTS_SEC_PER_CHAR (default 0.012)
 */
import http from "node:http";

const PORT = Number(process.env.FAKE_TTS_PORT ?? 8799);
const DELAY = Number(process.env.FAKE_TTS_DELAY_MS ?? 1200);
const SEC_PER_CHAR = Number(process.env.FAKE_TTS_SEC_PER_CHAR ?? 0.012);
const RATE = 8000;

function wav(seconds) {
  const samples = Math.max(1, Math.round(seconds * RATE));
  const data = Buffer.alloc(samples * 2);
  for (let i = 0; i < samples; i++) data.writeInt16LE(Math.round(Math.sin(i / 20) * 300), i * 2);
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVEfmt ", 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

http
  .createServer((req, res) => {
    if (req.method === "GET" && req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" }).end('{"ok":true}');
      return;
    }
    if (req.method === "POST" && req.url === "/tts") {
      let raw = "";
      req.on("data", (c) => (raw += c));
      req.on("end", () => {
        const { text = "" } = JSON.parse(raw || "{}");
        setTimeout(() => res.writeHead(200, { "Content-Type": "audio/wav" }).end(wav(text.length * SEC_PER_CHAR)), DELAY);
      });
      return;
    }
    res.writeHead(404).end();
  })
  .listen(PORT, "127.0.0.1", () => console.log(`fake tts on ${PORT}`));
