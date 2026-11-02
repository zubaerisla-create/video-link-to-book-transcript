import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Calendar, Clock, RefreshCw } from "lucide-react";
import { AdBanner } from "@/components/AdBanner";
import { ADSENSE_SLOTS } from "@/lib/adsense";
import { Markdown } from "@/lib/guides/markdown";
import {
  CATEGORIES,
  CATEGORY_BY_SLUG,
  GUIDES,
  GUIDE_BY_SLUG,
  formatDate,
  guidesInCategory,
  lastModified,
  type Category,
  type GuideMeta,
} from "@/lib/guides/registry";
import { loadGuide } from "@/lib/guides/content";
import {
  Breadcrumbs,
  CategoryPill,
  GuideCard,
  JsonLd,
  SITE_URL,
  TableOfContents,
  breadcrumbSchema,
} from "@/components/guides/GuideParts";

/**
 * /guides/<slug> serves both individual guides and category hubs
 * (e.g. /guides/language-learning). Slugs never collide: category slugs
 * are nouns, guide slugs are full titles.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return [...CATEGORIES.map((c) => ({ slug: c.slug })), ...GUIDES.map((g) => ({ slug: g.slug }))];
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = CATEGORY_BY_SLUG.get(slug as Category["slug"]);
  if (category) {
    return {
      title: `${category.name} Guides`,
      description: category.intro.slice(0, 158).replace(/\s\S*$/, "") + "…",
      alternates: { canonical: `/guides/${category.slug}` },
      openGraph: { type: "website", url: `/guides/${category.slug}`, title: `${category.name} Guides — Transcriptly`, description: category.description },
      twitter: { card: "summary", title: `${category.name} Guides — Transcriptly`, description: category.description },
    };
  }
  const guide = GUIDE_BY_SLUG.get(slug);
  if (!guide) return {};
  const url = `/guides/${guide.slug}`;
  return {
    title: guide.seoTitle ?? guide.title,
    description: guide.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: guide.title,
      description: guide.description,
      publishedTime: guide.published,
      modifiedTime: lastModified(guide),
      section: CATEGORY_BY_SLUG.get(guide.category)!.name,
    },
    twitter: { card: "summary", title: guide.title, description: guide.description },
  };
}

export default async function GuideOrCategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = CATEGORY_BY_SLUG.get(slug as Category["slug"]);
  if (category) return <CategoryPage category={category} />;
  const guide = GUIDE_BY_SLUG.get(slug);
  if (!guide) notFound();
  return <GuideArticle meta={guide} />;
}

/* -------------------------------- Category -------------------------------- */

function CategoryPage({ category }: { category: Category }) {
  const guides = guidesInCategory(category.slug).map(loadGuide);
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "Guides", href: "/guides" },
    { name: category.name, href: `/guides/${category.slug}` },
  ];
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <JsonLd data={breadcrumbSchema(crumbs)} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `${category.name} Guides`,
          url: `${SITE_URL}/guides/${category.slug}`,
          hasPart: guides.map((g) => ({ "@type": "Article", headline: g.title, url: `${SITE_URL}/guides/${g.slug}` })),
        }}
      />
      <Breadcrumbs items={crumbs} />
      <header className="mb-10 max-w-3xl">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#77716D]">Guide category</p>
        <h1 className="text-3xl font-bold tracking-tight text-[#292522] sm:text-4xl">{category.name}</h1>
        <p className="mt-4 text-base leading-relaxed text-[#5f5955] sm:text-lg">{category.intro}</p>
      </header>
      <div className="grid gap-5 md:grid-cols-2">
        {guides.map((g) => (
          <GuideCard key={g.slug} guide={g} />
        ))}
      </div>
      <nav aria-label="Other categories" className="mt-14 border-t border-[#F0E8E2] pt-8">
        <p className="mb-3 text-sm font-semibold text-[#292522]">Other categories</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.filter((c) => c.slug !== category.slug).map((c) => (
            <Link key={c.slug} href={`/guides/${c.slug}`} className="rounded-full border border-[#F0E8E2] bg-white px-4 py-2 text-sm text-[#292522] hover:border-[#E9A9C3]">
              {c.name}
            </Link>
          ))}
          <Link href="/guides" className="rounded-full border border-[#F0E8E2] bg-[#FFFDF8] px-4 py-2 text-sm text-[#292522] hover:border-[#E9A9C3]">
            All guides
          </Link>
        </div>
      </nav>
    </div>
  );
}

/* --------------------------------- Article -------------------------------- */

