import { CATEGORIES, GUIDES } from "@/lib/guides/registry";

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
 * When an ad slot ID is empty, the AdBanner component gracefully renders nothing (null),
 * avoiding broken layout shifts or empty boxes while allowing Google Auto Ads to work on eligible content pages.
 */
export const ADSENSE_SLOTS = {
  HOME_BOTTOM: process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME_BOTTOM || "",
  GUIDES_BOTTOM: process.env.NEXT_PUBLIC_ADSENSE_SLOT_GUIDES_BOTTOM || "",
  ARTICLE_BOTTOM: process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE_BOTTOM || "",
  FAQ_BOTTOM: process.env.NEXT_PUBLIC_ADSENSE_SLOT_FAQ_BOTTOM || "",
} as const;

/**
 * Strict allowlist of public, content-rich routes eligible to load the AdSense script.
 * Excludes authentication (/login, /signup, /reset-password), transient import (/import),
 * private user workspaces (/dashboard, /dictionary, /books/*, /admin/*), and 404 screens.
 */
const ADSENSE_ELIGIBLE_PATHS = new Set<string>([
  "/",
  "/guides",
  "/how-it-works",
  "/faq",
  "/about",
  "/extension",
  ...CATEGORIES.map((c) => `/guides/${c.slug}`),
  ...GUIDES.map((g) => `/guides/${g.slug}`),
]);

export function isAdSenseEligiblePath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return ADSENSE_ELIGIBLE_PATHS.has(pathname);
}
