import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Clock, Calendar, GraduationCap, CheckCircle2, Search, BookOpen } from "lucide-react";

export const metadata: Metadata = {
  title: "How to Use Video Transcripts for Studying and Research",
  description:
    "Learn proven strategies for students and researchers to convert long YouTube video lectures into searchable study notes, academic citations, and digital books.",
  alternates: {
    canonical: "/guides/how-to-use-transcripts-for-studying-research",
  },
};

export default function Guide4Page() {
  const publishedDate = "2026-10-16";
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "How to Use Video Transcripts for Studying and Research",
    description:
      "Proven strategies for students, researchers, and content creators to turn long video lectures into searchable study notes, quotes, and reading books.",
    datePublished: publishedDate,
    dateModified: publishedDate,
    author: {
      "@type": "Organization",
      name: "Transcriptly Team",
    },
    publisher: {
      "@type": "Organization",
      name: "Transcriptly",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": "https://transcriptly.net/guides/how-to-use-transcripts-for-studying-research",
    },
  };

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 text-xs text-[#77716D]">
        <Link href="/" className="hover:text-[#292522]">Home</Link>
        <span>/</span>
        <Link href="/guides" className="hover:text-[#292522]">Guides</Link>
        <span>/</span>
        <span className="text-[#292522] font-medium truncate">Studying & Research</span>
      </nav>

      {/* Header */}
      <header className="mb-10">
        <div className="inline-flex items-center rounded-full bg-[#FFF1B8] px-3.5 py-1 text-xs font-semibold tracking-wider text-[#292522] uppercase mb-4 border border-[#F0E8E2]">
          <span>Learning Strategies</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#292522] leading-tight mb-4">
          How to Use Video Transcripts for Studying and Research
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-xs text-[#77716D] border-b border-[#F0E8E2] pb-6">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>October 16, 2026</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>6 min read</span>
          </div>
          <span>•</span>
          <span>By Transcriptly Editorial Team</span>
        </div>
      </header>

      {/* Body */}
      <div className="space-y-8 text-sm sm:text-base text-[#77716D] leading-relaxed">
        <p className="text-base sm:text-lg text-[#292522] font-medium leading-relaxed">
          Online video lectures and conference presentations offer tremendous educational value, but video is inherently linear and difficult to scan. Turning video into structured text transforms passive watching into active, high-retention learning.
        </p>

        {/* Strategy 1: The Reading Speed Advantage */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold text-[#292522]">
            1. The Reading Speed Advantage
          </h2>
          <p>
            The average speaker communicates at roughly 130 to 160 words per minute on YouTube. Even watching at 1.5x speed only increases that to about 220 wpm. By contrast, an average adult reads text at 250 to 300 words per minute, and skimming for specific concepts can easily reach 500+ wpm.
          </p>
          <p>
            By extracting the transcript, you can digest a 60-minute university lecture in 15 to 20 minutes without missing crucial technical definitions.
          </p>
        </section>

        {/* Strategy 2: Instant Searchability */}
        <section className="space-y-3 rounded-2xl border border-[#F0E8E2] bg-[#FFFDF8] p-6">
          <div className="flex items-center gap-2 text-base font-bold text-[#292522]">
            <Search className="h-5 w-5 text-[#292522]" />
            <h2 className="text-xl font-bold text-[#292522]">2. Instant In-Text Search</h2>
          </div>
          <p>
            Video scrubbing is notoriously imprecise. When revising for an exam, finding where a professor explained &ldquo;Bayes&apos; Theorem&rdquo; or &ldquo;mitochondrial respiration&rdquo; often wastes 10 minutes of manual scrubbing.
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm pl-1">
            <li>In Transcriptly, use the built-in search box to immediately highlight every mention of a key term.</li>
            <li>In the Digital Book Reader, search within the book to jump straight to the relevant page.</li>
            <li>Cross-reference the timestamp to jump to that exact second in the original video if visual diagrams are needed.</li>
          </ul>
        </section>

        {/* Strategy 3: Accurate Academic Citations */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold text-[#292522]">
            3. Verbatim Quotes and Academic Citations
          </h2>
          <p>
            When writing academic papers, research essays, or journalistic reports, accurate attribution is essential. Transcribing spoken quotes by ear often leads to subtle errors and misquotations.
          </p>
          <p>
            Transcriptly preserves the speaker&apos;s exact verbatim words. When you switch to the <strong>Timestamped</strong> tab, you have the exact timecode for your APA, MLA, or Chicago style citations (e.g., <em>&ldquo;Smith, 2024, 14:32&rdquo;</em>).
          </p>
        </section>

        {/* Strategy 4: Converting Lectures to Digital Books */}
        <section className="space-y-4 rounded-2xl border border-[#F0E8E2] bg-white p-6 shadow-xs">
          <div className="flex items-center gap-2 text-base font-bold text-[#292522]">
            <BookOpen className="h-5 w-5 text-[#292522]" />
            <h2 className="text-xl font-bold text-[#292522]">4. Distraction-Free Offline Reading</h2>
          </div>
          <p>
            Studying directly in a web browser tab open to YouTube is a recipe for distraction from algorithmic recommendations, comments, and ads.
          </p>
          <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm pl-1">
            <li>Click <strong>&ldquo;Save to My Library&rdquo;</strong> to convert the transcript into an ebook in your private dashboard.</li>
            <li>Use the <strong>Sepia</strong> theme to reduce blue light during evening study sessions.</li>
            <li>Turn on <strong>Page-by-Page</strong> mode to read in manageable cognitive chunks rather than one overwhelming infinite wall of text.</li>
            <li>Export a formatted <strong>PDF</strong> to load onto your iPad, Kindle, or e-reader for offline study.</li>
          </ol>
        </section>

        {/* Related Guides */}
        <div className="pt-8 border-t border-[#F0E8E2] space-y-4">
          <h3 className="text-base font-bold text-[#292522]">Related Guides:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
            <Link
              href="/guides/how-to-copy-and-save-youtube-captions"
              className="rounded-xl border border-[#F0E8E2] bg-white p-3 hover:border-[#E9A9C3] transition-colors"
            >
              <span className="font-semibold text-[#292522] block">Copy & Save Captions →</span>
              <span className="text-[#77716D]">Export TXT, SRT, and PDF files.</span>
            </Link>
            <Link
              href="/guides/understanding-transcript-languages-and-timestamps"
              className="rounded-xl border border-[#F0E8E2] bg-white p-3 hover:border-[#E9A9C3] transition-colors"
            >
              <span className="font-semibold text-[#292522] block">Languages & Timestamps →</span>
              <span className="text-[#77716D]">How multilingual captions and timecodes work.</span>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
