import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { adminEmails } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type ApiError = { error: string; details?: unknown };

export function jsonError(status: number, error: string, details?: unknown) {
  return NextResponse.json<ApiError>({ error, ...(details === undefined ? {} : { details }) }, { status });
}

export async function parseJson<S extends z.ZodType>(request: Request, schema: S) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { ok: false as const, response: jsonError(400, "invalid_json") };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, response: jsonError(400, "invalid_body", z.treeifyError(parsed.error)) };
  }
  return { ok: true as const, data: parsed.data as z.infer<S> };
}

export function parseQuery<S extends z.ZodType>(request: Request, schema: S) {
  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  const parsed = schema.safeParse(params);
  if (!parsed.success) {
    return { ok: false as const, response: jsonError(400, "invalid_query", z.treeifyError(parsed.error)) };
  }
  return { ok: true as const, data: parsed.data as z.infer<S> };
}

/** Supabase client + verified user for API routes, or a 401 response. */
export async function requireApiUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return { ok: false as const, response: jsonError(401, "unauthorized") };
  return { ok: true as const, supabase, user: data.user };
}

export async function requireApiAdmin() {
  const auth = await requireApiUser();
  if (!auth.ok) return auth;
  const email = auth.user.email?.toLowerCase();
  if (!email || !adminEmails().includes(email)) return { ok: false as const, response: jsonError(403, "forbidden") };
  return auth;
}

export function serverError(scope: string, error: unknown) {
  console.error(`[api] ${scope}:`, error);
  return jsonError(500, "server_error");
}
