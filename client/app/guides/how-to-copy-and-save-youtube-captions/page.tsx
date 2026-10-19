import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Clock, Calendar, CheckCircle2, Download, BookOpen } from "lucide-react";
import { AdBanner } from "@/components/AdBanner";
import { ADSENSE_SLOTS } from "@/lib/adsense";

export const metadata: Metadata = {
  title: "How to Copy, Format, and Save YouTube Captions",
  description:
    "Learn how to extract clean YouTube captions without timecode clutter, export files as TXT, JSON, or SRT, and save permanent digital books.",
  alternates: {
    canonical: "/guides/how-to-copy-and-save-youtube-captions",
  },
};

export default function Guide2Page() {
  const publishedDate = "2026-10-16";
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "How to Copy, Format, and Save YouTube Captions",
    description:
      "Learn how to extract caption text without messy timestamps, download standard SRT and TXT files, and save transcripts into a digital book reader.",
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
      "@id": "https://transcriptly.net/guides/how-to-copy-and-save-youtube-captions",
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
        <span className="text-[#292522] font-medium truncate">Copy & Save Captions</span>
      </nav>

      {/* Header */}
      <header className="mb-10">
        <div className="inline-flex items-center rounded-full bg-[#FFF1B8] px-3.5 py-1 text-xs font-semibold tracking-wider text-[#292522] uppercase mb-4 border border-[#F0E8E2]">
          <span>Productivity</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#292522] leading-tight mb-4">
          How to Copy, Format, and Save YouTube Captions
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-xs text-[#77716D] border-b border-[#F0E8E2] pb-6">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>October 16, 2026</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>5 min read</span>
          </div>
          <span>•</span>
          <span>By Transcriptly Editorial Team</span>
        </div>
      </header>

      {/* Body */}
      <div className="space-y-8 text-sm sm:text-base text-[#77716D] leading-relaxed">
        <p className="text-base sm:text-lg text-[#292522] font-medium leading-relaxed">
          Anyone who has tried copying captions from YouTube knows the frustration: text is broken into 3-word chunks, littered with timecodes, and missing proper paragraph formatting. Here is how to format and export captions properly.
        </p>

        {/* Section 1: The Problem with Raw Captions */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold text-[#292522]">
            Why Raw Subtitle Copying is Inconvenient
          </h2>
          <p>
            Subtitles on YouTube are synchronized to screen display intervals (typically 2 to 4 seconds). When you copy them manually, you get line after line of incomplete clauses:
          </p>
          <div className="rounded-xl border border-[#F0E8E2] bg-[#FFFDF8] p-4 font-mono text-xs text-[#292522] space-y-1">
            <p>0:12 in this video we are going</p>
            <p>0:14 to explore how neural networks</p>
            <p>0:16 learn representations from data</p>
          </div>
          <p>
            To use this in a research paper, article, or study guide, you have to spend 15 minutes deleting timecodes and rejoining broken sentences.
          </p>
        </section>

        {/* Section 2: One-Click Formatted Copy */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-[#292522]">
            1. One-Click Formatted Copy with Transcriptly
          </h2>
          <p>
            Transcriptly uses sentence boundary detection and timing pauses to assemble caption fragments into coherent paragraphs:
          </p>
          <ul className="list-disc list-inside space-y-2 text-xs sm:text-sm pl-1">
            <li><strong>Paragraph View:</strong> Automatically groups spoken dialogue into well-structured paragraphs with capitalization and punctuation.</li>
            <li><strong>Timestamped View:</strong> When you need exact timecodes for reference, click the &ldquo;Timestamped&rdquo; tab to inspect start times for each segment.</li>
            <li><strong>One-Click Copy:</strong> Click the &ldquo;Copy All&rdquo; button to place the entire formatted text into your clipboard, ready to paste into Notion, Google Docs, or Obsidian.</li>
          </ul>
        </section>

        {/* Section 3: Universal Export Formats */}
        <section className="space-y-4 rounded-2xl border border-[#F0E8E2] bg-[#FFFDF8] p-6">
          <div className="flex items-center gap-2 text-base font-bold text-[#292522]">
            <Download className="h-5 w-5 text-[#292522]" />
            <h2 className="text-xl font-bold text-[#292522]">2. Choosing the Right Export Format</h2>
          </div>
          <p>
            Depending on your project, you can download transcripts in multiple formats using the &ldquo;Export&rdquo; dropdown:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="rounded-xl border border-[#F0E8E2] bg-white p-4">
              <span className="font-bold text-xs uppercase tracking-wider text-[#292522] block mb-1">Plain Text (.txt)</span>
              <p className="text-xs text-[#77716D]">
                Clean, unadorned paragraph text. Perfect for note apps, reading, and pasting into generative AI assistants.
              </p>
            </div>
            <div className="rounded-xl border border-[#F0E8E2] bg-white p-4">
              <span className="font-bold text-xs uppercase tracking-wider text-[#292522] block mb-1">SubRip (.srt)</span>
              <p className="text-xs text-[#77716D]">
                Standard subtitle file with millisecond timecodes (<code>00:01:23,450</code>). Compatible with video editors like Premiere Pro and Final Cut.
              </p>
            </div>
            <div className="rounded-xl border border-[#F0E8E2] bg-white p-4">
              <span className="font-bold text-xs uppercase tracking-wider text-[#292522] block mb-1">Structured JSON (.json)</span>
              <p className="text-xs text-[#77716D]">
                Includes metadata, paragraph arrays, and timecodes. Ideal for developers building search indexes or analysis tools.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: Saving to Personal Digital Reader */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-base font-bold text-[#292522]">
            <BookOpen className="h-5 w-5 text-[#292522]" />
            <h2 className="text-xl font-bold text-[#292522]">3. Saving to Your Personal Library as a Digital Book</h2>
          </div>
          <p>
            If you want to read a 2-hour lecture or podcast comfortably later without keeping a browser tab open, click <strong>&ldquo;Save to My Library&rdquo;</strong> in Transcriptly:
          </p>
          <ul className="list-disc list-inside space-y-2 text-xs sm:text-sm pl-1">
            <li>Edit the book title to give your transcript a descriptive name.</li>
            <li>Access your saved books anytime from your dashboard.</li>
            <li>Enjoy a distraction-free reader with Sepia, Light, and Dark themes.</li>
            <li>Resume from where you stopped with automatic reading progress tracking.</li>
            <li>Download a real PDF book with page numbers and Unicode Bangla/multilingual font rendering.</li>
          </ul>
        </section>

        {/* AdSense Unit (Manual Slot or Auto Ad placeholder) */}
        <AdBanner slot={ADSENSE_SLOTS.ARTICLE_BOTTOM} />

        {/* Related Guides */}
        <div className="pt-8 border-t border-[#F0E8E2] space-y-4">
          <h3 className="text-base font-bold text-[#292522]">Related Guides:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
            <Link
              href="/guides/how-to-use-transcripts-for-studying-research"
              className="rounded-xl border border-[#F0E8E2] bg-white p-3 hover:border-[#E9A9C3] transition-colors"
            >
              <span className="font-semibold text-[#292522] block">Transcripts for Study & Research →</span>
              <span className="text-[#77716D]">How students and researchers take efficient notes.</span>
            </Link>
            <Link
              href="/guides/understanding-transcript-languages-and-timestamps"
              className="rounded-xl border border-[#F0E8E2] bg-white p-3 hover:border-[#E9A9C3] transition-colors"
            >
              <span className="font-semibold text-[#292522] block">Understanding Languages & SRT →</span>
              <span className="text-[#77716D]">How timecodes and auto-generated captions work.</span>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
