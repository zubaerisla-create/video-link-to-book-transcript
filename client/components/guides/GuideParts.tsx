import Link from "next/link";
import { ArrowRight, ChevronRight, Clock } from "lucide-react";
import { CATEGORY_BY_SLUG } from "@/lib/guides/registry";
import type { LoadedGuide } from "@/lib/guides/content";
import type { Heading } from "@/lib/guides/markdown";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://habd.tech";

/** Serializes JSON-LD safely (escapes "<" so content can't close the script tag). */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export type Crumb = { name: string; href: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-xs text-[#77716D]">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={c.href} className="flex min-w-0 items-center gap-1.5">
              {last ? (
                <span aria-current="page" className="truncate font-medium text-[#292522]">{c.name}</span>
              ) : (
                <>
                  <Link href={c.href} className="hover:text-[#292522] hover:underline">{c.name}</Link>
                  <ChevronRight className="h-3 w-3 shrink-0" aria-hidden="true" />
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function breadcrumbSchema(items: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: `${SITE_URL}${c.href === "/" ? "" : c.href}`,
    })),
  };
}

export function CategoryPill({ slug }: { slug: LoadedGuide["category"] }) {
  const cat = CATEGORY_BY_SLUG.get(slug)!;
  return (
    <span className="inline-flex items-center rounded-full border border-[#F0E8E2] bg-[#FFF1B8] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[#292522]">
      {cat.shortName}
    </span>
  );
}

export function GuideCard({ guide, compact = false }: { guide: LoadedGuide; compact?: boolean }) {
  return (
    <Link
      href={`/guides/${guide.slug}`}
      className="group flex h-full flex-col justify-between rounded-3xl border border-[#F0E8E2] bg-white p-6 shadow-xs transition-all hover:border-[#E9A9C3] hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E9A9C3]"
    >
      <div>
        <div className="mb-3 flex items-center gap-2">
          <CategoryPill slug={guide.category} />
          <span className="flex items-center gap-1 text-xs text-[#77716D]">
            <Clock className="h-3 w-3" aria-hidden="true" />
            {guide.readingMinutes} min read
          </span>
        </div>
        <h3 className={`${compact ? "text-base" : "text-lg"} mb-2 font-bold leading-snug text-[#292522]`}>{guide.title}</h3>
        {!compact && <p className="text-sm leading-relaxed text-[#77716D]">{guide.description}</p>}
      </div>
      <span className="mt-5 flex items-center gap-1.5 border-t border-[#F0E8E2]/70 pt-4 text-sm font-semibold text-[#292522] transition-transform group-hover:translate-x-1">
        Read guide <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </span>
    </Link>
  );
}

export function TableOfContents({ headings }: { headings: Heading[] }) {
  const items = headings.filter((h) => h.level === 2);
  if (items.length < 3) return null;
  return (
    <nav aria-label="Table of contents">
      <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[#292522]">On this page</p>
      <ol className="space-y-2 border-l border-[#F0E8E2] text-sm">
        {items.map((h) => (
          <li key={h.id}>
            <a href={`#${h.id}`} className="-ml-px block border-l-2 border-transparent pl-3 leading-snug text-[#77716D] hover:border-[#E9A9C3] hover:text-[#292522]">
              {h.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
