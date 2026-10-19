"use client";

import React, { useEffect, useRef } from "react";
import { ADSENSE_CLIENT_ID } from "@/lib/adsense";

interface AdBannerProps {
  slot?: string;
  format?: "auto" | "fluid" | "rectangle" | "horizontal" | "vertical";
  responsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

export function AdBanner({
  slot,
  format = "auto",
  responsive = true,
  className = "",
  style,
}: AdBannerProps) {
  const insRef = useRef<HTMLModElement | null>(null);
  const pushedRef = useRef(false);

  useEffect(() => {
    if (!ADSENSE_CLIENT_ID || !slot) return;

    const insElement = insRef.current;
    if (!insElement) return;

    // Prevent duplicate push in React StrictMode, remounts, or if AdSense already processed the element
    if (pushedRef.current || insElement.getAttribute("data-adsbygoogle-status")) {
      return;
    }

    try {
      if (typeof window !== "undefined") {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        pushedRef.current = true;
      }
    } catch (err) {
      // Suppress AdSense push errors if ad blockers or duplicate calls occur
      console.warn("AdSense push notice:", err);
    }
  }, [slot]);

  // When no AdSense client ID or slot is configured, render nothing to keep the layout clean
  if (!ADSENSE_CLIENT_ID || !slot) {
    return null;
  }

  return (
    <aside
      aria-label="Advertisement"
      className={`my-8 text-center overflow-hidden ${className}`}
    >
      <div className="text-[10px] uppercase tracking-widest text-[#77716D]/60 mb-1 select-none">
        Advertisement
      </div>
      <div className="flex justify-center items-center min-h-[90px] rounded-2xl border border-[#F0E8E2] bg-[#FFFDF8] p-2">
        <ins
          ref={insRef}
          className="adsbygoogle"
          style={{ display: "block", minHeight: "90px", width: "100%", ...style }}
          data-ad-client={ADSENSE_CLIENT_ID}
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive={responsive ? "true" : "false"}
        />
      </div>
    </aside>
  );
}
