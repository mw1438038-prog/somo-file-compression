
import createGhostscript from "npm:@jspawn/ghostscript-wasm@0.0.2";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
  "Access-Control-Expose-Headers": "X-Request-ID",
};

const MAX_BYTES = 10 * 1024 * 1024;
const WORK_INPUT = "/tmp/input.pdf";
const WORK_OUTPUT = "/tmp/output.pdf";

const DEFAULT_RATE_LIMIT = 10;
const DEFAULT_RATE_WINDOW_SECONDS = 3600;
const RATE_LIMIT_TIMEOUT_MS = 5000;
const AUTH_TIMEOUT_MS = 5000;

let ghostscriptModulePromise: Promise<WebAssembly.Module> | undefined;

const PRESETS = {
  extreme: "/screen",
  recommended: "/ebook",
  less: "/printer",
} as const;

type Level = keyof typeof PRESETS;

class CompressionError extends Error {
  constructor(
    public code: string,
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "CompressionError";
  }
}

function isLevel(value: string): value is Level {
  return Object.prototype.hasOwnProperty.call(PRESETS, value);
}

function positiveIntEnv(name: string, fallback: number): number {
  const parsed = Number.parseInt(Deno.env.get(name) ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  extraHeaders: Record<string, string> = {},
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      ...extraHeaders,
      "Content-Type": "application/json",
    },
  });
}

function logStage(
  requestId: string,
  stage: string,
  startedAt: number,
  details: Record<string, unknown> = {},
): void {
  console.info(
    "compress-pdf stage:",
    JSON.stringify({
      requestId,
      stage,
      durationMs: Math.round(performance.now() - startedAt),
      ...details,
    }),
  );
}

function logEvent(
  requestId: string,
  stage: string,
  details: Record<string, unknown> = {},
): void {
  console.info(
    "compress-pdf event:",
    JSON.stringify({
      requestId,
      stage,
      ...details,
    }),
  );
}

async function loadGhostscriptModule(): Promise<WebAssembly.Module> {
  const wasmBytes = await Deno.readFile(
    new URL(
      import.meta.resolve(
        "npm:@jspawn/ghostscript-wasm@0.0.2/gs.wasm",
      ),
    ),
  );

  return WebAssembly.compile(wasmBytes);
}

async function getGhostscriptModule(): Promise<{
  module: WebAssembly.Module;
  cached: boolean;
}> {
  const reusedPromise = ghostscriptModulePromise !== undefined;
  ghostscriptModulePromise ??= loadGhostscriptModule();

  try {
    return {
      module: await ghostscriptModulePromise,
      cached: reusedPromise,
    };
  } catch (error) {
    ghostscriptModulePromise = undefined;
    throw error;
  }
}

function isPdf(bytes: Uint8Array): boolean {
  const head = new TextDecoder("latin1").decode(
    bytes.subarray(0, 1024),
  );

  return head.includes("%PDF-");
}

/**
 * Dynamically grows the upload buffer.
 * Does not allocate the full 10 MiB limit for small files.
 */
async function readBodyWithLimit(
  req: Request,
  maxBytes: number,
): Promise<Uint8Array | null> {
  if (!req.body) return new Uint8Array(0);

  const reader = req.body.getReader();

  let capacity = Math.min(maxBytes, 64 * 1024);
  let buffer = new Uint8Array(capacity);
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;
      if (!value) continue;

      if (total + value.byteLength > maxBytes) {
        await reader.cancel();
        return null;
      }

      const required = total + value.byteLength;

      if (required > capacity) {
        const newCapacity = Math.min(
          maxBytes,
          Math.max(required, capacity * 2),
        );

        const newBuffer = new Uint8Array(newCapacity);
        newBuffer.set(buffer.subarray(0, total));

        buffer = newBuffer;
        capacity = newCapacity;
      }

      buffer.set(value, total);
      total = required;
    }
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  }

  // Return only the actual file bytes.
  return buffer.slice(0, total);
}

async function discardBody(req: Request): Promise<void> {
  await req.body?.cancel().catch(() => {});
}

async function clientBucketKey(req: Request): Promise<string> {
  const ip =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",").pop()?.trim() ??
    "unknown";

  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`compress-pdf:${ip}`),
  );

  const hex = Array.from(
    new Uint8Array(digest),
    (byte) => byte.toString(16).padStart(2, "0"),
  ).join("");

  return `compress-pdf:${hex}`;
}

async function consumeRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceKey) {
    throw new Error("Rate limiter is not configured");
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
    global: {
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          signal: AbortSignal.timeout(RATE_LIMIT_TIMEOUT_MS),
        }),
    },
  });

  const { data, error } = await admin.rpc("consume_rate_limit", {
    p_key: key,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    throw new Error(`Rate limit check failed: ${error.message}`);
  }

  const row = Array.isArray(data) ? data[0] : null;

  if (!row || typeof row.is_allowed !== "boolean") {
    throw new Error("Rate limit check returned an unexpected response");
  }

  return row as {
    is_allowed: boolean;
    current_hits: number;
    retry_after_seconds: number;
  };
}

