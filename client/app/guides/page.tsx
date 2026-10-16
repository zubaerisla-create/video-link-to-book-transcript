import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, FileText, Copy, AlertCircle, GraduationCap, Clock, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "YouTube Transcript Guides & Tutorials",
  description:
    "Explore practical guides on extracting YouTube transcripts, fixing missing subtitles, converting captions to study notes, and understanding video timestamps.",
  alternates: {
    canonical: "/guides",
  },
};

const GUIDES = [
  {
    slug: "how-to-get-transcript-from-youtube",
    title: "How to Get a Transcript from a YouTube Video",
    description:
      "A complete walkthrough of extracting captions from any public YouTube video using both YouTube's built-in player and Transcriptly's paragraph generator.",
    readTime: "4 min read",
    icon: FileText,
    category: "Tutorial",
  },
  {
    slug: "how-to-copy-and-save-youtube-captions",
    title: "How to Copy, Format, and Save YouTube Captions",
    description:
      "Learn how to extract caption text without messy timestamps, download standard SRT and TXT files, and save transcripts into a digital book reader.",
    readTime: "5 min read",
    icon: Copy,
    category: "Productivity",
  },
  {
    slug: "how-to-fix-missing-unavailable-captions",
    title: "How to Fix Missing or Unavailable YouTube Captions",
    description:
      "Troubleshoot why a video shows 'Could not retrieve transcript', understand creator caption settings, and see how local speech recognition fallback operates.",
    readTime: "5 min read",
    icon: AlertCircle,
    category: "Troubleshooting",
  },
  {
    slug: "how-to-use-transcripts-for-studying-research",
    title: "How to Use Video Transcripts for Studying and Research",
    description:
      "Proven strategies for students, researchers, and content creators to turn long video lectures into searchable study notes, quotes, and reading books.",
    readTime: "6 min read",
    icon: GraduationCap,
    category: "Learning",
  },
  {
    slug: "understanding-transcript-languages-and-timestamps",
    title: "Understanding Transcript Languages, Timestamps, and SRT Files",
    description:
      "Explore how YouTube auto-captions differ from manual tracks, how millisecond timecodes work in SRT files, and how multilingual subtitles are handled.",
    readTime: "5 min read",
    icon: Clock,
    category: "Technical",
  },
];

export default function GuidesHubPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 sm:py-16">
      {/* Header */}
      <div className="text-center mb-12 sm:mb-16">
        <div className="inline-flex items-center rounded-full bg-[#FFF1B8] px-3.5 py-1 text-xs font-semibold tracking-wider text-[#292522] uppercase mb-4 border border-[#F0E8E2]">
          <span>Learning Center</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#292522]">
          YouTube Transcript Guides & Tutorials
        </h1>
        <p className="mt-4 text-base sm:text-lg text-[#77716D] max-w-2xl mx-auto leading-relaxed">
          Practical, straightforward advice on extracting video captions, formatting speech into readable paragraphs, and turning lectures into personal digital books.
        </p>
      </div>

      {/* Guides Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {GUIDES.map((guide) => {
          const Icon = guide.icon;
          return (
            <Link
              key={guide.slug}
              href={`/guides/${guide.slug}`}
              className="group flex flex-col justify-between rounded-3xl border border-[#F0E8E2] bg-white p-6 sm:p-8 shadow-xs hover:border-[#E9A9C3] hover:shadow-md transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF1B8] border border-[#F0E8E2] text-[#292522] group-hover:bg-[#F8DDE8] transition-colors">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#77716D] bg-[#FFFDF8] border border-[#F0E8E2] px-2.5 py-0.5 rounded-full">
                      {guide.category}
                    </span>
                    <span className="text-xs text-[#77716D]">{guide.readTime}</span>
                  </div>
                </div>

                <h2 className="text-lg sm:text-xl font-bold text-[#292522] group-hover:text-[#292522] transition-colors mb-2 leading-snug">
                  {guide.title}
                </h2>
                <p className="text-xs sm:text-sm text-[#77716D] leading-relaxed mb-6">
                  {guide.description}
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#292522] group-hover:translate-x-1 transition-transform pt-4 border-t border-[#F0E8E2]/60">
                <span>Read Full Guide</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Bottom CTA Banner */}
      <div className="mt-16 rounded-3xl border border-[#F0E8E2] bg-[#FFFDF8] p-8 sm:p-10 text-center space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-[#292522]">
          Ready to extract your first video transcript?
        </h2>
        <p className="text-xs sm:text-sm text-[#77716D] max-w-lg mx-auto leading-relaxed">
          Paste any YouTube link directly into Transcriptly to test our paragraph organizer, side-by-side translation, and digital book reader.
        </p>
        <div>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl bg-[#E9A9C3] px-6 py-2.5 text-xs sm:text-sm font-semibold text-[#292522] hover:bg-[#DE91B1] transition-colors shadow-xs"
          >
            Open Transcriptly Extractor
          </Link>
        </div>
      </div>
    </div>
  );
}
