import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Clock, Calendar, Globe2, FileCode, Languages, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Understanding YouTube Transcript Languages, Timestamps, and SRT Files",
  description:
    "Learn how YouTube subtitle tracks operate, how millisecond timecodes are formatted in SRT files, and how to read multilingual captions in Bangla, English, and more.",
  alternates: {
    canonical: "/guides/understanding-transcript-languages-and-timestamps",
  },
};

export default function Guide5Page() {
  const publishedDate = "2026-10-16";
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Understanding Transcript Languages, Timestamps, and SRT Files",
    description:
      "Explore how YouTube auto-captions differ from manual tracks, how millisecond timecodes work in SRT files, and how multilingual subtitles are handled.",
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
      "@id": "https://transcriptly.net/guides/understanding-transcript-languages-and-timestamps",
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
        <span className="text-[#292522] font-medium truncate">Languages & Timestamps</span>
      </nav>

      {/* Header */}
      <header className="mb-10">
        <div className="inline-flex items-center rounded-full bg-[#FFF1B8] px-3.5 py-1 text-xs font-semibold tracking-wider text-[#292522] uppercase mb-4 border border-[#F0E8E2]">
          <span>Technical Guide</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#292522] leading-tight mb-4">
          Understanding Transcript Languages, Timestamps, and SRT Files
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
          YouTube hosts videos in hundreds of languages, each with different caption formats, timing syncs, and auto-generation qualities. Here is an overview of how subtitles and timecodes work under the hood.
        </p>

        {/* Section 1: Manual vs Auto-Generated Subtitles */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-[#292522]">
            1. Manual Subtitles vs. Auto-Generated Captions
          </h2>
          <p>
            When inspecting a video&apos;s available subtitle tracks, you will typically encounter two distinct categories:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="rounded-2xl border border-[#F0E8E2] bg-white p-5 shadow-xs">
              <span className="font-bold text-sm text-[#292522] block mb-2">Creator-Uploaded Subtitles</span>
              <p className="text-xs text-[#77716D] leading-relaxed">
                Authored by the video creator, professional translators, or community contributors. They feature perfect spelling, correct punctuation, domain jargon accuracy, and proper capitalization.
              </p>
            </div>

            <div className="rounded-2xl border border-[#F0E8E2] bg-white p-5 shadow-xs">
              <span className="font-bold text-sm text-[#292522] block mb-2">Auto-Generated (ASR) Captions</span>
              <p className="text-xs text-[#77716D] leading-relaxed">
                Produced automatically by YouTube&apos;s machine learning speech recognition models. Often lack sentence-ending periods, commas, and may misspell names, but provide verbatim phonetic accuracy.
              </p>
            </div>
          </div>
          <p className="text-xs sm:text-sm">
            Transcriptly always prioritizes official creator-uploaded caption tracks whenever available. If only automated tracks exist, our paragraph reassembly engine adds natural punctuation boundaries based on speaker pauses.
          </p>
        </section>

        {/* Section 2: Multilingual Support & Non-Latin Scripts */}
        <section className="space-y-3 rounded-2xl border border-[#F0E8E2] bg-[#FFFDF8] p-6">
          <div className="flex items-center gap-2 text-base font-bold text-[#292522]">
            <Globe2 className="h-5 w-5 text-[#292522]" />
            <h2 className="text-xl font-bold text-[#292522]">2. Native Multilingual and Bangla (বাংলা) Support</h2>
          </div>
          <p className="text-xs sm:text-sm leading-relaxed">
            Many generic video tools inadvertently mangle non-Latin writing systems (such as Bengali/Bangla, Hindi, Arabic, Hebrew, Japanese, or Cyrillic) through improper UTF-8 encoding or forced English machine translation.
          </p>
          <ul className="list-disc list-inside space-y-2 text-xs sm:text-sm pl-1">
            <li><strong>Auto Language Detection:</strong> Transcriptly inspects the language tag (e.g., <code>bn</code> for Bangla, <code>en</code> for English, <code>es</code> for Spanish) and displays the original script verbatim.</li>
            <li><strong>Aligned Translation:</strong> When you choose to translate a transcript, Transcriptly provides a <strong>Side-by-Side</strong> view where original and translated paragraphs are rendered in parallel columns—an invaluable tool for language learners and bilingual researchers.</li>
            <li><strong>Unicode PDF Rendering:</strong> Our PDF export engine embeds true Unicode glyphs so complex conjunct characters in Bangla render cleanly without broken boxes or missing vowel signs.</li>
          </ul>
        </section>

        {/* Section 3: Understanding SRT Subtitle Files */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-base font-bold text-[#292522]">
            <FileCode className="h-5 w-5 text-[#292522]" />
            <h2 className="text-xl font-bold text-[#292522]">3. Anatomy of a SubRip (.SRT) File</h2>
          </div>
          <p>
            When you choose <strong>Export → SRT</strong> in Transcriptly, the output follows the universal SubRip file specification:
          </p>
          <div className="rounded-xl border border-[#F0E8E2] bg-white p-5 font-mono text-xs text-[#292522] space-y-3">
            <div>
              <p className="text-[#77716D]">// 1. Sequential Segment Number</p>
              <p className="font-bold">1</p>
              <p className="text-[#77716D]">// 2. Start Timecode --&gt; End Timecode (Hours:Minutes:Seconds,Milliseconds)</p>
              <p className="font-bold text-amber-700">00:00:04,120 --&gt; 00:00:07,850</p>
              <p className="text-[#77716D]">// 3. Subtitle Text</p>
              <p>Welcome to this comprehensive introduction to algorithms.</p>
            </div>
            <div className="pt-2 border-t border-[#F0E8E2]">
              <p className="font-bold">2</p>
              <p className="font-bold text-amber-700">00:00:08,020 --&gt; 00:00:11,430</p>
              <p>Today we will analyze computational time complexity.</p>
            </div>
          </div>
          <p className="text-xs sm:text-sm">
            Because this matches the industry standard, you can directly import downloaded SRT files into Adobe Premiere Pro, Final Cut Pro, DaVinci Resolve, or VLC media player to add synchronized subtitles to any video project.
          </p>
        </section>

        {/* Related Guides */}
        <div className="pt-8 border-t border-[#F0E8E2] space-y-4">
          <h3 className="text-base font-bold text-[#292522]">Related Guides:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
            <Link
              href="/guides/how-to-get-transcript-from-youtube"
              className="rounded-xl border border-[#F0E8E2] bg-white p-3 hover:border-[#E9A9C3] transition-colors"
            >
              <span className="font-semibold text-[#292522] block">How to Get a Transcript →</span>
              <span className="text-[#77716D]">Step-by-step extraction guide.</span>
            </Link>
            <Link
              href="/guides/how-to-copy-and-save-youtube-captions"
              className="rounded-xl border border-[#F0E8E2] bg-white p-3 hover:border-[#E9A9C3] transition-colors"
            >
              <span className="font-semibold text-[#292522] block">Copy & Save Captions →</span>
              <span className="text-[#77716D]">Export formats and book reader guide.</span>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
