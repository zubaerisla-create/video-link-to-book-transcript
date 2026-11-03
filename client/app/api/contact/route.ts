import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/mail";

/**
 * Contact form endpoint.
 *
 * Security properties:
 * - Fixed recipient: messages only ever go to CONTACT_TO_EMAIL (or SMTP_USER).
 *   The visitor's address is used solely as Reply-To, so this cannot act as
 *   an open mail relay.
 * - Same-origin only: requests whose Origin header doesn't match the host are rejected.
 * - Body size capped; all fields validated and length-limited; CR/LF rejected
 *   in fields that reach email headers; HTML-escaped in the email body.
 * - Honeypot field silently drops bot submissions.
 * - Rate limits: per client IP and a global cap. Limits are in-memory and
 *   per-process — adequate for a single VPS process; use a shared store
 *   (e.g. Redis) if the app is scaled horizontally.
 *
 * Client IP: taken from X-Real-IP, else the LAST X-Forwarded-For entry
 * (the one appended by our own reverse proxy). The first XFF entry is
 * client-controlled and must not be trusted.
 */

const SUBJECTS: Record<string, string> = {
  general: "General inquiry",
  bug: "Bug report",
  feature: "Feature request",
  privacy: "Privacy / data request",
  copyright: "Copyright notice",
};

const EMAIL_RE = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/;
const MAX_BODY_BYTES = 16 * 1024;

const IP_WINDOW_MS = 10 * 60 * 1000;
const IP_MAX = 5;
const GLOBAL_WINDOW_MS = 60 * 60 * 1000;
const GLOBAL_MAX = 60;
const MAX_TRACKED_IPS = 10_000;

const ipHits = new Map<string, number[]>();
let globalHits: number[] = [];

function clientIp(req: NextRequest): string {
  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const xff = (req.headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return xff.at(-1) ?? "unknown";
}

function pruneIpHits(now: number) {
  for (const [ip, times] of ipHits) {
    const recent = times.filter((t) => now - t < IP_WINDOW_MS);
    if (recent.length) ipHits.set(ip, recent);
    else ipHits.delete(ip);
  }
}

/** Returns a reason string when the request should be refused. */
function rateLimit(ip: string): string | null {
  const now = Date.now();

  globalHits = globalHits.filter((t) => now - t < GLOBAL_WINDOW_MS);
  if (globalHits.length >= GLOBAL_MAX) return "global";

  if (ipHits.size > MAX_TRACKED_IPS) {
    pruneIpHits(now);
    // Still saturated with active entries: fail closed rather than reset limits.
    if (ipHits.size > MAX_TRACKED_IPS) return "saturated";
  }

  const recent = (ipHits.get(ip) ?? []).filter((t) => now - t < IP_WINDOW_MS);
  if (recent.length >= IP_MAX) {
    ipHits.set(ip, recent);
    return "ip";
  }
  recent.push(now);
  ipHits.set(ip, recent);
  globalHits.push(now);
  return null;
}

function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // non-browser clients; still rate limited
  try {
    const host = req.headers.get("host");
    return Boolean(host && new URL(origin).host === host);
  } catch {
    return false;
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export async function POST(req: NextRequest) {
  const to = process.env.CONTACT_TO_EMAIL || process.env.SMTP_USER;
  if (!to || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.error("Contact form: SMTP_USER/SMTP_PASSWORD (and optionally CONTACT_TO_EMAIL) are not configured.");
    return NextResponse.json({ error: "The contact form is temporarily unavailable." }, { status: 503 });
  }

  if (!sameOrigin(req)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const declaredLength = Number(req.headers.get("content-length") ?? "0");
  if (declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Message is too large." }, { status: 413 });
  }

  let raw: string;
  try {
    raw = await req.text();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Message is too large." }, { status: 413 });
  }

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("not an object");
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Honeypot: real users never fill this hidden field. Pretend success.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ success: true });
  }

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const subjectKey = String(body.subject ?? "general");
  const message = String(body.message ?? "").trim();

  const valid =
    name.length >= 1 &&
    name.length <= 120 &&
    email.length <= 254 &&
    EMAIL_RE.test(email) &&
    message.length >= 10 &&
    message.length <= 5000 &&
    !/[\r\n]/.test(name) &&
    !/[\r\n]/.test(email);
  if (!valid) {
    return NextResponse.json(
      { error: "Please provide your name, a valid email and a message of 10–5000 characters." },
      { status: 400 }
    );
  }

  // Rate limit only well-formed submissions so typos don't use up the quota.
  if (rateLimit(clientIp(req))) {
    return NextResponse.json({ error: "Too many messages. Please try again later." }, { status: 429 });
  }

  const subjectLabel = SUBJECTS[subjectKey] ?? SUBJECTS.general;

  try {
    await sendEmail({
      to,
      replyTo: email,
      subject: `[Transcriptly contact] ${subjectLabel} — ${name}`,
      text: `From: ${name} <${email}>\nTopic: ${subjectLabel}\n\n${message}`,
      html: `<p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;<br/><strong>Topic:</strong> ${escapeHtml(subjectLabel)}</p><p style="white-space:pre-wrap">${escapeHtml(message)}</p>`,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    // Log only the error type/message, never credentials or the visitor's message.
    console.error("Contact form send error:", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Your message could not be sent. Please try again later." }, { status: 502 });
  }
}
