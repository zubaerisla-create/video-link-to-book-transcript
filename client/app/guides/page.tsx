import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AdBanner } from "@/components/AdBanner";
import { ADSENSE_SLOTS } from "@/lib/adsense";
import { CATEGORIES, CATEGORY_BY_SLUG, lastModified } from "@/lib/guides/registry";
import { loadAllGuides } from "@/lib/guides/content";
import { GuidesExplorer } from "@/components/guides/GuidesExplorer";
import { Breadcrumbs, GuideCard, JsonLd, SITE_URL, breadcrumbSchema } from "@/components/guides/GuideParts";

export const metadata: Metadata = {
  title: "Transcriptly Guides: Transcripts, Study Workflows & Language Learning",
  description:
    "The Transcriptly knowledge base: practical guides on extracting YouTube transcripts, export formats, turning lectures into study notes, learning languages with video, and how speech recognition works.",
  alternates: { canonical: "/guides" },
  openGraph: {
    type: "website",
    url: "/guides",
    title: "Transcriptly Guides & Knowledge Base",
    description:
      "Practical guides on video transcripts, study workflows, language learning and transcription technology.",
  },
  twitter: {
    card: "summary",
    title: "Transcriptly Guides & Knowledge Base",
    description:
      "Practical guides on video transcripts, study workflows, language learning and transcription technology.",
  },
};

const CRUMBS = [
  { name: "Home", href: "/" },
  { name: "Guides", href: "/guides" },
];

export default function GuidesHubPage() {
  const guides = loadAllGuides();
  const featured = guides.filter((g) => g.featured).slice(0, 6);
  const recent = [...guides]
    .sort((a, b) => lastModified(b).localeCompare(lastModified(a)))
    .slice(0, 5);

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Transcriptly Guides",
    url: `${SITE_URL}/guides`,
    hasPart: guides.map((g) => ({ "@type": "Article", headline: g.title, url: `${SITE_URL}/guides/${g.slug}` })),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <JsonLd data={breadcrumbSchema(CRUMBS)} />
      <JsonLd data={collectionSchema} />
      <Breadcrumbs items={CRUMBS} />

      {/* Intro */}
      <header className="mb-10 grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-end">
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#77716D]">Transcriptly knowledge base</p>
          <h1 className="text-3xl font-bold tracking-tight text-[#292522] sm:text-[2.6rem] sm:leading-[1.15]">
            Learn more from every video you watch
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#5f5955] sm:text-lg">
            {guides.length} practical guides on getting transcripts out of YouTube, turning them into notes and readable
            books, learning languages with real video, and understanding how captions and speech recognition actually work.
          </p>
        </div>
        <div className="rounded-3xl border border-[#F0E8E2] bg-[#FFFDF8] p-5 text-sm leading-relaxed text-[#5f5955]">
          <p className="font-semibold text-[#292522]">How these guides are written</p>
          <p className="mt-1.5">
            Each guide describes what Transcriptly actually does today and says plainly where it falls short. When a
            guide compares tools, it explains the method rather than quoting numbers we haven&apos;t measured.
          </p>
        </div>
      </header>

      <GuidesExplorer
        guides={guides.map((g) => ({
          slug: g.slug,
          title: g.title,
          description: g.description,
          category: g.category,
          categoryName: CATEGORY_BY_SLUG.get(g.category)!.name,
          readingMinutes: g.readingMinutes,
        }))}
        categories={CATEGORIES.map((c) => ({ slug: c.slug, name: c.shortName }))}
      />

      {/* Category navigation */}
      <nav aria-label="Guide categories" className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            href={`/guides/${c.slug}`}
            className="group rounded-3xl border border-[#F0E8E2] bg-white p-5 transition-colors hover:border-[#E9A9C3]"
          >
            <span className="block text-sm font-bold text-[#292522]">{c.name}</span>
            <span className="mt-1.5 block text-xs leading-relaxed text-[#77716D]">{c.description}</span>
            <span className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#292522]">
              {guides.filter((g) => g.category === c.slug).length} guides
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </span>
          </Link>
        ))}
      </nav>

      {/* Featured */}
      <section aria-labelledby="featured" className="mt-14">
        <h2 id="featured" className="mb-5 text-xl font-bold text-[#292522] sm:text-2xl">Start with these</h2>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {featured.map((g) => (
            <GuideCard key={g.slug} guide={g} />
          ))}
        </div>
      </section>

      {/* Recent */}
      <section aria-labelledby="recent" className="mt-14 rounded-3xl border border-[#F0E8E2] bg-white p-6 sm:p-8">
        <h2 id="recent" className="mb-4 text-xl font-bold text-[#292522]">Recently published and updated</h2>
        <ul className="divide-y divide-[#F0E8E2]">
          {recent.map((g) => (
            <li key={g.slug} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
              <Link href={`/guides/${g.slug}`} className="text-sm font-semibold text-[#292522] hover:underline">
                {g.title}
              </Link>
              <span className="shrink-0 text-xs text-[#77716D]">
                {CATEGORY_BY_SLUG.get(g.category)!.shortName} · {g.readingMinutes} min read
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Every guide, grouped by category (server-rendered so all links are crawlable) */}
      {CATEGORIES.map((c) => (
        <section key={c.slug} aria-labelledby={`cat-${c.slug}`} className="mt-14">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 id={`cat-${c.slug}`} className="text-xl font-bold text-[#292522] sm:text-2xl">{c.name}</h2>
              <p className="mt-1 max-w-2xl text-sm text-[#77716D]">{c.description}</p>
            </div>
            <Link href={`/guides/${c.slug}`} className="text-sm font-semibold text-[#292522] underline decoration-[#E9A9C3] decoration-2 underline-offset-4">
              View category
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {guides
              .filter((g) => g.category === c.slug)
              .map((g) => (
                <GuideCard key={g.slug} guide={g} />
              ))}
          </div>
        </section>
      ))}

      <AdBanner slot={ADSENSE_SLOTS.GUIDES_BOTTOM} />

      <section className="mt-16 rounded-3xl border border-[#F0E8E2] bg-[#FFFDF8] p-8 text-center sm:p-10">
        <h2 className="text-xl font-bold text-[#292522] sm:text-2xl">Try it on a video you&apos;re watching</h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[#77716D]">
          Paste a YouTube link into Transcriptly to get readable paragraphs, timestamped segments and exports — no account needed.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex items-center justify-center rounded-xl bg-[#E9A9C3] px-6 py-2.5 text-sm font-semibold text-[#292522] shadow-xs transition-colors hover:bg-[#DE91B1]"
        >
          Open the transcript tool
        </Link>
      </section>
    </div>
  );
}
