import createGhostscript from "npm:@jspawn/ghostscript-wasm@0.0.2";
import { PDFDocument } from "npm:pdf-lib@1.17.1";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const MAX_BYTES = 6 * 1024 * 1024;
const WORK_INPUT = "/tmp/input.pdf";
const WORK_OUTPUT = "/tmp/output.pdf";

const DEFAULT_RATE_LIMIT = 10;
const DEFAULT_RATE_WINDOW_SECONDS = 3600;
const RATE_LIMIT_TIMEOUT_MS = 5000;
const AUTH_TIMEOUT_MS = 5000;

const PRESETS = {
  extreme: "/screen",
  recommended: "/ebook",
  less: "/printer",
} as const;

type Level = keyof typeof PRESETS;

function isLevel(value: string): value is Level {
  return value in PRESETS;
}

function positiveIntEnv(name: string, fallback: number): number {
  const parsed = Number.parseInt(Deno.env.get(name) ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function jsonResponse(body: Record<string, unknown>, status: number, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, ...extraHeaders, "Content-Type": "application/json" },
  });
}

function isPdf(bytes: Uint8Array): boolean {
  const head = new TextDecoder("latin1").decode(bytes.subarray(0, 1024));
  return head.includes("%PDF-");
}

async function readPageCount(bytes: Uint8Array): Promise<number | null> {
  try {
    const doc = await PDFDocument.load(bytes, { updateMetadata: false });
    return doc.getPageCount();
  } catch {
    return null;
  }
}

async function readBodyWithLimit(req: Request, maxBytes: number): Promise<Uint8Array | null> {
  if (!req.body) return new Uint8Array(0);
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

async function discardBody(req: Request): Promise<void> {
  await req.body?.cancel().catch(() => {});
}

async function clientBucketKey(req: Request): Promise<string> {
  const ip = req.headers.get("cf-connecting-ip")
    ?? req.headers.get("x-real-ip")
    ?? req.headers.get("x-forwarded-for")?.split(",").pop()?.trim()
    ?? "unknown";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`compress-pdf:${ip}`));
  const hex = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  return `compress-pdf:${hex}`;
}

async function consumeRateLimit(key: string, limit: number, windowSeconds: number) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) throw new Error("Rate limiter is not configured");
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
    global: {
      fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(RATE_LIMIT_TIMEOUT_MS) }),
    },
  });
  const { data, error } = await admin.rpc("consume_rate_limit", {
    p_key: key,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) throw new Error(`Rate limit check failed: ${error.message}`);
  const row = Array.isArray(data) ? data[0] : null;
  if (!row || typeof row.is_allowed !== "boolean") throw new Error("Rate limit check returned an unexpected response");
  return row as { is_allowed: boolean; current_hits: number; retry_after_seconds: number };
}

async function runGhostscript(input: Uint8Array, preset: string): Promise<Uint8Array> {
  const wasmBytes = await Deno.readFile(
    new URL(import.meta.resolve("npm:@jspawn/ghostscript-wasm@0.0.2/gs.wasm")),
  );

  const gs = await createGhostscript({
    thisProgram: "gs",
    noInitialRun: true,
    print: () => {},
    printErr: () => {},
    instantiateWasm: (
      imports: WebAssembly.Imports,
      receive: (instance: WebAssembly.Instance, module: WebAssembly.Module) => void,
    ) => {
      WebAssembly.instantiate(wasmBytes, imports).then(({ instance, module }) => receive(instance, module));
      return {};
    },
  });

  gs.FS.writeFile(WORK_INPUT, input);
  try {
    let exitCode: number;
    try {
      exitCode = gs.callMain([
        "-q",
        "-dNOPAUSE",
        "-dBATCH",
        "-dSAFER",
        "-sDEVICE=pdfwrite",
        `-dPDFSETTINGS=${preset}`,
        "-dCompatibilityLevel=1.6",
        `-sOutputFile=${WORK_OUTPUT}`,
        WORK_INPUT,
      ]);
    } catch (err) {
      exitCode = typeof (err as { status?: unknown })?.status === "number"
        ? (err as { status: number }).status
        : 1;
    }
    if (exitCode !== 0) {
      throw new Error(`Ghostscript exited with status ${exitCode}`);
    }
    return gs.FS.readFile(WORK_OUTPUT);
  } finally {
    for (const path of [WORK_INPUT, WORK_OUTPUT]) {
      try {
        gs.FS.unlink(path);
      } catch {
        // Output is absent when compression failed before writing it.
      }
    }
  }
}

