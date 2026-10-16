import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Clock, Calendar, AlertTriangle, CheckCircle2, Mic } from "lucide-react";

export const metadata: Metadata = {
  title: "How to Fix Missing or Unavailable YouTube Captions",
  description:
    "Troubleshoot why a YouTube video says 'Could not retrieve transcript', understand caption availability rules, and learn how to use speech recognition fallback.",
  alternates: {
    canonical: "/guides/how-to-fix-missing-unavailable-captions",
  },
};

export default function Guide3Page() {
  const publishedDate = "2026-10-16";
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "How to Fix Missing or Unavailable YouTube Captions",
    description:
      "Troubleshoot why a video shows 'Could not retrieve transcript', understand creator caption settings, and see how local speech recognition fallback operates.",
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
      "@id": "https://transcriptly.net/guides/how-to-fix-missing-unavailable-captions",
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
        <span className="text-[#292522] font-medium truncate">Fix Missing Captions</span>
      </nav>

      {/* Header */}
      <header className="mb-10">
        <div className="inline-flex items-center rounded-full bg-[#FFF1B8] px-3.5 py-1 text-xs font-semibold tracking-wider text-[#292522] uppercase mb-4 border border-[#F0E8E2]">
          <span>Troubleshooting</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#292522] leading-tight mb-4">
          How to Fix Missing or Unavailable YouTube Captions
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
          You paste a YouTube link into an extractor, hit Enter, and receive an error: &ldquo;Could not retrieve transcript&rdquo;. Why does this happen, and how can you resolve it? Here is a practical troubleshooting guide.
        </p>

        {/* Section 1: Common Reasons */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-[#292522]">
            The 5 Main Reasons Captions Are Unavailable
          </h2>
          <div className="space-y-3">
            <div className="rounded-2xl border border-[#F0E8E2] bg-white p-5">
              <h3 className="font-bold text-[#292522] text-base mb-1">1. The Video Has No Speech or Heavy Music</h3>
              <p className="text-xs sm:text-sm text-[#77716D]">
                YouTube&apos;s automatic speech recognition algorithms require intelligible human vocal frequencies. Instrumental music, gaming montages with sound effects, or ambient nature videos will not trigger automated captions.
              </p>
            </div>

            <div className="rounded-2xl border border-[#F0E8E2] bg-white p-5">
              <h3 className="font-bold text-[#292522] text-base mb-1">2. Captions Were Disabled by the Uploader</h3>
              <p className="text-xs sm:text-sm text-[#77716D]">
                In YouTube Studio, video creators have the option to turn off community contributions and automatic captions entirely. If the creator turned off captions, YouTube does not serve any subtitle stream.
              </p>
            </div>

            <div className="rounded-2xl border border-[#F0E8E2] bg-white p-5">
              <h3 className="font-bold text-[#292522] text-base mb-1">3. The Video Was Very Recently Uploaded</h3>
              <p className="text-xs sm:text-sm text-[#77716D]">
                YouTube does not generate automated captions instantly when a video is published. For a 30-minute video, it often takes YouTube from 2 to 24 hours to queue and finish audio transcription.
              </p>
            </div>

            <div className="rounded-2xl border border-[#F0E8E2] bg-white p-5">
              <h3 className="font-bold text-[#292522] text-base mb-1">4. The Video is Private, Age-Restricted, or Geo-Blocked</h3>
              <p className="text-xs sm:text-sm text-[#77716D]">
                To protect user privacy and copyright restrictions, automated tools cannot access videos that require a logged-in Google account confirmation, age verification, or regional bypasses.
              </p>
            </div>

            <div className="rounded-2xl border border-[#F0E8E2] bg-white p-5">
              <h3 className="font-bold text-[#292522] text-base mb-1">5. Non-Standard Language Dialect</h3>
              <p className="text-xs sm:text-sm text-[#77716D]">
                While YouTube supports dozens of languages, certain regional dialects or low-clarity microphones fail YouTube&apos;s confidence score threshold, causing YouTube not to publish the auto-caption track.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: How to Check Manually */}
        <section className="space-y-3 rounded-2xl border border-[#F0E8E2] bg-[#FFFDF8] p-6">
          <h2 className="text-xl font-bold text-[#292522]">
            How to Verify if a Video Has Captions on YouTube
          </h2>
          <p className="text-xs sm:text-sm">
            Before troubleshooting your extractor, check the video directly on YouTube:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm pl-1">
            <li>Look for the <strong>&ldquo;CC&rdquo;</strong> button in the bottom-right corner of the video player.</li>
            <li>If the &ldquo;CC&rdquo; icon is missing or greyed out, YouTube has no active caption stream for that video.</li>
            <li>Click the gear icon (Settings) → <strong>Subtitles/CC</strong> to see which languages are listed.</li>
          </ul>
        </section>

        {/* Section 3: Speech Recognition Fallback */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-base font-bold text-[#292522]">
            <Mic className="h-5 w-5 text-[#292522]" />
            <h2 className="text-xl font-bold text-[#292522]">
              The Solution: Local Speech Recognition Fallback
            </h2>
          </div>
          <p>
            If a video lacks native captions, Transcriptly includes an optional <strong>Speech Recognition Fallback</strong> powered by <em>faster-whisper</em>:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm pl-1">
            <li>On the Transcriptly homepage, click <strong>&ldquo;Options&rdquo;</strong> beneath the URL field.</li>
            <li>Check the option: <strong>&ldquo;Enable Speech Recognition Fallback&rdquo;</strong>.</li>
            <li>Click <strong>&ldquo;Extract Transcript&rdquo;</strong>.</li>
            <li>When native captions are not detected, Transcriptly automatically runs local acoustic inference to detect spoken words (supporting Bangla, English, and other languages) and generates fresh paragraphs.</li>
          </ol>
          <div className="rounded-xl border border-[#F0E8E2] bg-white p-4 text-xs text-[#77716D]">
            <strong>Note:</strong> Speech recognition takes longer than instant caption retrieval (typically 10 to 30 seconds depending on video length and server load), but it allows you to obtain transcripts for videos that have no captions on YouTube.
          </div>
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
              href="/faq"
              className="rounded-xl border border-[#F0E8E2] bg-white p-3 hover:border-[#E9A9C3] transition-colors"
            >
              <span className="font-semibold text-[#292522] block">Frequently Asked Questions →</span>
              <span className="text-[#77716D]">Common errors and troubleshooting steps.</span>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
