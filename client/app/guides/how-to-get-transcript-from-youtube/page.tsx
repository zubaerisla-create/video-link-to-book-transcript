import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Calendar } from "lucide-react";
import { AdBanner } from "@/components/AdBanner";
import { ADSENSE_SLOTS } from "@/lib/adsense";

export const metadata: Metadata = {
  title: "How to Get a Transcript from a YouTube Video (Step-by-Step)",
  description:
    "Learn the fastest ways to get a complete, readable transcript from any YouTube video using official player captions and Transcriptly's paragraph generator.",
  alternates: {
    canonical: "/guides/how-to-get-transcript-from-youtube",
  },
};

export default function Guide1Page() {
  const publishedDate = "2026-10-16";
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "How to Get a Transcript from a YouTube Video",
    description:
      "A complete walkthrough of extracting captions from any public YouTube video using both YouTube's built-in player and Transcriptly's paragraph generator.",
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
      "@id": "https://transcriptly.net/guides/how-to-get-transcript-from-youtube",
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
        <span className="text-[#292522] font-medium truncate">Get YouTube Transcript</span>
      </nav>

      {/* Article Header */}
      <header className="mb-10">
        <div className="inline-flex items-center rounded-full bg-[#FFF1B8] px-3.5 py-1 text-xs font-semibold tracking-wider text-[#292522] uppercase mb-4 border border-[#F0E8E2]">
          <span>Tutorial</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#292522] leading-tight mb-4">
          How to Get a Transcript from a YouTube Video
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-xs text-[#77716D] border-b border-[#F0E8E2] pb-6">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>October 16, 2026</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>4 min read</span>
          </div>
          <span>•</span>
          <span>By Transcriptly Editorial Team</span>
        </div>
      </header>

      {/* Article Body */}
      <div className="space-y-8 text-sm sm:text-base text-[#77716D] leading-relaxed">
        <p className="text-base sm:text-lg text-[#292522] font-medium leading-relaxed">
          Whether you need to review a recorded university lecture, cite a documentary, or repurpose audio into an article, reading text is up to five times faster than watching video. Here are the two most reliable methods to get a full transcript from any YouTube video.
        </p>

        {/* Method 1: Using Transcriptly */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-[#292522]">
            Method 1: Extract Clean, Formatted Paragraphs with Transcriptly
          </h2>
          <p>
            The easiest way to obtain readable prose without messy one-line subtitle breaks is by using <strong>Transcriptly</strong>.
          </p>

          <ol className="list-decimal list-inside space-y-3 pl-1">
            <li>
              <strong>Copy the YouTube video URL:</strong> Open your video in YouTube and copy its link from the browser address bar (e.g., <code>https://www.youtube.com/watch?v=...</code> or <code>https://youtu.be/...</code>).
            </li>
            <li>
              <strong>Paste the link into Transcriptly:</strong> Navigate to <Link href="/" className="text-[#292522] underline font-medium hover:text-[#E9A9C3]">Transcriptly Home</Link> and paste the URL into the input box.
            </li>
            <li>
              <strong>Configure your preferences (optional):</strong> Choose whether you want timestamps included, format paragraphs into structured blocks, or translate the transcript into another language.
            </li>
            <li>
              <strong>Click Extract Transcript:</strong> Within 1 to 2 seconds, Transcriptly fetches the subtitle stream and automatically stitches fragments into natural, punctuated paragraphs.
            </li>
            <li>
              <strong>Copy or Save:</strong> Click &ldquo;Copy All&rdquo; to copy to your clipboard, export in TXT/SRT format, or click &ldquo;Save to My Library&rdquo; to keep it permanently in your personal digital reader.
            </li>
          </ol>
        </section>

        {/* Method 2: Official YouTube Player */}
        <section className="space-y-4 rounded-2xl border border-[#F0E8E2] bg-[#FFFDF8] p-6">
          <h2 className="text-xl font-bold text-[#292522]">
            Method 2: Using the Official YouTube Web Player
          </h2>
          <p>
            YouTube includes a built-in transcript viewer directly under the video description:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm pl-1">
            <li>Open the video on YouTube using a desktop browser.</li>
            <li>Click <strong>&ldquo;...more&rdquo;</strong> in the video description box to expand the details.</li>
            <li>Scroll down and click <strong>&ldquo;Show transcript&rdquo;</strong>.</li>
            <li>A transcript panel will appear on the right side of the video, showing line-by-line subtitle phrases.</li>
          </ol>
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-xs text-amber-950 mt-3">
            <strong>Limitation:</strong> Copying text directly from the YouTube native panel copies hundreds of timecode lines (e.g., <code>0:04 Hey guys 0:06 welcome back 0:08 to the channel</code>), requiring tedious manual cleanup. Transcriptly solves this by assembling sentences automatically.
          </div>
        </section>

        {/* When Captions Are Missing */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-[#292522]">
            What if the Video Has No Captions?
          </h2>
          <p>
            Some YouTube videos lack both creator-uploaded subtitles and automated captions (often due to background music, non-supported dialects, or creator preferences). In Transcriptly, you can toggle on <strong>Local Speech Recognition Fallback</strong>, which processes the speech stream directly on your machine without third-party fees.
          </p>
        </section>

        {/* AdSense Unit (Manual Slot or Auto Ad placeholder) */}
        <AdBanner slot={ADSENSE_SLOTS.ARTICLE_BOTTOM} />

        {/* Related Guides */}
        <div className="pt-8 border-t border-[#F0E8E2] space-y-4">
          <h3 className="text-base font-bold text-[#292522]">Related Guides:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
            <Link
              href="/guides/how-to-copy-and-save-youtube-captions"
              className="rounded-xl border border-[#F0E8E2] bg-white p-3 hover:border-[#E9A9C3] transition-colors"
            >
              <span className="font-semibold text-[#292522] block">How to Copy & Save Captions →</span>
              <span className="text-[#77716D]">Format into TXT, SRT, and PDF books.</span>
            </Link>
            <Link
              href="/guides/how-to-fix-missing-unavailable-captions"
              className="rounded-xl border border-[#F0E8E2] bg-white p-3 hover:border-[#E9A9C3] transition-colors"
            >
              <span className="font-semibold text-[#292522] block">Fix Missing Captions →</span>
              <span className="text-[#77716D]">Troubleshoot disabled or unavailable subtitle tracks.</span>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
