"use client";

import { usePathname } from "next/navigation";
import { ADSENSE_CLIENT_ID, isAdSenseEligiblePath } from "@/lib/adsense";

/**
 * Renders the official Google AdSense script tag only on eligible public content pages.
 * Uses a native <script> element (instead of next/script) so Next.js does not inject
 * the unsupported `data-nscript` attribute, and prevents Auto Ads from loading on
 * login, signup, reset-password, import, private dashboard, or 404 pages.
 */
export function AdSenseScript() {
  const pathname = usePathname();

  if (!ADSENSE_CLIENT_ID || !isAdSenseEligiblePath(pathname)) {
    return null;
  }

  return (
    <script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
      crossOrigin="anonymous"
    />
  );
}
