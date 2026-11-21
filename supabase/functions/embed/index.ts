// Supabase Edge Function: text embeddings with the built-in gte-small model
// (384 dimensions, free, runs inside the Edge Runtime).
//
// POST { "texts": string[] }  ->  { "embeddings": number[][] }
// Protected by a shared secret header: x-embed-secret: <EMBEDDING_FUNCTION_SECRET>

// Minimal ambient types for the Supabase Edge Runtime globals used below.
declare const Supabase: {
  ai: {
    Session: new (model: string) => {
      run(input: string, options: { mean_pool: boolean; normalize: boolean }): Promise<unknown>;
    };
  };
};
declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (req: Request) => Response | Promise<Response>): void;
};

type Session = InstanceType<typeof Supabase.ai.Session>;
let session: Session | null = null;
// Created on first use so that a cold start without the model cached never fails the boot.
function getSession(): Session {
  session ??= new Supabase.ai.Session("gte-small");
  return session;
}
const MAX_TEXTS = 32;
const MAX_CHARS = 4000;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const secret = Deno.env.get("EMBEDDING_FUNCTION_SECRET");
  if (!secret || req.headers.get("x-embed-secret") !== secret) {
    return json({ error: "unauthorized" }, 401);
  }

  let texts: unknown;
  try {
    texts = (await req.json())?.texts;
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  if (
    !Array.isArray(texts) ||
    texts.length === 0 ||
    texts.length > MAX_TEXTS ||
    !texts.every((t) => typeof t === "string" && t.trim().length > 0)
  ) {
    return json({ error: `texts must be 1..${MAX_TEXTS} non-empty strings` }, 400);
  }

  try {
    const embeddings: number[][] = [];
    for (const text of texts as string[]) {
      const output = await getSession().run(text.slice(0, MAX_CHARS), { mean_pool: true, normalize: true });
      embeddings.push(Array.from(output as number[]));
    }
    return json({ embeddings });
  } catch (error) {
    return json({ error: "embedding_failed", detail: String(error) }, 500);
  }
});
