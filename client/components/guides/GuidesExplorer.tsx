"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Clock, ArrowRight } from "lucide-react";

export type ExplorerGuide = {
  slug: string;
  title: string;
  description: string;
  category: string;
  categoryName: string;
  readingMinutes: number;
};

type Props = {
  guides: ExplorerGuide[];
  categories: { slug: string; name: string }[];
};

/**
 * Client-side search and category filter for the guides hub.
 * The full list is also rendered server-side (in category sections) so
 * every guide is linked in the initial HTML for crawlers and no-JS readers.
 */
export function GuidesExplorer({ guides, categories }: Props) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("all");

  const results = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    return guides.filter((g) => {
      if (cat !== "all" && g.category !== cat) return false;
      if (!terms.length) return true;
      const hay = `${g.title} ${g.description} ${g.categoryName}`.toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
  }, [guides, query, cat]);

  const active = query.trim() !== "" || cat !== "all";

  return (
    <section aria-labelledby="search-guides" className="rounded-3xl border border-[#F0E8E2] bg-white p-5 shadow-xs sm:p-6">
      <h2 id="search-guides" className="sr-only">Search the guides</h2>
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#77716D]" aria-hidden="true" />
        <label htmlFor="guide-search" className="sr-only">Search guides</label>
        <input
          id="guide-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search guides — e.g. SRT, Whisper, vocabulary, lecture notes"
          className="w-full rounded-2xl border border-[#F0E8E2] bg-[#FFFDF8] py-3 pl-11 pr-4 text-sm text-[#292522] placeholder:text-[#9A938E] focus:border-[#E9A9C3] focus:outline-none focus:ring-2 focus:ring-[#F8DDE8]"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
        {[{ slug: "all", name: "All guides" }, ...categories].map((c) => (
          <button
            key={c.slug}
            type="button"
            onClick={() => setCat(c.slug)}
            aria-pressed={cat === c.slug}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              cat === c.slug
                ? "border-[#E9A9C3] bg-[#F8DDE8] text-[#292522]"
                : "border-[#F0E8E2] bg-white text-[#77716D] hover:text-[#292522]"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {active && (
        <div className="mt-5" aria-live="polite">
          <p className="mb-3 text-xs text-[#77716D]">
            {results.length} {results.length === 1 ? "guide" : "guides"} found
          </p>
          {results.length === 0 ? (
            <p className="rounded-2xl bg-[#FFFDF8] p-4 text-sm text-[#77716D]">
              Nothing matches that search. Try a broader word like &ldquo;captions&rdquo; or &ldquo;notes&rdquo;.
            </p>
          ) : (
            <ul className="divide-y divide-[#F0E8E2]">
              {results.map((g) => (
                <li key={g.slug}>
                  <Link href={`/guides/${g.slug}`} className="group flex items-start justify-between gap-4 py-3">
                    <span>
                      <span className="block text-sm font-semibold text-[#292522] group-hover:underline">{g.title}</span>
                      <span className="mt-0.5 block text-xs text-[#77716D]">
                        {g.categoryName} · <Clock className="inline h-3 w-3" aria-hidden="true" /> {g.readingMinutes} min
                      </span>
                    </span>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[#77716D] group-hover:text-[#292522]" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
