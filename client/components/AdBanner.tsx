"use client";

import React, { useEffect } from "react";

interface AdBannerProps {
  slot?: string;
  format?: "auto" | "fluid" | "rectangle" | "horizontal";
  responsive?: boolean;
  className?: string;
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
}: AdBannerProps) {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  useEffect(() => {
    if (clientId && slot) {
      try {
        if (typeof window !== "undefined") {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        }
      } catch (err) {
        // Suppress AdSense push errors if ad blockers or duplicate calls occur
        console.warn("AdSense push error:", err);
      }
    }
  }, [clientId, slot]);

  // When no AdSense publisher ID is configured, render nothing to keep the layout clean
  if (!clientId || !slot) {
    return null;
  }

  return (
    <aside
      aria-label="Advertisement"
      className={`my-6 text-center overflow-hidden ${className}`}
    >
      <div className="text-[10px] uppercase tracking-widest text-[#77716D]/60 mb-1">
        Advertisement
      </div>
      <div className="flex justify-center items-center min-h-[90px] rounded-xl border border-[#F0E8E2] bg-[#FFFDF8]">
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={clientId}
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive={responsive ? "true" : "false"}
        />
      </div>
    </aside>
  );
}