/**
 * Classify only errors that have clear PDF-related indicators.
 * Unknown Ghostscript errors remain ordinary server errors.
 */
function classifyGhostscriptError(message: string): Error {
  if (/password|encrypted|encryption/i.test(message)) {
    return new CompressionError(
      "password_protected_pdf",
      422,
      "This PDF is password-protected. Please unlock it and try again.",
    );
  }

  if (
    /PDF file is damaged|Couldn't find trailer|Could not find trailer|Couldn't read xref|Invalid PDF|not a PDF|error reading a content stream|PDF parsing error/i.test(
      message,
    )
  ) {
    return new CompressionError(
      "corrupted_pdf",
      422,
      "This PDF appears to be corrupted or unreadable.",
    );
  }

  return new Error("Ghostscript compression failed");
}

async function runGhostscript(
  input: Uint8Array,
  preset: string,
  requestId: string,
): Promise<Uint8Array> {
  const moduleStartedAt = performance.now();

  logEvent(requestId, "ghostscript_module_loading_started");

  const { module, cached } = await getGhostscriptModule();

  logStage(requestId, "ghostscript_module_ready", moduleStartedAt, {
    cached,
  });

  const initializationStartedAt = performance.now();
  let ghostscriptErrors = "";

  const appendGhostscriptError = (message: string) => {
    if (ghostscriptErrors.length < 2000) {
      ghostscriptErrors += `${message}\n`.slice(
        0,
        2000 - ghostscriptErrors.length,
      );
    }
  };

  logEvent(
    requestId,
    "ghostscript_instance_initialization_started",
  );

  const gs = await createGhostscript({
    thisProgram: "gs",
    noInitialRun: true,
    print: () => {},
    printErr: (message: string) => {
      appendGhostscriptError(message);
    },
    instantiateWasm: (
      imports: WebAssembly.Imports,
      receive: (
        instance: WebAssembly.Instance,
        module: WebAssembly.Module,
      ) => void,
    ) => {
      WebAssembly.instantiate(module, imports).then((instance) => {
        receive(instance, module);
      });

      return {};
    },
  });

  logStage(
    requestId,
    "ghostscript_instance_ready",
    initializationStartedAt,
  );

  try {
    gs.FS.writeFile(WORK_INPUT, input);

    const processingStartedAt = performance.now();

    logEvent(requestId, "ghostscript_processing_started", {
      inputBytes: input.byteLength,
    });

    let exitCode: number;

    try {
      exitCode = gs.callMain([
        "-q",
        "-dNOPAUSE",
        "-dBATCH",
        "-dSAFER",
        "-dPDFSTOPONERROR",
        "-sDEVICE=pdfwrite",
        `-dPDFSETTINGS=${preset}`,
        "-dCompatibilityLevel=1.6",
        `-sOutputFile=${WORK_OUTPUT}`,
        WORK_INPUT,
      ]);
    } catch (error) {
      if (error instanceof Error) {
        appendGhostscriptError(error.message);
      } else if (typeof error === "string") {
        appendGhostscriptError(error);
      }

      const status = (error as { status?: unknown })?.status;

      exitCode = typeof status === "number" ? status : 1;
    }

    if (exitCode !== 0) {
      console.error(
        "compress-pdf Ghostscript exited with an error:",
        JSON.stringify({
          requestId,
          exitCode,
          stderr: ghostscriptErrors,
        }),
      );

      throw classifyGhostscriptError(ghostscriptErrors);
    }

    let output: Uint8Array;

    try {
      output = gs.FS.readFile(WORK_OUTPUT);
    } catch {
      throw new Error("Ghostscript did not create an output PDF");
    }

    if (output.byteLength === 0 || !isPdf(output)) {
      throw new Error("Ghostscript produced an invalid PDF output");
    }

    logStage(
      requestId,
      "ghostscript_processing_complete",
      processingStartedAt,
      {
        inputBytes: input.byteLength,
        outputBytes: output.byteLength,
      },
    );

    return output;
  } finally {
    for (const path of [WORK_INPUT, WORK_OUTPUT]) {
      try {
        gs.FS.unlink(path);
      } catch {
        // File may not exist if processing failed.
      }
    }
  }
}

