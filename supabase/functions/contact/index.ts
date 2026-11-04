import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const RATE_LIMIT_MAX_REQUESTS = 5;
const RATE_LIMIT_WINDOW_SECONDS = 3600;
const RATE_LIMIT_TIMEOUT_MS = 5000;
const EMAIL_TIMEOUT_MS = 10_000;

const ADMIN_EMAIL = "mw1438038@gmail.com";
const EMAIL_FROM = "Somo File Compression <onboarding@resend.dev>";
const RESEND_API_URL = "https://api.resend.com/emails";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ContactPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
  website?: string;
}

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, ...extraHeaders, "Content-Type": "application/json" },
  });
}

function validateField(
  value: string,
  minLen: number,
  maxLen: number,
  label: string,
): string | null {
  const trimmed = value.trim();
  if (trimmed.length < minLen) {
    return `${label} must be at least ${minLen} character${minLen === 1 ? "" : "s"}.`;
  }
  if (trimmed.length > maxLen) {
    return `${label} must be ${maxLen} characters or fewer.`;
  }
  return null;
}

function validatePayload(payload: ContactPayload): Record<string, string> | null {
  const errors: Record<string, string> = {};

  const nameErr = validateField(payload.name, 1, 100, "Name");
  if (nameErr) errors.name = nameErr;

  const emailTrimmed = payload.email.trim();
  if (emailTrimmed.length < 1) {
    errors.email = "Please enter your email address.";
  } else if (!EMAIL_RE.test(emailTrimmed)) {
    errors.email = "Please enter a valid email address.";
  } else if (emailTrimmed.length > 254) {
    errors.email = "Email must be 254 characters or fewer.";
  }

  const subjectErr = validateField(payload.subject, 3, 200, "Subject");
  if (subjectErr) errors.subject = subjectErr;

  const messageErr = validateField(payload.message, 10, 5000, "Message");
  if (messageErr) errors.message = messageErr;

  return Object.keys(errors).length > 0 ? errors : null;
}

async function clientBucketKey(req: Request): Promise<string> {
  const ip =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",").pop()?.trim() ??
    "unknown";
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`contact:${ip}`),
  );
  const hex = Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
  return `contact:${hex}`;
}

