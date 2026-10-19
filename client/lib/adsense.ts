/**
 * Google AdSense Configuration
 * Publisher ID: ca-pub-1237330753277157
 *
 * Central configuration for Google AdSense client and ad slots.
 */

export const ADSENSE_CLIENT_ID =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || "ca-pub-1237330753277157";

/**
 * Optional Manual Ad Unit Slots.
 *
 * How to get slot IDs from Google AdSense:
 * 1. Log in to your Google AdSense account (https://adsense.google.com).
 * 2. Navigate to: Ads -> By ad unit.
 * 3. Choose "Display ads" (or "In-article ads").
 * 4. Name your ad unit (e.g. "Transcriptly Home Bottom") and set size to "Responsive".
 * 5. Click "Create".
 * 6. Copy the `data-ad-slot` numeric ID (e.g. "1234567890") and set it in your environment
 *    variables or in this file.
 *
 * When an ad slot ID is empty, the AdBanner component gracefully renders nothing (null),
 * avoiding broken layout shifts or empty boxes while allowing Google Auto Ads to work globally.
 */
export const ADSENSE_SLOTS = {
  HOME_BOTTOM: process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME_BOTTOM || "",
  GUIDES_BOTTOM: process.env.NEXT_PUBLIC_ADSENSE_SLOT_GUIDES_BOTTOM || "",
  ARTICLE_BOTTOM: process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE_BOTTOM || "",
  FAQ_BOTTOM: process.env.NEXT_PUBLIC_ADSENSE_SLOT_FAQ_BOTTOM || "",
} as const;