async function getAuthenticatedUser(
  req: Request,
): Promise<{ id: string; email: string } | null> {
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

    return {
      id: user.id,
      email: user.email,
    };
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  const requestId = crypto.randomUUID();

  const respondJson = (
    body: Record<string, unknown>,
    status: number,
    extraHeaders: Record<string, string> = {},
  ) =>
    jsonResponse(body, status, {
      ...extraHeaders,
      "X-Request-ID": requestId,
    });

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        ...corsHeaders,
        "X-Request-ID": requestId,
      },
    });
  }

  if (req.method !== "POST") {
    return respondJson({ error: "Method not allowed." }, 405);
  }

  const requestStartedAt = performance.now();
  let stage = "authentication";

  try {
    let stageStartedAt = performance.now();

    logEvent(requestId, "authentication_started");

    const user = await getAuthenticatedUser(req);

    logStage(requestId, stage, stageStartedAt, {
      authenticated: user !== null,
    });

    if (!user) {
      await discardBody(req);

      return respondJson(
        {
          error:
            "You must be signed in to compress PDFs. Please log in and try again.",
        },
        401,
      );
    }

    const limit = positiveIntEnv(
      "RATE_LIMIT_MAX_REQUESTS",
      DEFAULT_RATE_LIMIT,
    );

    const windowSeconds = positiveIntEnv(
      "RATE_LIMIT_WINDOW_SECONDS",
      DEFAULT_RATE_WINDOW_SECONDS,
    );

    let rate;

    try {
      stage = "rate_limit";
      stageStartedAt = performance.now();

      logEvent(requestId, "rate_limit_started");

      rate = await consumeRateLimit(
        await clientBucketKey(req),
        limit,
        windowSeconds,
      );

      logStage(requestId, stage, stageStartedAt, {
        allowed: rate.is_allowed,
      });
    } catch (error) {
      console.error(
        "compress-pdf rate limiter error:",
        JSON.stringify({
          requestId,
          durationMs: Math.round(
            performance.now() - stageStartedAt,
          ),
          error: error instanceof Error
            ? error.message.slice(0, 300)
            : "Unknown error",
        }),
      );

      await discardBody(req);

      return respondJson(
        {
          error:
            "The compression service is temporarily unavailable. Please try again shortly.",
        },
        503,
        { "Retry-After": "30" },
      );
    }

    if (!rate.is_allowed) {
      await discardBody(req);

      const retryAfter = Math.max(
        1,
        rate.retry_after_seconds,
      );

      const minutes = Math.ceil(retryAfter / 60);

      return respondJson(
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

      return respondJson(
        { error: "Choose a valid compression level." },
        400,
      );
    }

    const declaredLength = Number(
      req.headers.get("content-length") ?? "0",
    );

    if (declaredLength > MAX_BYTES) {
      await discardBody(req);

      return respondJson(
        {
          code: "file_too_large",
          error:
            "Your PDF is too large. Please upload a PDF smaller than 10 MB.",
        },
        413,
      );
    }

    stage = "upload_read";
    stageStartedAt = performance.now();

    logEvent(requestId, "upload_read_started", {
      declaredBytes: Number.isFinite(declaredLength)
        ? declaredLength
        : null,
    });

    const input = await readBodyWithLimit(req, MAX_BYTES);

    if (input !== null) {
      logStage(requestId, stage, stageStartedAt, {
        inputBytes: input.byteLength,
      });
    }

    if (input === null) {
      return respondJson(
        {
          code: "file_too_large",
          error:
            "Your PDF is too large. Please upload a PDF smaller than 10 MB.",
        },
        413,
      );
    }

    if (input.byteLength === 0) {
      return respondJson(
        {
          code: "invalid_pdf",
          error: "The uploaded file is empty.",
        },
        415,
      );
    }

    if (!isPdf(input)) {
      return respondJson(
        {
          code: "invalid_pdf",
          error: "The uploaded file is not a valid PDF.",
        },
        415,
      );
    }

    stage = "ghostscript";

    const compressed = await runGhostscript(
      input,
      PRESETS[level],
      requestId,
    );

    const applied = compressed.byteLength < input.byteLength;
    const body = applied ? compressed : input;

    // Convert Uint8Array into an ArrayBuffer for Response compatibility.
    const responseBody = new ArrayBuffer(body.byteLength);
    new Uint8Array(responseBody).set(body);

    return new Response(responseBody, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Cache-Control": "no-store",
        "Content-Length": String(body.byteLength),
        "X-Request-ID": requestId,
        "X-Original-Size": String(input.byteLength),
        "X-Compressed-Size": String(body.byteLength),
        "X-Compression-Applied": applied ? "true" : "false",
        "X-RateLimit-Remaining": String(
          Math.max(0, limit - rate.current_hits),
        ),
        "Access-Control-Expose-Headers":
          "X-Request-ID, X-Original-Size, X-Compressed-Size, X-Compression-Applied, X-RateLimit-Remaining",
      },
    });
  } catch (error) {
    if (error instanceof CompressionError) {
      return respondJson(
        {
          code: error.code,
          error: error.message,
        },
        error.status,
      );
    }

    console.error(
      "compress-pdf failed:",
      JSON.stringify({
        requestId,
        stage,
        durationMs: Math.round(
          performance.now() - requestStartedAt,
        ),
        errorName: error instanceof Error
          ? error.name
          : "UnknownError",
        errorMessage: error instanceof Error
          ? error.message.slice(0, 500)
          : "Unknown error",
        errorStack: error instanceof Error
          ? error.stack?.slice(0, 2000)
          : undefined,
      }),
    );

    return respondJson(
      {
        code: "compression_failed",
        error: "The compression service encountered an error.",
      },
      500,
    );
  }
});
