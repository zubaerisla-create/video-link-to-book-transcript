import type { Metadata } from "next";
import Link from "next/link";
import { HelpCircle, ChevronDown } from "lucide-react";
import { AdBanner } from "@/components/AdBanner";
import { ADSENSE_SLOTS } from "@/lib/adsense";

export const metadata: Metadata = {
  title: "Frequently Asked Questions (FAQ)",
  description:
    "Find answers to frequently asked questions about extracting YouTube transcripts, supported URL formats, multilingual captions, translation, and our digital book reader.",
  alternates: {
    canonical: "/faq",
  },
};

const FAQ_ITEMS = [
  {
    category: "Extraction & Subtitles",
    questions: [
      {
        q: "How does Transcriptly extract transcripts from YouTube videos?",
        a: "Transcriptly communicates with YouTube subtitle endpoints to retrieve official creator-uploaded closed captions or auto-generated subtitle streams. It then runs an intelligent punctuation and boundary assembler to merge choppy subtitle snippets into coherent, fluid reading paragraphs.",
      },
      {
        q: "Which YouTube URL formats are supported?",
        a: "Transcriptly supports all standard YouTube link formats, including standard watch links (https://www.youtube.com/watch?v=...), shortened URLs (https://youtu.be/...), YouTube Shorts (https://www.youtube.com/shorts/...), and embedded player links (https://www.youtube.com/embed/...).",
      },
      {
        q: "What if a YouTube video has no captions available?",
        a: "If a video lacks both creator-uploaded and YouTube auto-generated captions, Transcriptly can utilize an optional local speech recognition fallback powered by faster-whisper. When enabled, the audio is analyzed to detect speech and generate formatted text directly without paid third-party APIs.",
      },
      {
        q: "Why does Transcriptly say 'Could not retrieve transcript'?",
        a: "This typically occurs if the video is private or unlisted with restricted access, age-restricted requiring user verification, has captions disabled by the uploader, or has been blocked in specific regions.",
      },
    ],
  },
  {
    category: "Languages & Translation",
    questions: [
      {
        q: "Does Transcriptly support non-English languages like Bangla, Hindi, or Spanish?",
        a: "Yes! Transcriptly provides full native Unicode support for multilingual captions, including Bangla (বাংলা), Hindi (हिन्दी), Arabic, Spanish, French, German, Urdu, Japanese, and more. Transcripts preserve original script typography without unwanted forced translation.",
      },
      {
        q: "How does the translation feature work?",
        a: "Transcriptly allows you to pick a target language (such as English, Spanish, Bangla, French, or German). You can view the output as Translated Only, Original Only, or a Side-by-Side comparison where original and translated paragraphs are aligned.",
      },
      {
        q: "Can I export transcripts with millisecond timestamps?",
        a: "Yes. Switch to the 'Timestamped' tab to view timecodes, or click 'Export' and select SRT format. SRT files include industry-standard millisecond timestamps compatible with Premiere Pro, DaVinci Resolve, Final Cut, and VLC.",
      },
    ],
  },
  {
    category: "Personal Library & Digital Book Reader",
    questions: [
      {
        q: "How does the Digital Book Reader work?",
        a: "When you click 'Save to My Library', your transcript is formatted into a digital book with clean typography, page numbers, font sizing, and reading themes (Light, Sepia, and Dark). You can read page-by-page or in continuous scroll mode.",
      },
      {
        q: "Does Transcriptly save my transcripts permanently?",
        a: "For guest users, transcripts are ephemeral and live only in your active browser session. If you sign up for a free account, transcripts you explicitly choose to save are stored securely in our database and persist across browser reloads, device switches, and server updates.",
      },
      {
        q: "Can I download a PDF of my saved transcript?",
        a: "Yes. Once a transcript is saved to your library, you can export a formatted PDF complete with book metadata, chapter-like paragraphs, page numbering, and Unicode font rendering for scripts like Bangla.",
      },
    ],
  },
  {
    category: "Account, Privacy & Costs",
    questions: [
      {
        q: "Is Transcriptly free to use?",
        a: "Yes, Transcriptly is 100% free to use for extracting transcripts, copying text, downloading SRT/JSON/TXT files, and using the digital reader.",
      },
      {
        q: "Is my personal data or search history tracked?",
        a: "No. We do not sell user data, log video search history to analytics, or store URLs submitted by guest users. Registered user libraries are strictly private and accessible only by logging into your account. For full details, review our Privacy Policy.",
      },
      {
        q: "Who owns the copyright to the extracted transcripts?",
        a: "The copyright of all spoken words and captions belongs exclusively to the original YouTube video creators and copyright owners. Transcriptly provides an extraction and formatting tool for personal reference, research, and educational fair use.",
      },
    ],
  },
];

export default function FAQPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.flatMap((cat) =>
      cat.questions.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.a,
        },
      }))
    ),
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Header */}
      <div className="text-center mb-12 sm:mb-16">
        <div className="inline-flex items-center rounded-full bg-[#FFF1B8] px-3.5 py-1 text-xs font-semibold tracking-wider text-[#292522] uppercase mb-4 border border-[#F0E8E2]">
          <span>Knowledge Base</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#292522]">
          Frequently Asked Questions
        </h1>
        <p className="mt-4 text-base sm:text-lg text-[#77716D] max-w-2xl mx-auto leading-relaxed">
          Everything you need to know about extracting YouTube captions, converting them to clean text, translation, and our digital book reader.
        </p>
      </div>

      {/* FAQ Categories */}
      <div className="space-y-10">
        {FAQ_ITEMS.map((section) => (
          <div key={section.category} className="space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-[#292522] border-b border-[#F0E8E2] pb-2">
              {section.category}
            </h2>

            <div className="space-y-3">
              {section.questions.map((faq, idx) => (
                <details
                  key={idx}
                  className="group rounded-2xl border border-[#F0E8E2] bg-white p-5 sm:p-6 shadow-xs open:border-[#E9A9C3] open:bg-[#FFFDF8] transition-colors"
                >
                  <summary className="flex cursor-pointer items-center justify-between font-semibold text-sm sm:text-base text-[#292522] list-none">
                    <span>{faq.q}</span>
                    <span className="ml-4 shrink-0 transition-transform duration-200 group-open:rotate-180 text-[#77716D]">
                      <ChevronDown className="h-4 w-4" />
                    </span>
                  </summary>
                  <p className="mt-3 text-xs sm:text-sm text-[#77716D] leading-relaxed border-t border-[#F0E8E2]/60 pt-3">
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* AdSense Unit (Manual Slot or Auto Ad placeholder) */}
      <AdBanner slot={ADSENSE_SLOTS.FAQ_BOTTOM} />

      {/* Still Have Questions Box */}
      <div className="mt-16 rounded-3xl border border-[#F0E8E2] bg-[#FFF1B8]/40 p-8 text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF1B8] border border-[#F0E8E2] text-[#292522]">
          <HelpCircle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-[#292522]">Still have questions?</h2>
        <p className="text-xs sm:text-sm text-[#77716D] max-w-md mx-auto leading-relaxed">
          Can&apos;t find what you&apos;re looking for? Reach out to our support team and we will be happy to assist you.
        </p>
        <div>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-xl bg-[#E9A9C3] px-6 py-2.5 text-xs sm:text-sm font-semibold text-[#292522] hover:bg-[#DE91B1] transition-colors shadow-xs"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
