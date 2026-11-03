import type { MetadataRoute } from "next";
import { CATEGORIES, GUIDES, guidesInCategory, lastModified } from "@/lib/guides/registry";

/**
 * Public, indexable pages only. Authenticated or private routes
 * (/dashboard, /dictionary, /books, /import, /admin, /login, /signup,
 * /reset-password) are intentionally excluded.
 *
 * lastModified values are real content dates (not the build time), so
 * search engines aren't told every page changed on every deploy.
 * Update STATIC_PAGES dates when those pages' content changes.
 */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://habd.tech";

type Freq = MetadataRoute.Sitemap[number]["changeFrequency"];

const STATIC_PAGES: { path: string; modified: string; priority: number; changeFrequency: Freq }[] = [
  { path: "", modified: "2026-11-02", priority: 1.0, changeFrequency: "weekly" },
  { path: "/guides", modified: "2026-11-02", priority: 0.9, changeFrequency: "weekly" },
  { path: "/extension", modified: "2026-10-17", priority: 0.8, changeFrequency: "monthly" },
  { path: "/how-it-works", modified: "2026-10-16", priority: 0.7, changeFrequency: "monthly" },
  { path: "/faq", modified: "2026-10-19", priority: 0.6, changeFrequency: "monthly" },
  { path: "/about", modified: "2026-10-16", priority: 0.5, changeFrequency: "yearly" },
  { path: "/contact", modified: "2026-11-02", priority: 0.5, changeFrequency: "yearly" },
  { path: "/privacy", modified: "2026-11-02", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", modified: "2026-10-16", priority: 0.3, changeFrequency: "yearly" },
  { path: "/copyright", modified: "2026-11-02", priority: 0.3, changeFrequency: "yearly" },
];

const asDate = (iso: string) => new Date(`${iso}T00:00:00Z`);

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = STATIC_PAGES.map((p) => ({
    url: `${SITE_URL}${p.path}`,
    lastModified: asDate(p.modified),
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));

  const categories: MetadataRoute.Sitemap = CATEGORIES.map((c) => ({
    url: `${SITE_URL}/guides/${c.slug}`,
    lastModified: asDate(
      guidesInCategory(c.slug)
        .map(lastModified)
        .sort()
        .at(-1)!
    ),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const guides: MetadataRoute.Sitemap = GUIDES.map((g) => ({
    url: `${SITE_URL}/guides/${g.slug}`,
    lastModified: asDate(lastModified(g)),
    changeFrequency: "monthly",
    priority: g.featured ? 0.8 : 0.7,
  }));

  return [...pages, ...categories, ...guides];
}
