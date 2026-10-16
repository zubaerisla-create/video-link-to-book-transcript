import type { Metadata } from "next";
import Link from "next/link";
import { HeartHandshake, Lock, Terminal, FileCode, BookOpen, Globe2, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "About Transcriptly | Purpose, Privacy & Technology",
  description:
    "Learn about the mission, architecture, privacy guarantees, and digital book reader of Transcriptly, a free tool to extract YouTube transcripts into readable text.",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  const values = [
    {
      title: "Verbatim Text Integrity",
      description:
        "Transcriptly will never rewrite, summarize, or alter speech using generative AI without permission. The speaker’s original phrasing, terms, and factual statements remain 100% intact.",
      icon: HeartHandshake,
    },
    {
      title: "Privacy-First Architecture",
      description:
        "For guest visitors, processing is 100% ephemeral in memory: video links and transcripts are discarded when the session ends. For registered members, saved books are private and strictly isolated.",
      icon: Lock,
    },
    {
      title: "Unicode Multilingual Support",
      description:
        "Engineered with native typography support for non-Latin writing systems, including Bangla (বাংলা), Hindi, Arabic, Japanese, Spanish, and French, preserving original scripts accurately.",
      icon: Globe2,
    },
    {
      title: "Universal Exporting",
      description:
        "Flexible formatting for every workflow: plain text paragraphs for note-taking, JSON for development pipelines, standard SRT for video editing, and formatted PDF books for offline reading.",
      icon: FileCode,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      {/* Header */}
      <div className="text-center mb-12 sm:mb-16">
        <div className="inline-flex items-center rounded-full bg-[#FFF1B8] px-3.5 py-1 text-xs font-semibold tracking-wider text-[#292522] uppercase mb-4 border border-[#F0E8E2]">
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

      {/* Personal Library & Book Reader */}
      <div className="rounded-2xl border border-[#F0E8E2] bg-[#FFFDF8] p-6 sm:p-8 mb-12 shadow-xs">
        <div className="flex items-center gap-2.5 mb-3">
          <BookOpen className="h-6 w-6 text-[#292522]" />
          <h2 className="text-xl font-bold text-[#292522]">Personal Digital Library & Book Reader</h2>
        </div>
        <p className="text-sm sm:text-base text-[#77716D] leading-relaxed mb-4">
          Reading hours of video lectures on a cluttered video screen causes eye fatigue and distraction. Transcriptly introduces a tailored <strong>Digital Book Reader</strong>:
        </p>
        <ul className="text-xs sm:text-sm text-[#77716D] space-y-2 list-disc list-inside">
          <li><strong>Page-by-Page Reading:</strong> Read long transcripts as structured book pages with previous/next controls or switch to continuous scroll mode.</li>
          <li><strong>Reading Themes:</strong> Choose between Light, Sepia (warm reading tone), and Dark mode with adjustable typography sizing.</li>
          <li><strong>Reading Progress Memory:</strong> Resume right where you left off in your study sessions.</li>
          <li><strong>PDF Book Export:</strong> Generate real, beautifully formatted PDF documents complete with title page, page numbers, and Unicode font rendering for languages like Bangla.</li>
        </ul>
      </div>

      {/* Technical Limitations & Transparency */}
      <div className="rounded-2xl border border-[#F0E8E2] bg-white p-6 sm:p-8 mb-12 shadow-xs">
        <h2 className="text-xl font-bold text-[#292522] mb-4">Technical Limitations & Privacy</h2>
        <div className="space-y-3 text-sm text-[#77716D] leading-relaxed">
          <p>
            <strong className="text-[#292522]">Multilingual & Original Language Integrity:</strong> Transcriptly automatically detects the video&apos;s true spoken language (such as Bangla, English, Hindi, Arabic, Urdu, Spanish, French) and preserves the original writing script without unwanted automated translation.
          </p>
          <p>
            <strong className="text-[#292522]">Speech Recognition Fallback:</strong> When a public video lacks accessible caption tracks, Transcriptly offers an optional speech recognition fallback powered by faster-whisper to transcribe audio without sending data to paid third-party APIs.
          </p>
          <p>
            <strong className="text-[#292522]">Aligned Multilingual Translation:</strong> When translation mode is chosen, the engine translates transcripts using existing YouTube caption tracks or modular translation providers, preserving paragraph structure and segment timestamp alignment.
          </p>
          <p>
            <strong className="text-[#292522]">Ephemeral Processing vs. Saved Library:</strong> Guest requests are processed in memory and never logged to a database. Transcripts are only stored permanently when an authenticated member explicitly clicks &ldquo;Save to My Library&rdquo;.
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