async function discardBody(req: Request): Promise<void> {
  await req.body?.cancel().catch(() => {});
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildAdminEmailHtml(
  name: string,
  email: string,
  subject: string,
  message: string,
  submittedAt: string,
): string {
  return `\
<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
  <h2 style="color:#e11d48;margin-bottom:24px;">New Contact Form Submission</h2>
  <table style="width:100%;border-collapse:collapse;">
    <tr>
      <td style="padding:8px 0;font-weight:600;color:#374151;width:120px;">Name</td>
      <td style="padding:8px 0;color:#111827;">${escapeHtml(name)}</td>
    </tr>
    <tr>
      <td style="padding:8px 0;font-weight:600;color:#374151;">Email</td>
      <td style="padding:8px 0;color:#111827;"><a href="mailto:${escapeHtml(email)}" style="color:#e11d48;">${escapeHtml(email)}</a></td>
    </tr>
    <tr>
      <td style="padding:8px 0;font-weight:600;color:#374151;">Subject</td>
      <td style="padding:8px 0;color:#111827;">${escapeHtml(subject)}</td>
    </tr>
    <tr>
      <td style="padding:8px 0;font-weight:600;color:#374151;vertical-align:top;">Message</td>
      <td style="padding:8px 0;color:#111827;white-space:pre-wrap;">${escapeHtml(message)}</td>
    </tr>
    <tr>
      <td style="padding:8px 0;font-weight:600;color:#374151;">Submitted</td>
      <td style="padding:8px 0;color:#6b7280;">${escapeHtml(submittedAt)}</td>
    </tr>
  </table>
  <p style="margin-top:32px;font-size:12px;color:#9ca3af;">This notification was sent from the Somo File Compression contact form.</p>
</div>`;
}

async function sendAdminNotification(
  name: string,
  email: string,
  subject: string,
  message: string,
  submittedAt: string,
): Promise<void> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    console.error("contact: RESEND_API_KEY is not configured — skipping email notification");
    return;
  }

  const emailPayload = {
    from: EMAIL_FROM,
    to: ADMIN_EMAIL,
    reply_to: email,
    subject: `[Contact Form] ${subject}`,
    html: buildAdminEmailHtml(name, email, subject, message, submittedAt),
  };

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(emailPayload),
    signal: AbortSignal.timeout(EMAIL_TIMEOUT_MS),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "unknown error");
    throw new Error(`Resend API returned ${response.status}: ${errorBody}`);
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
    let payload: ContactPayload;
    try {
      payload = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid request body." }, 400);
    }

    if (typeof payload !== "object" || payload === null) {
      return jsonResponse({ error: "Invalid request body." }, 400);
    }

    // Honeypot: if the hidden website field is filled, pretend success.
    if (typeof payload.website === "string" && payload.website.trim() !== "") {
      return jsonResponse({ success: true }, 200);
    }

    // Server-side field validation
    const fieldErrors = validatePayload(payload);
    if (fieldErrors) {
      return jsonResponse({ error: "Validation failed.", fields: fieldErrors }, 422);
    }

    // Rate limit per IP using the persistent database-backed function
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) {
      console.error("contact: missing server configuration");
      return jsonResponse(
        { error: "The contact service is not available right now. Please try again later." },
        503,
      );
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
      global: {
        fetch: (input, init) =>
          fetch(input, { ...init, signal: AbortSignal.timeout(RATE_LIMIT_TIMEOUT_MS) }),
      },
    });

    let rate;
    try {
      const { data, error } = await admin.rpc("consume_rate_limit", {
        p_key: await clientBucketKey(req),
        p_limit: RATE_LIMIT_MAX_REQUESTS,
        p_window_seconds: RATE_LIMIT_WINDOW_SECONDS,
      });
      if (error) throw new Error(`Rate limit check failed: ${error.message}`);
      const row = Array.isArray(data) ? data[0] : null;
      if (!row || typeof row.is_allowed !== "boolean") {
        throw new Error("Rate limit check returned an unexpected response");
      }
      rate = row as { is_allowed: boolean; current_hits: number; retry_after_seconds: number };
    } catch (err) {
      console.error("contact rate limiter error:", err);
      return jsonResponse(
        { error: "The contact service is temporarily unavailable. Please try again shortly." },
        503,
        { "Retry-After": "30" },
      );
    }

    if (!rate.is_allowed) {
      const retryAfter = Math.max(1, rate.retry_after_seconds);
      const minutes = Math.ceil(retryAfter / 60);
      return jsonResponse(
        {
          error: `You have reached the limit of ${RATE_LIMIT_MAX_REQUESTS} messages per hour. Please try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`,
          retryAfterSeconds: retryAfter,
        },
        429,
        { "Retry-After": String(retryAfter) },
      );
    }

    // Insert the submission using service_role (bypasses RLS)
    const { error: insertError } = await admin.from("contact_submissions").insert({
      name: payload.name.trim(),
      email: payload.email.trim(),
      subject: payload.subject.trim(),
      message: payload.message.trim(),
    });

    if (insertError) {
      console.error("contact insert error:", insertError);
      return jsonResponse(
        { error: "We could not save your message right now. Please try again in a moment." },
        500,
      );
    }

    // Send admin notification email — failure here does NOT undo the saved submission.
    const submittedAt = new Date().toISOString();
    try {
      await sendAdminNotification(
        payload.name.trim(),
        payload.email.trim(),
        payload.subject.trim(),
        payload.message.trim(),
        submittedAt,
      );
    } catch (emailErr) {
      console.error("contact: email notification failed (submission was saved):", emailErr);
    }

    return jsonResponse({ success: true }, 201);
  } catch (err) {
    console.error("contact function failed:", err);
    return jsonResponse(
      { error: "Something went wrong. Please try again." },
      500,
    );
  }
});