async function getAuthenticatedUser(req: Request): Promise<{ id: string; email: string } | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  if (!token) return null;

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!supabaseUrl) return null;

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      },
      signal: AbortSignal.timeout(AUTH_TIMEOUT_MS),
    });
    if (!response.ok) return null;
    const user = await response.json();
    if (!user?.id || !user?.email) return null;
    return { id: user.id, email: user.email };
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      await discardBody(req);
      return jsonResponse(
        { error: "You must be signed in to compress PDFs. Please log in and try again." },
        401,
      );
    }

    const limit = positiveIntEnv("RATE_LIMIT_MAX_REQUESTS", DEFAULT_RATE_LIMIT);
    const windowSeconds = positiveIntEnv("RATE_LIMIT_WINDOW_SECONDS", DEFAULT_RATE_WINDOW_SECONDS);

    let rate;
    try {
      rate = await consumeRateLimit(await clientBucketKey(req), limit, windowSeconds);
    } catch (err) {
      console.error("compress-pdf rate limiter error:", err);
      return jsonResponse(
        { error: "The compression service is temporarily unavailable. Please try again shortly." },
        503,
        { "Retry-After": "30" },
      );
    }
    if (!rate.is_allowed) {
      await discardBody(req);
      const retryAfter = Math.max(1, rate.retry_after_seconds);
      const minutes = Math.ceil(retryAfter / 60);
      return jsonResponse(
        {
          error: `You have reached the limit of ${limit} compressions per ${Math.round(windowSeconds / 60)} minutes. Please try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`,
          retryAfterSeconds: retryAfter,
        },
        429,
        { "Retry-After": String(retryAfter) },
      );
    }

    const level = new URL(req.url).searchParams.get("level") ?? "";
    if (!isLevel(level)) {
      await discardBody(req);
      return jsonResponse({ error: "Choose a valid compression level." }, 400);
    }

    const declaredLength = Number(req.headers.get("content-length") ?? "0");
    if (declaredLength > MAX_BYTES) {
      await discardBody(req);
      return jsonResponse({ error: "This file is larger than the 6 MB limit." }, 413);
    }

    const input = await readBodyWithLimit(req, MAX_BYTES);
    if (input === null) {
      return jsonResponse({ error: "This file is larger than the 6 MB limit." }, 413);
    }
    if (input.byteLength === 0) {
      return jsonResponse({ error: "The uploaded file is empty." }, 400);
    }
    if (!isPdf(input)) {
      return jsonResponse({ error: "The uploaded file is not a valid PDF." }, 415);
    }

    const inputPages = await readPageCount(input);
    if (inputPages === null) {
      return jsonResponse(
        { error: "We could not read this PDF. It may be damaged or password-protected." },
        422,
      );
    }

    const compressed = await runGhostscript(input, PRESETS[level]);
    const outputPages = await readPageCount(compressed);
    if (outputPages !== inputPages) {
      throw new Error(`Page count mismatch: ${inputPages} in, ${outputPages} out`);
    }

    const applied = compressed.byteLength < input.byteLength;
    const body = applied ? compressed : input;

    return new Response(body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Cache-Control": "no-store",
        "Content-Length": String(body.byteLength),
        "X-Original-Size": String(input.byteLength),
        "X-Compressed-Size": String(body.byteLength),
        "X-Compression-Applied": applied ? "true" : "false",
        "X-RateLimit-Remaining": String(Math.max(0, limit - rate.current_hits)),
        "Access-Control-Expose-Headers": "X-Original-Size, X-Compressed-Size, X-Compression-Applied, X-RateLimit-Remaining",
      },
    });
  } catch (err) {
    console.error("compress-pdf failed:", err);
    return jsonResponse(
      { error: "We could not compress this PDF. It may be damaged or password-protected." },
      500,
    );
  }
});
