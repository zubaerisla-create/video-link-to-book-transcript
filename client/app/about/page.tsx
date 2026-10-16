import { ShieldCheck, HeartHandshake, Zap, Lock, Terminal, FileCode } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "About Transcriptly | Purpose, Privacy & Technology",
  description: "Learn about the mission, architecture, privacy guarantees, and technical limitations of Transcriptly.",
};

export default function AboutPage() {
  const values = [
    {
      title: "Verbatim Integrity",
      description:
        "Transcriptly will never rewrite, summarize, or alter speech using generative AI without permission. The speaker’s original phrasing, terms, and factual statements remain 100% intact.",
      icon: HeartHandshake,
    },
    {
      title: "Zero-Storage Privacy",
      description:
        "We believe in ephemeral utility. Neither your video URLs nor the extracted transcripts are stored in a database or logged to external analytics. Transcripts exist solely in your local browser session.",
      icon: Lock,
    },
    {
      title: "Local-First Architecture",
      description:
        "Built to run directly on your Linux Mint machine. Free from paid API keys, vendor lock-in, and unpredictable subscription pricing.",
      icon: Terminal,
    },
    {
      title: "Instant Exporting",
      description:
        "Flexible formatting for any workflow: plain text paragraphs for reading and note-taking, JSON for development pipelines, and standard SRT with millisecond timestamps for video editors.",
      icon: FileCode,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      {/* Header */}
      <div className="text-center mb-12 sm:mb-16">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF1B8] px-3 py-1 text-xs font-semibold tracking-wider text-[#292522] uppercase mb-4 border border-[#F0E8E2]">
          <Zap className="h-3.5 w-3.5 text-[#292522]" />
          <span>About Transcriptly</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#292522]">
          Readable YouTube Transcripts, Made Simple.
        </h1>
        <p className="mt-4 text-base sm:text-lg text-[#77716D] max-w-2xl mx-auto leading-relaxed">
          Transcriptly was created to solve a widespread annoyance: video captions broken into messy, fragmented one-line subtitles.
        </p>
      </div>

      {/* Purpose Story */}
      <div className="rounded-2xl border border-[#F0E8E2] bg-white p-6 sm:p-8 mb-12 shadow-xs">
        <h2 className="text-xl font-bold text-[#292522] mb-4">Our Purpose</h2>
        <div className="space-y-4 text-sm sm:text-base text-[#77716D] leading-relaxed">
          <p>
            When video captions are downloaded in their raw format, each phrase is split across hundreds of short, fragmented chunks such as:
          </p>
          <div className="rounded-xl border border-[#F0E8E2] bg-[#FFFDF8] p-4 font-mono text-xs text-[#292522] space-y-1">
            <p className="text-[#77716D]">// Raw subtitle segments</p>
            <p>&ldquo;Not because I doubted myself, but&rdquo;</p>
            <p>&ldquo;because I was told that I wasn&apos;t good&rdquo;</p>
            <p>&ldquo;enough. I was told that I didn&apos;t fit in.&rdquo;</p>
          </div>
          <p>
            Transcriptly automatically detects natural sentence boundaries, punctuation, and speaker pauses to merge these fragments into fluid, pleasant paragraphs:
          </p>
          <div className="rounded-xl border border-[#F0E8E2] bg-[#F8DDE8]/40 p-4 text-xs sm:text-sm text-[#292522] font-medium leading-relaxed">
            &ldquo;Not because I doubted myself, but because I was told that I wasn&apos;t good enough. I was told that I didn&apos;t fit in.&rdquo;
          </div>
          <p>
            The result is clean reading copy suitable for article drafting, research references, studying, and content archiving.
          </p>
        </div>
      </div>

      {/* Core Principles */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-[#292522] mb-6">Guiding Principles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {values.map((v) => {
            const Icon = v.icon;
            return (
              <div
                key={v.title}
                className="rounded-2xl border border-[#F0E8E2] bg-white p-6 shadow-xs"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF1B8] border border-[#F0E8E2] text-[#292522]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-base text-[#292522]">{v.title}</h3>
                </div>
                <p className="text-sm text-[#77716D] leading-relaxed">{v.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Technical Limitations & Transparency */}
      <div className="rounded-2xl border border-[#F0E8E2] bg-white p-6 sm:p-8 mb-12 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="h-5 w-5 text-[#292522]" />
          <h2 className="text-xl font-bold text-[#292522]">Technical Limitations & Privacy</h2>
        </div>
        <div className="space-y-3 text-sm text-[#77716D] leading-relaxed">
          <p>
            <strong className="text-[#292522]">Multilingual & Original Language Integrity:</strong> Transcriptly automatically detects the video&apos;s true spoken language (such as Bangla, English, Hindi, Arabic, Urdu, Spanish, French) and preserves the original writing script without unwanted automated translation.
          </p>
          <p>
            <strong className="text-[#292522]">Local Speech Recognition Fallback:</strong> When a public video lacks accessible caption tracks, Transcriptly offers an optional local speech recognition fallback powered by faster-whisper. The model executes directly on your machine without sending audio to paid APIs.
          </p>
          <p>
            <strong className="text-[#292522]">Aligned Multilingual Translation:</strong> When translation mode is chosen, the engine translates transcripts using existing YouTube caption tracks or free modular translation providers, preserving paragraph structure and segment timestamp alignment.
          </p>
          <p>
            <strong className="text-[#292522]">Ephemeral Processing:</strong> All temporary audio downloads and transcript texts exist strictly in temporary local memory and are never persisted in a database or shared with third parties.
          </p>
        </div>
      </div>

      {/* Call to action */}
      <div className="text-center">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-xl bg-[#E9A9C3] px-6 py-3 text-sm font-semibold text-[#292522] hover:bg-[#DE91B1] transition-colors shadow-xs"
        >
          Start Extracting Transcripts
        </Link>
      </div>
    </div>
  );
}