function GuideArticle({ meta }: { meta: GuideMeta }) {
  const guide = loadGuide(meta);
  const category = CATEGORY_BY_SLUG.get(guide.category)!;
  const siblings = guidesInCategory(guide.category);
  const pos = siblings.findIndex((g) => g.slug === guide.slug);
  const prev = pos > 0 ? siblings[pos - 1] : undefined;
  const next = pos < siblings.length - 1 ? siblings[pos + 1] : undefined;
  const related = guide.related.map((s) => GUIDE_BY_SLUG.get(s)).filter((g): g is GuideMeta => !!g).map(loadGuide);
  const url = `${SITE_URL}/guides/${guide.slug}`;
  const wasUpdated = !!guide.updated && guide.updated !== guide.published;

  const crumbs = [
    { name: "Home", href: "/" },
    { name: "Guides", href: "/guides" },
    { name: category.name, href: `/guides/${category.slug}` },
    { name: guide.title, href: `/guides/${guide.slug}` },
  ];

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    datePublished: guide.published,
    dateModified: lastModified(guide),
    wordCount: guide.wordCount,
    articleSection: category.name,
    inLanguage: "en",
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    author: { "@type": "Organization", name: "Transcriptly", url: SITE_URL },
    publisher: { "@type": "Organization", name: "Transcriptly", url: SITE_URL, logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` } },
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <JsonLd data={articleSchema} />
      <JsonLd data={breadcrumbSchema(crumbs)} />
      <Breadcrumbs items={crumbs} />

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_240px] lg:gap-14">
        <article className="min-w-0">
          <header className="mb-8 border-b border-[#F0E8E2] pb-8">
            <Link href={`/guides/${category.slug}`} className="inline-block">
              <CategoryPill slug={guide.category} />
            </Link>
            <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-[#292522] sm:text-[2.5rem] sm:leading-[1.15]">
              {guide.title}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#5f5955] sm:text-lg">{guide.description}</p>
            <dl className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#77716D]">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                <dt className="sr-only">Published</dt>
                <dd><time dateTime={guide.published}>Published {formatDate(guide.published)}</time></dd>
              </div>
              {wasUpdated && (
                <div className="flex items-center gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  <dt className="sr-only">Updated</dt>
                  <dd><time dateTime={guide.updated}>Updated {formatDate(guide.updated!)}</time></dd>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                <dt className="sr-only">Reading time</dt>
                <dd>{guide.readingMinutes} min read</dd>
              </div>
            </dl>
          </header>

          {/* Mobile table of contents */}
          {guide.headings.filter((h) => h.level === 2).length >= 3 && (
            <details className="mb-8 rounded-2xl border border-[#F0E8E2] bg-white p-4 lg:hidden">
              <summary className="cursor-pointer text-sm font-semibold text-[#292522]">Contents</summary>
              <div className="mt-4">
                <TableOfContents headings={guide.headings} />
              </div>
            </details>
          )}

          <div className="max-w-[44rem] space-y-5 text-[1.0625rem] leading-[1.8] text-[#3d3834]">
            <Markdown source={guide.body} />
          </div>

          <AdBanner slot={ADSENSE_SLOTS.ARTICLE_BOTTOM} />

          {/* Call to action */}
          <aside className="mt-12 max-w-[44rem] rounded-3xl border border-[#F0E8E2] bg-[#FFFDF8] p-6 sm:p-8">
            <p className="text-lg font-bold text-[#292522]">Put this guide into practice</p>
            <p className="mt-2 text-sm leading-relaxed text-[#5f5955]">
              Paste a YouTube link into Transcriptly to get clean paragraphs, timestamped segments and TXT, SRT or JSON
              exports. Create a free account if you want to save transcripts as books and build a word list.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/" className="inline-flex items-center rounded-xl bg-[#E9A9C3] px-5 py-2.5 text-sm font-semibold text-[#292522] hover:bg-[#DE91B1]">
                Open the transcript tool
              </Link>
              <Link href="/extension" className="inline-flex items-center rounded-xl border border-[#F0E8E2] bg-white px-5 py-2.5 text-sm font-semibold text-[#292522] hover:border-[#E9A9C3]">
                Get the Chrome extension
              </Link>
            </div>
          </aside>

          {/* Previous / next within category */}
          {(prev || next) && (
            <nav aria-label={`More in ${category.name}`} className="mt-10 grid max-w-[44rem] gap-4 sm:grid-cols-2">
              {prev ? (
                <Link href={`/guides/${prev.slug}`} className="group rounded-2xl border border-[#F0E8E2] bg-white p-4 hover:border-[#E9A9C3]">
                  <span className="flex items-center gap-1 text-xs text-[#77716D]"><ArrowLeft className="h-3 w-3" aria-hidden="true" /> Previous</span>
                  <span className="mt-1 block text-sm font-semibold text-[#292522]">{prev.title}</span>
                </Link>
              ) : <span />}
              {next && (
                <Link href={`/guides/${next.slug}`} className="group rounded-2xl border border-[#F0E8E2] bg-white p-4 text-right hover:border-[#E9A9C3]">
                  <span className="flex items-center justify-end gap-1 text-xs text-[#77716D]">Next <ArrowRight className="h-3 w-3" aria-hidden="true" /></span>
                  <span className="mt-1 block text-sm font-semibold text-[#292522]">{next.title}</span>
                </Link>
              )}
            </nav>
          )}
        </article>

        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-8">
            <TableOfContents headings={guide.headings} />
            <div className="rounded-2xl border border-[#F0E8E2] bg-white p-4 text-xs leading-relaxed text-[#77716D]">
              <p className="font-semibold text-[#292522]">Found an error?</p>
              <p className="mt-1">
                If something here no longer matches how Transcriptly works, <Link href="/contact" className="underline">tell us</Link> and we&apos;ll correct it.
              </p>
            </div>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related" className="mt-16 border-t border-[#F0E8E2] pt-10">
          <h2 id="related" className="mb-5 text-xl font-bold text-[#292522]">Related guides</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((g) => (
              <GuideCard key={g.slug} guide={g} compact />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
