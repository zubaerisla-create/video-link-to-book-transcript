import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://habd.tech";
  const now = new Date();

  const routes: { path: string; priority: number; changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never" }[] = [
    { path: "", priority: 1.0, changeFrequency: "daily" },
    { path: "/extension", priority: 0.9, changeFrequency: "weekly" },
    { path: "/how-it-works", priority: 0.8, changeFrequency: "weekly" },
    { path: "/guides", priority: 0.8, changeFrequency: "weekly" },
    { path: "/guides/how-to-use-chrome-extension", priority: 0.8, changeFrequency: "weekly" },
    { path: "/guides/how-to-get-transcript-from-youtube", priority: 0.7, changeFrequency: "monthly" },
    { path: "/guides/how-to-copy-and-save-youtube-captions", priority: 0.7, changeFrequency: "monthly" },
    { path: "/guides/how-to-fix-missing-unavailable-captions", priority: 0.7, changeFrequency: "monthly" },
    { path: "/guides/how-to-use-transcripts-for-studying-research", priority: 0.7, changeFrequency: "monthly" },
    { path: "/guides/understanding-transcript-languages-and-timestamps", priority: 0.7, changeFrequency: "monthly" },
    { path: "/faq", priority: 0.7, changeFrequency: "weekly" },
    { path: "/about", priority: 0.6, changeFrequency: "monthly" },
    { path: "/contact", priority: 0.6, changeFrequency: "monthly" },
    { path: "/privacy", priority: 0.5, changeFrequency: "yearly" },
    { path: "/terms", priority: 0.5, changeFrequency: "yearly" },
    { path: "/copyright", priority: 0.5, changeFrequency: "yearly" },
  ];

  return routes.map((route) => ({
    url: `${siteUrl}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
