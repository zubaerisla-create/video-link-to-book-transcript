"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { collectAnalyticsEventApi } from "@/lib/api";

const VISITOR_COOKIE_KEY = "transcriptly_vid";
const SESSION_COOKIE_KEY = "transcriptly_sid";
const SESSION_TIME_KEY = "transcriptly_sid_time";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes inactivity timeout

function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") return "";
  try {
    let vid = localStorage.getItem(VISITOR_COOKIE_KEY);
    if (!vid || vid.length < 10) {
      vid = generateUUID();
      localStorage.setItem(VISITOR_COOKIE_KEY, vid);
      document.cookie = `${VISITOR_COOKIE_KEY}=${vid}; path=/; max-age=31536000; SameSite=Lax`;
    }
    return vid;
  } catch {
    return generateUUID();
  }
}

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    const now = Date.now();
    const lastActivity = Number(localStorage.getItem(SESSION_TIME_KEY) || "0");
    let sid = localStorage.getItem(SESSION_COOKIE_KEY);

    // If session expired after 30 mins inactivity or missing, generate new session
    if (!sid || now - lastActivity > SESSION_TIMEOUT_MS) {
      sid = generateUUID();
      localStorage.setItem(SESSION_COOKIE_KEY, sid);
      document.cookie = `${SESSION_COOKIE_KEY}=${sid}; path=/; max-age=86400; SameSite=Lax`;
    }

    localStorage.setItem(SESSION_TIME_KEY, String(now));
    return sid;
  } catch {
    return generateUUID();
  }
}

function getDeviceType(): "desktop" | "mobile" | "tablet" {
  if (typeof window === "undefined") return "desktop";
  const width = window.innerWidth;
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

export function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedRef = useRef<{ path: string; timestamp: number }>({ path: "", timestamp: 0 });

  useEffect(() => {
    // 1. Honor Do-Not-Track browser setting
    if (typeof navigator !== "undefined" && navigator.doNotTrack === "1") {
      return;
    }

    // 2. Do not track internal admin pages as normal visitor traffic
    if (pathname && pathname.startsWith("/admin")) {
      return;
    }

    const currentUrl = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    const now = Date.now();

    // 3. Deduplication: Avoid recording identical page view within 1.5s (React Strict Mode / re-renders)
    if (
      lastTrackedRef.current.path === currentUrl &&
      now - lastTrackedRef.current.timestamp < 1500
    ) {
      return;
    }

    lastTrackedRef.current = { path: currentUrl, timestamp: now };

    const visitorId = getOrCreateVisitorId();
    const sessionId = getOrCreateSessionId();
    const deviceType = getDeviceType();
    const referrer = typeof document !== "undefined" ? document.referrer : "";

    // 4. Send non-blocking beacon/event
    try {
      collectAnalyticsEventApi({
        visitor_id: visitorId,
        session_id: sessionId,
        event_type: "page_view",
        page_path: pathname || "/",
        referrer: referrer || undefined,
        device_type: deviceType,
      }).catch(() => {
        // Silently swallow analytics errors to never disrupt user browsing
      });
    } catch {
      // Ignore
    }
  }, [pathname, searchParams]);

  return null;
}
