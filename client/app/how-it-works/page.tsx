import { Link as LinkIcon, Subtitles, Download, Sparkles, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "How It Works | Transcriptly",
  description: "Learn how Transcriptly extracts and formats YouTube captions into readable transcripts.",
};

export default function HowItWorksPage() {
  const steps = [
    {
      number: "01",
      title: "Paste a YouTube link",
      description:
        "Provide any public YouTube video link. Transcriptly supports standard watch links, shortened youtu.be URLs, YouTube Shorts, and embed links.",
      icon: LinkIcon,
      highlight: "Compatible with all YouTube URL formats",
    },
    {
      number: "02",
      title: "Retrieve available captions",
      description:
        "Transcriptly requests the video's official subtitle tracks or auto-generated captions directly. You can inspect available languages or let the engine pick the optimal track.",
      icon: Subtitles,
      highlight: "Uses official caption tracks without paid APIs",
    },
    {
      number: "03",
      title: "Read, copy, or export",
      description:
        "Messy caption fragments are merged into coherent, natural paragraphs. Easily switch between formatted paragraphs and timestamped segments, or download as TXT, JSON, or SRT.",
      icon: Download,
      highlight: "Exports in TXT, JSON, and standard SRT format",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      {/* Header section */}
      <div className="text-center mb-12 sm:mb-16">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF1B8] px-3 py-1 text-xs font-semibold tracking-wider text-[#292522] uppercase mb-4 border border-[#F0E8E2]">
          <Sparkles className="h-3.5 w-3.5 text-[#292522]" />
          <span>Workflow Overview</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#292522]">
          How Transcriptly Works
        </h1>
        <p className="mt-4 text-base sm:text-lg text-[#77716D] max-w-2xl mx-auto leading-relaxed">
          From a YouTube video URL to clean, human-readable paragraphs in seconds.
          Here is how the extraction and formatting pipeline operates.
        </p>
      </div>

      {/* 3 Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.number}
              className="flex flex-col justify-between rounded-2xl border border-[#F0E8E2] bg-white p-6 shadow-xs hover:border-[#E9A9C3] transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-black text-[#E9A9C3]">{step.number}</span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF1B8] border border-[#F0E8E2] text-[#292522]">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <h2 className="text-lg font-semibold text-[#292522] mb-2">{step.title}</h2>
                <p className="text-sm text-[#77716D] leading-relaxed mb-4">{step.description}</p>
              </div>

              <div className="pt-4 border-t border-[#F0E8E2]">
                <span className="text-xs font-medium text-[#292522] bg-[#F8DDE8] px-2.5 py-1 rounded-md inline-block">
                  {step.highlight}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deep-dive comparison section */}
      <div className="rounded-2xl border border-[#F0E8E2] bg-white p-6 sm:p-8 mb-12 shadow-xs">
        <h2 className="text-xl font-bold text-[#292522] mb-3">
          Existing Captions vs. Speech-to-Text Transcription
        </h2>
        <p className="text-sm text-[#77716D] leading-relaxed mb-6">
          Understanding the mechanism behind Transcriptly helps clarify how it retrieves data so quickly without high computational overhead or paid API keys.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-[#F0E8E2] bg-[#FFFDF8] p-5">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-5 w-5 text-[#292522]" />
              <h3 className="font-semibold text-base text-[#292522]">
                Caption Track Extraction (Transcriptly)
              </h3>
            </div>
            <p className="text-sm text-[#77716D] leading-relaxed mb-3">
              Extracts existing creator-uploaded subtitles or YouTube’s automated caption stream directly from the video metadata.
            </p>
            <ul className="text-xs text-[#77716D] space-y-1.5 list-disc list-inside">
              <li>Instant retrieval (usually within 1–2 seconds)</li>
              <li>No heavy audio downloading or GPU processing</li>
              <li>Preserves original spoken words and verbatim transcript</li>
              <li>Free and local without paid cloud API tokens</li>
            </ul>
          </div>

          <div className="rounded-xl border border-[#F0E8E2] bg-[#FFFDF8] p-5">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="h-5 w-5 text-[#77716D]" />
              <h3 className="font-semibold text-base text-[#292522]">
                Audio Speech-to-Text (ASR / Whisper)
              </h3>
            </div>
            <p className="text-sm text-[#77716D] leading-relaxed mb-3">
              Downloads the entire raw audio stream and executes machine learning inference locally or via paid cloud transcription APIs.
            </p>
            <ul className="text-xs text-[#77716D] space-y-1.5 list-disc list-inside">
              <li>Requires download of gigabytes of audio data</li>
              <li>High CPU/GPU compute time and high energy usage</li>
              <li>Frequently incurs cost per minute of transcribed audio</li>
              <li>May hallucinate or mishear niche domain jargon</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Limitations note callout */}
      <div className="rounded-2xl border border-[#F0E8E2] bg-[#FFF1B8]/40 p-6 flex flex-col sm:flex-row gap-4 items-start">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF1B8] border border-[#F0E8E2] text-[#292522]">
          <AlertCircle className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-[#292522] mb-1">
            Videos Without Accessible Captions
          </h2>
          <p className="text-sm text-[#77716D] leading-relaxed">
            If a video does not have creator-uploaded subtitles or YouTube automated captions enabled by the channel owner, Transcriptly will inform you immediately. In such cases, caption tracks cannot be retrieved through standard extraction methods.
          </p>
          <div className="mt-4">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl bg-[#E9A9C3] px-4 py-2 text-sm font-medium text-[#292522] hover:bg-[#DE91B1] transition-colors"
            >
              Try extracting a transcript
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
