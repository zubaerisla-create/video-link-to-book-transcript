"use client";

import React, { useState, useId } from "react";
import {
  Sparkles,
  Link as LinkIcon,
  X,
  Clipboard,
  FileText,
  Clock,
  Copy,
  Check,
  Download,
  RotateCcw,
  AlertCircle,
  SlidersHorizontal,
  Search,
  ExternalLink,
  ChevronDown,
  Languages,
  Mic,
  Columns2,
  ShieldCheck,
  Globe2,
} from "lucide-react";
import {
  fetchTranscript,
  ApiError,
} from "@/lib/api";
import {
  TranscriptResponse,
  ParagraphLengthMode,
  LanguageMode,
  TranscriptLanguage,
} from "@/lib/types";
import { isValidYouTubeUrl } from "@/lib/validation";

const PRESET_LANGUAGES = [
  { code: "auto", name: "Auto-detect / Original language" },
  { code: "bn", name: "Bangla (বাংলা)" },
  { code: "en", name: "English" },
  { code: "hi", name: "Hindi (हिन्दी)" },
  { code: "ar", name: "Arabic (العربية)" },
  { code: "ur", name: "Urdu (اردو)" },
  { code: "es", name: "Spanish (Español)" },
  { code: "fr", name: "French (Français)" },
  { code: "de", name: "German (Deutsch)" },
  { code: "ja", name: "Japanese (日本語)" },
  { code: "pt", name: "Portuguese (Português)" },
  { code: "zh", name: "Chinese (中文)" },
];

const TRANSLATION_TARGET_LANGUAGES = [
  { code: "bn", name: "Bangla (বাংলা)" },
  { code: "en", name: "English" },
  { code: "hi", name: "Hindi (हिन्दी)" },
  { code: "ar", name: "Arabic (العربية)" },
  { code: "ur", name: "Urdu (اردو)" },
  { code: "es", name: "Spanish (Español)" },
  { code: "fr", name: "French (Français)" },
  { code: "de", name: "German (Deutsch)" },
  { code: "ja", name: "Japanese (日本語)" },
  { code: "pt", name: "Portuguese (Português)" },
  { code: "zh", name: "Chinese (中文)" },
];

const SAMPLE_VIDEOS = [
  {
    title: "Rick Astley - Never Gonna Give You Up",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    tag: "English / Multi-track",
  },
  {
    title: "Steve Jobs Stanford Commencement Speech",
    url: "https://www.youtube.com/watch?v=UF8uR6Z6KLc",
    tag: "English Speech",
  },
];

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [paragraphLength, setParagraphLength] = useState<ParagraphLengthMode>("medium");

  // Language & Translation Mode
  const [languageMode, setLanguageMode] = useState<LanguageMode>("original");
  const [outputLanguage, setOutputLanguage] = useState<string>("auto");
  const [targetLanguage, setTargetLanguage] = useState<string>("bn");
  const [enableSpeechFallback, setEnableSpeechFallback] = useState<boolean>(true);

  // Results & Loading
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Extracting transcript...");
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);
  const [result, setResult] = useState<TranscriptResponse | null>(null);

  // Active view states
  const [activeTab, setActiveTab] = useState<"paragraphs" | "segments">("paragraphs");
  const [viewMode, setViewMode] = useState<"translated" | "original" | "side_by_side">("translated");
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);

  // Accessible IDs
  const urlInputId = useId();
  const searchInputId = useId();
  const speechToggleId = useId();
  const outputLangSelectId = useId();
  const targetLangSelectId = useId();

  // Handle URL change
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    if (urlError) setUrlError(null);
    if (error) setError(null);
  };

  const handleClear = () => {
    setUrl("");
    setUrlError(null);
    setError(null);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
        setUrlError(null);
        setError(null);
      }
    } catch {
      // Clipboard denied
    }
  };

  // Execute extraction
  const handleExtract = async (overrideUrl?: string) => {
    const targetUrl = (overrideUrl || url).trim();

    if (!targetUrl) {
      setUrlError("Please enter a YouTube video URL.");
      return;
    }

    if (!isValidYouTubeUrl(targetUrl)) {
      setUrlError(
        "Please enter a valid YouTube video link (e.g., https://www.youtube.com/watch?v=... or https://youtu.be/...)."
      );
      return;
    }

    setUrlError(null);
    setError(null);
    setIsLoading(true);

    if (languageMode === "translate") {
      setLoadingMessage("Extracting and translating transcript...");
    } else {
      setLoadingMessage("Extracting transcript...");
    }

    try {
      const data = await fetchTranscript({
        url: targetUrl,
        language: outputLanguage === "auto" ? undefined : outputLanguage,
        paragraphLength,
        languageMode,
        targetLanguage: languageMode === "translate" ? targetLanguage : undefined,
        enableSpeechFallback,
      });

      setResult(data);
      if (data.is_translated) {
        setViewMode("translated");
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        let userMessage = err.message;
        if (err.code === "NO_CAPTIONS") {
          userMessage =
            "No accessible captions or subtitles were found for this video. You can enable the Speech-to-Text fallback checkbox above to recognize the audio locally.";
        } else if (err.code === "VIDEO_UNAVAILABLE") {
          userMessage =
            "This YouTube video is unavailable, private, or has been removed.";
        } else if (err.code === "YOUTUBE_BLOCKED") {
          userMessage =
            "YouTube has temporarily throttled caption requests from this network. Please wait a moment and retry.";
        } else if (err.code === "INVALID_URL") {
          userMessage =
            "The YouTube link appears invalid or contains an unsupported video ID.";
        }
        setError({ message: userMessage, code: err.code });
      } else {
        setError({
          message:
            "Could not connect to the extraction service. Please ensure the backend is running locally on port 8000.",
          code: "NETWORK_ERROR",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Re-translate when target language changes after extraction
  const handleTargetLanguageChange = async (newTargetLang: string) => {
    setTargetLanguage(newTargetLang);
    if (!result || !url) return;

    setIsLoading(true);
    setLoadingMessage(`Translating transcript to ${newTargetLang}...`);
    try {
      const data = await fetchTranscript({
        url,
        language: outputLanguage === "auto" ? undefined : outputLanguage,
        paragraphLength,
        languageMode: "translate",
        targetLanguage: newTargetLang,
        enableSpeechFallback,
      });
      setResult(data);
      setViewMode("translated");
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError({ message: err.message, code: err.code });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Paragraph length change
  const handleParagraphLengthChange = async (newLength: ParagraphLengthMode) => {
    setParagraphLength(newLength);
    if (!result || !url) return;

    setIsLoading(true);
    setLoadingMessage("Reformatting paragraphs...");
    try {
      const data = await fetchTranscript({
        url,
        language: outputLanguage === "auto" ? undefined : outputLanguage,
        paragraphLength: newLength,
        languageMode,
        targetLanguage: languageMode === "translate" ? targetLanguage : undefined,
        enableSpeechFallback,
      });
      setResult(data);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError({ message: err.message, code: err.code });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setUrl("");
    setUrlError(null);
    setError(null);
    setResult(null);
    setSearchQuery("");
    setCopied(false);
    setLanguageMode("original");
    setViewMode("translated");
  };

  // Copy handler
  const handleCopyAll = async () => {
    if (!result) return;
    let textToCopy = "";

    if (viewMode === "side_by_side" && result.is_translated && result.translated_paragraphs) {
      // Side-by-side text export
      textToCopy = result.original_paragraphs
        .map((orig, i) => {
          const trans = result.translated_paragraphs?.[i] || "";
          return `[ORIGINAL]\n${orig}\n\n[TRANSLATED]\n${trans}`;
        })
        .join("\n\n---\n\n");
    } else if (viewMode === "original" || !result.is_translated) {
      textToCopy =
        activeTab === "paragraphs"
          ? result.original_paragraphs.join("\n\n")
          : result.original_segments
              .map((s) => `[${formatTime(s.start)}] ${s.text}`)
              .join("\n");
    } else {
      textToCopy =
        activeTab === "paragraphs"
          ? result.paragraphs.join("\n\n")
          : result.segments
              .map((s) => `[${formatTime(s.start)}] ${s.text}`)
              .join("\n");
    }

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = textToCopy;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Download utilities
  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const fileUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(fileUrl);
  };

  const handleDownloadTxt = () => {
    if (!result) return;
    const title = result.video_info?.title || `youtube-${result.video_id}`;
    const cleanTitle = title.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50);

    let textContent = "";
    if (viewMode === "side_by_side" && result.is_translated && result.translated_paragraphs) {
      textContent = `${result.video_info?.title || "YouTube Transcript"}\nURL: https://www.youtube.com/watch?v=${result.video_id}\nOriginal Language: ${result.detected_language_name}\nTarget Language: ${result.target_language_name}\n\n` +
        result.original_paragraphs
          .map((orig, i) => {
            const trans = result.translated_paragraphs?.[i] || "";
            return `[ORIGINAL - ${result.detected_language_name}]\n${orig}\n\n[TRANSLATED - ${result.target_language_name}]\n${trans}`;
          })
          .join("\n\n====================\n\n");
    } else if (viewMode === "original" || !result.is_translated) {
      textContent = `${result.video_info?.title || "YouTube Transcript"}\nURL: https://www.youtube.com/watch?v=${result.video_id}\nLanguage: ${result.detected_language_name} (${result.detected_language})\nMethod: ${result.transcription_method}\n\n${result.original_paragraphs.join("\n\n")}`;
    } else {
      textContent = `${result.video_info?.title || "YouTube Transcript"}\nURL: https://www.youtube.com/watch?v=${result.video_id}\nTranslated Language: ${result.language_name} (${result.language})\nProvider: ${result.translation_provider || "YouTube Captions"}\n\n${result.paragraphs.join("\n\n")}`;
    }

    downloadFile(textContent, `${cleanTitle}-transcript.txt`, "text/plain;charset=utf-8");
  };

  const handleDownloadJson = () => {
    if (!result) return;
    const title = result.video_info?.title || `youtube-${result.video_id}`;
    const cleanTitle = title.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50);
    const jsonContent = JSON.stringify(result, null, 2);
    downloadFile(jsonContent, `${cleanTitle}-transcript.json`, "application/json;charset=utf-8");
  };

  const handleDownloadSrt = () => {
    if (!result) return;
    const title = result.video_info?.title || `youtube-${result.video_id}`;
    const cleanTitle = title.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50);
    const srtContent = (viewMode === "original" || !result.is_translated) ? result.original_srt : result.srt;
    downloadFile(srtContent, `${cleanTitle}-captions.srt`, "text/plain;charset=utf-8");
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Determine active segments and paragraphs based on viewMode
  const activeParagraphsList = (viewMode === "original" || !result?.is_translated)
    ? (result?.original_paragraphs || [])
    : (result?.paragraphs || []);

  const activeSegmentsList = (viewMode === "original" || !result?.is_translated)
    ? (result?.original_segments || [])
    : (result?.segments || []);

  // Filtered lists for search
  const filteredParagraphs = activeParagraphsList.filter((p) =>
    searchQuery ? p.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  const filteredSegments = activeSegmentsList.filter((s) =>
    searchQuery ? s.text.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Hero Section */}
      <div className="text-center mb-8 sm:mb-10">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF1B8] px-3 py-1 text-xs font-semibold tracking-wider text-[#292522] uppercase mb-4 border border-[#F0E8E2]">
          <Sparkles className="h-3.5 w-3.5 text-[#292522]" />
          <span>Multilingual YouTube Transcript Extractor</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#292522]">
          Turn YouTube videos into text.
        </h1>
        <p className="mt-3 text-base sm:text-lg text-[#77716D] max-w-2xl mx-auto leading-relaxed">
          Extract captions in Bangla, English, and any spoken language. Organize into readable paragraphs or translate to your target language.
        </p>
      </div>

      {/* URL Input & Options Card */}
      <div className="rounded-2xl border border-[#F0E8E2] bg-white p-5 sm:p-7 shadow-xs mb-8 transition-shadow hover:shadow-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleExtract();
          }}
          className="space-y-5"
        >
          {/* URL Input Field */}
          <div className="relative">
            <label htmlFor={urlInputId} className="sr-only">
              YouTube Video Link
            </label>
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#77716D]">
              <LinkIcon className="h-5 w-5" />
            </div>

            <input
              id={urlInputId}
              type="text"
              value={url}
              onChange={handleUrlChange}
              placeholder="Paste a YouTube link (e.g. https://www.youtube.com/watch?v=...)"
              className={`w-full rounded-xl border bg-[#FFFDF8] py-3.5 pl-11 pr-24 text-sm sm:text-base text-[#292522] placeholder:text-[#77716D]/60 focus:outline-none focus:ring-2 focus:ring-[#E9A9C3] transition-all ${
                urlError ? "border-red-400 bg-red-50/20" : "border-[#F0E8E2]"
              }`}
            />

            <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-1">
              {url ? (
                <button
                  type="button"
                  onClick={handleClear}
                  title="Clear input"
                  className="p-1.5 text-[#77716D] hover:text-[#292522] rounded-lg hover:bg-[#F0E8E2]/60 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePaste}
                  title="Paste from clipboard"
                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-[#77716D] hover:text-[#292522] rounded-lg hover:bg-[#F0E8E2]/60 transition-colors"
                >
                  <Clipboard className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Paste</span>
                </button>
              )}
            </div>
          </div>

          {urlError && (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-red-600 pl-1">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{urlError}</span>
            </div>
          )}

          {/* Controls Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#F0E8E2]">
            {/* Mode & Language Selection */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#77716D] block mb-1.5">
                  Language Mode:
                </label>
                <div className="inline-flex w-full rounded-xl border border-[#F0E8E2] bg-[#FFFDF8] p-1">
                  <button
                    type="button"
                    onClick={() => setLanguageMode("original")}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${
                      languageMode === "original"
                        ? "bg-[#F8DDE8] text-[#292522] font-semibold"
                        : "text-[#77716D] hover:text-[#292522]"
                    }`}
                  >
                    Original Language
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguageMode("translate")}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${
                      languageMode === "translate"
                        ? "bg-[#FFF1B8] text-[#292522] font-semibold"
                        : "text-[#77716D] hover:text-[#292522]"
                    }`}
                  >
                    Translate Transcript
                  </button>
                </div>
              </div>

              {/* Conditional Language Pickers */}
              {languageMode === "original" ? (
                <div>
                  <label htmlFor={outputLangSelectId} className="text-xs font-semibold text-[#77716D] block mb-1">
                    Output language:
                  </label>
                  <div className="relative">
                    <select
                      id={outputLangSelectId}
                      value={outputLanguage}
                      onChange={(e) => setOutputLanguage(e.target.value)}
                      className="w-full rounded-xl border border-[#F0E8E2] bg-[#FFFDF8] py-2 pl-3 pr-8 text-xs font-medium text-[#292522] focus:outline-none focus:ring-1 focus:ring-[#E9A9C3] appearance-none cursor-pointer"
                    >
                      {PRESET_LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#77716D]" />
                  </div>
                </div>
              ) : (
                <div>
                  <label htmlFor={targetLangSelectId} className="text-xs font-semibold text-[#77716D] block mb-1">
                    Translate transcript to:
                  </label>
                  <div className="relative">
                    <select
                      id={targetLangSelectId}
                      value={targetLanguage}
                      onChange={(e) => handleTargetLanguageChange(e.target.value)}
                      className="w-full rounded-xl border border-[#F0E8E2] bg-[#FFF1B8]/40 py-2 pl-3 pr-8 text-xs font-semibold text-[#292522] focus:outline-none focus:ring-1 focus:ring-[#E9A9C3] appearance-none cursor-pointer"
                    >
                      {TRANSLATION_TARGET_LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#292522]" />
                  </div>
                </div>
              )}
            </div>

            {/* Paragraph Formatting & Speech Fallback */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#77716D] block mb-1.5 flex items-center gap-1">
                  <SlidersHorizontal className="h-3 w-3" />
                  <span>Paragraph Length:</span>
                </label>
                <div className="inline-flex w-full rounded-xl border border-[#F0E8E2] bg-[#FFFDF8] p-1">
                  {(["short", "medium", "long"] as ParagraphLengthMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => handleParagraphLengthChange(mode)}
                      className={`flex-1 rounded-lg py-1.5 text-xs font-medium capitalize transition-colors ${
                        paragraphLength === mode
                          ? "bg-[#FFF1B8] text-[#292522] font-semibold"
                          : "text-[#77716D] hover:text-[#292522]"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Speech-to-Text Fallback Option */}
              <div className="rounded-xl border border-[#F0E8E2] bg-[#FFFDF8] p-2.5">
                <label htmlFor={speechToggleId} className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    id={speechToggleId}
                    type="checkbox"
                    checked={enableSpeechFallback}
                    onChange={(e) => setEnableSpeechFallback(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-[#F0E8E2] text-[#E9A9C3] focus:ring-[#E9A9C3] cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-[#292522] flex items-center gap-1">
                      <Mic className="h-3 w-3 text-[#E9A9C3]" />
                      Local Speech Recognition Fallback
                    </span>
                    <p className="text-[#77716D] text-[11px] leading-tight mt-0.5">
                      Transcribes audio via faster-whisper if captions are disabled.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-[#E9A9C3] px-7 py-3 text-sm font-semibold text-[#292522] hover:bg-[#DE91B1] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#292522] border-t-transparent" />
                  <span>{loadingMessage}</span>
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  <span>Get Transcript</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50/50 p-6 mb-8 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-[#292522] mb-1">
                Could not retrieve transcript
              </h2>
              <p className="text-sm text-[#77716D] leading-relaxed mb-4">{error.message}</p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleExtract()}
                  className="rounded-lg bg-white border border-[#F0E8E2] px-3.5 py-1.5 text-xs font-medium text-[#292522] hover:bg-[#F8DDE8] transition-colors"
                >
                  Retry Request
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs text-[#77716D] hover:text-[#292522] transition-colors"
                >
                  Try another video
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading state indicator */}
      {isLoading && !result && (
        <div className="rounded-2xl border border-[#F0E8E2] bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF1B8] border border-[#F0E8E2] text-[#292522] mb-4">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#292522] border-t-transparent" />
          </div>
          <h2 className="text-lg font-semibold text-[#292522] mb-1">{loadingMessage}</h2>
          <p className="text-sm text-[#77716D] max-w-sm mx-auto">
            Processing subtitle streams and assembling formatted paragraphs.
          </p>
        </div>
      )}

      {/* Success State: Results View */}
      {result && (
        <div className="space-y-6">
          {/* Warnings Banner if any */}
          {result.warnings && result.warnings.length > 0 && (
            <div className="rounded-xl border border-[#FFF1B8] bg-[#FFF1B8]/40 p-4 flex items-center gap-3 text-xs text-[#292522]">
              <AlertCircle className="h-4 w-4 shrink-0 text-[#292522]" />
              <span>{result.warnings.join(" ")}</span>
            </div>
          )}

          {/* Video Metadata Card */}
          <div className="rounded-2xl border border-[#F0E8E2] bg-white p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {result.video_info?.thumbnail_url && (
              <div className="relative aspect-video w-full sm:w-44 shrink-0 overflow-hidden rounded-xl border border-[#F0E8E2] bg-[#FFFDF8]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={result.video_info.thumbnail_url}
                  alt={result.video_info.title || "YouTube thumbnail"}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {/* Detected / Original Language Badge */}
                <span className="rounded-md bg-[#FFF1B8] border border-[#F0E8E2] px-2 py-0.5 text-xs font-semibold text-[#292522] flex items-center gap-1">
                  <Globe2 className="h-3 w-3" />
                  Original: {result.detected_language_name} ({result.detected_language})
                </span>

                {/* Transcription Method Badge */}
                <span className="rounded-md bg-[#F8DDE8] border border-[#F0E8E2] px-2 py-0.5 text-xs font-medium text-[#292522] flex items-center gap-1">
                  {result.transcription_method === "speech_recognition" ? (
                    <>
                      <Mic className="h-3 w-3" />
                      Speech Recognition
                    </>
                  ) : (
                    <>
                      <FileText className="h-3 w-3" />
                      YouTube Captions
                    </>
                  )}
                </span>

                {/* Translation Badge */}
                {result.is_translated && (
                  <span className="rounded-md bg-amber-100 border border-amber-200 px-2 py-0.5 text-xs font-semibold text-[#292522] flex items-center gap-1">
                    <Languages className="h-3 w-3" />
                    Translated: {result.target_language_name || result.language_name}
                  </span>
                )}

                <a
                  href={`https://www.youtube.com/watch?v=${result.video_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-[#77716D] hover:text-[#292522] transition-colors"
                >
                  <span>Watch on YouTube</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-[#292522] leading-snug line-clamp-2">
                {result.video_info?.title || `YouTube Video (${result.video_id})`}
              </h2>

              {result.video_info?.author && (
                <p className="mt-1 text-xs sm:text-sm text-[#77716D]">
                  Channel: <span className="font-medium text-[#292522]">{result.video_info.author}</span>
                </p>
              )}
            </div>

            <div className="sm:self-center">
              <button
                type="button"
                onClick={handleReset}
                title="Start a new transcript"
                className="flex items-center gap-1.5 rounded-xl border border-[#F0E8E2] bg-[#FFFDF8] px-3 py-2 text-xs font-medium text-[#77716D] hover:text-[#292522] hover:bg-[#F8DDE8]/40 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>New</span>
              </button>
            </div>
          </div>

          {/* Transcript Control Bar */}
          <div className="rounded-2xl border border-[#F0E8E2] bg-white p-4 sm:p-5 shadow-xs">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              {/* Segmented Controls: Tabs + Translation View Mode */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Paragraphs vs Timestamped */}
                <div className="inline-flex rounded-xl border border-[#F0E8E2] bg-[#FFFDF8] p-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab("paragraphs")}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors ${
                      activeTab === "paragraphs"
                        ? "bg-[#F8DDE8] text-[#292522] font-semibold"
                        : "text-[#77716D] hover:text-[#292522]"
                    }`}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Paragraphs</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("segments")}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors ${
                      activeTab === "segments"
                        ? "bg-[#F8DDE8] text-[#292522] font-semibold"
                        : "text-[#77716D] hover:text-[#292522]"
                    }`}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span>Timestamped</span>
                  </button>
                </div>

                {/* If translated: Offer Side-by-Side / Translated / Original toggle */}
                {result.is_translated && (
                  <div className="inline-flex rounded-xl border border-[#F0E8E2] bg-[#FFFDF8] p-1">
                    <button
                      type="button"
                      onClick={() => setViewMode("translated")}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                        viewMode === "translated"
                          ? "bg-[#FFF1B8] text-[#292522] font-semibold"
                          : "text-[#77716D] hover:text-[#292522]"
                      }`}
                    >
                      Translated
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("original")}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                        viewMode === "original"
                          ? "bg-[#FFF1B8] text-[#292522] font-semibold"
                          : "text-[#77716D] hover:text-[#292522]"
                      }`}
                    >
                      Original
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("side_by_side")}
                      className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                        viewMode === "side_by_side"
                          ? "bg-[#FFF1B8] text-[#292522] font-semibold"
                          : "text-[#77716D] hover:text-[#292522]"
                      }`}
                    >
                      <Columns2 className="h-3 w-3" />
                      <span>Side-by-Side</span>
                    </button>
                  </div>
                )}

                {/* Counts */}
                <div className="hidden sm:flex items-center gap-3 text-xs text-[#77716D] pl-2 border-l border-[#F0E8E2]">
                  <span>
                    <strong className="text-[#292522] font-semibold">{result.word_count}</strong> words
                  </span>
                  <span>
                    <strong className="text-[#292522] font-semibold">{result.character_count}</strong> chars
                  </span>
                </div>
              </div>

              {/* Search & Export Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 sm:flex-initial">
                  <label htmlFor={searchInputId} className="sr-only">
                    Search in transcript
                  </label>
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#77716D]" />
                  <input
                    id={searchInputId}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Find in text..."
                    className="w-full sm:w-36 rounded-lg border border-[#F0E8E2] bg-[#FFFDF8] py-1.5 pl-8 pr-2.5 text-xs text-[#292522] placeholder:text-[#77716D]/60 focus:outline-none focus:ring-1 focus:ring-[#E9A9C3]"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#77716D] hover:text-[#292522]"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleCopyAll}
                  className="flex items-center gap-1.5 rounded-lg bg-[#E9A9C3] px-3 py-1.5 text-xs font-semibold text-[#292522] hover:bg-[#DE91B1] transition-colors shadow-xs"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy All</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadTxt}
                  title="Download plain text"
                  className="flex items-center gap-1.5 rounded-lg border border-[#F0E8E2] bg-[#FFFDF8] px-2.5 py-1.5 text-xs font-medium text-[#292522] hover:bg-[#FFF1B8]/60 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>TXT</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadJson}
                  title="Download structured JSON"
                  className="flex items-center gap-1.5 rounded-lg border border-[#F0E8E2] bg-[#FFFDF8] px-2.5 py-1.5 text-xs font-medium text-[#292522] hover:bg-[#FFF1B8]/60 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>JSON</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadSrt}
                  title="Download SubRip subtitle format"
                  className="flex items-center gap-1.5 rounded-lg border border-[#F0E8E2] bg-[#FFFDF8] px-2.5 py-1.5 text-xs font-medium text-[#292522] hover:bg-[#FFF1B8]/60 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>SRT</span>
                </button>
              </div>
            </div>
          </div>

          {/* Reading View */}
          <div className="rounded-2xl border border-[#F0E8E2] bg-white p-6 sm:p-8 shadow-xs">
            {/* Case 1: Side-by-Side Mode */}
            {viewMode === "side_by_side" && result.is_translated ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-3 border-b border-[#F0E8E2]">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#77716D]">
                    <span className="h-2 w-2 rounded-full bg-[#E9A9C3]" />
                    Original ({result.detected_language_name})
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#77716D]">
                    <span className="h-2 w-2 rounded-full bg-[#FFF1B8]" />
                    Translated ({result.target_language_name || result.language_name})
                  </div>
                </div>

                {activeTab === "paragraphs" ? (
                  <div className="space-y-6">
                    {result.original_paragraphs.map((origPara, i) => {
                      const transPara = result.translated_paragraphs?.[i] || "";
                      return (
                        <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start pb-4 border-b border-[#F0E8E2]/50 last:border-b-0">
                          <p className="text-base leading-relaxed text-[#292522]">
                            {origPara}
                          </p>
                          <p className="text-base leading-relaxed text-[#292522] bg-[#FFFDF8] p-3 rounded-xl border border-[#F0E8E2]">
                            {transPara}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {result.original_segments.map((origSeg, i) => {
                      const transSeg = result.translated_segments?.[i];
                      return (
                        <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start p-2 rounded-xl hover:bg-[#FFFDF8] border-b border-[#F0E8E2]/40 last:border-b-0">
                          <div className="flex items-start gap-2">
                            <span className="shrink-0 font-mono text-[11px] font-semibold text-[#77716D] bg-[#FFF1B8] border border-[#F0E8E2] px-1.5 py-0.5 rounded mt-0.5">
                              {formatTime(origSeg.start)}
                            </span>
                            <p className="text-sm text-[#292522]">{origSeg.text}</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="shrink-0 font-mono text-[11px] font-semibold text-[#77716D] bg-[#F8DDE8] border border-[#F0E8E2] px-1.5 py-0.5 rounded mt-0.5">
                              {formatTime(transSeg?.start ?? origSeg.start)}
                            </span>
                            <p className="text-sm text-[#292522]">{transSeg?.text || ""}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : activeTab === "paragraphs" ? (
              /* Case 2: Standard Paragraphs View */
              <div className="space-y-6">
                {filteredParagraphs.length > 0 ? (
                  filteredParagraphs.map((para, i) => (
                    <p
                      key={i}
                      className="text-base sm:text-lg leading-relaxed text-[#292522] font-normal"
                    >
                      {para}
                    </p>
                  ))
                ) : (
                  <div className="py-8 text-center text-sm text-[#77716D]">
                    No paragraphs matched your search keyword &ldquo;{searchQuery}&rdquo;.
                  </div>
                )}
              </div>
            ) : (
              /* Case 3: Standard Timestamped Segments View */
              <div className="space-y-2">
                {filteredSegments.length > 0 ? (
                  filteredSegments.map((seg, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-lg p-2 hover:bg-[#FFFDF8] transition-colors border-b border-[#F0E8E2]/50 last:border-b-0"
                    >
                      <span className="shrink-0 font-mono text-xs font-semibold text-[#77716D] bg-[#FFF1B8] border border-[#F0E8E2] px-2 py-0.5 rounded-md mt-0.5">
                        {formatTime(seg.start)}
                      </span>
                      <p className="text-sm sm:text-base text-[#292522] leading-relaxed">
                        {seg.text}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-sm text-[#77716D]">
                    No subtitle segments matched your search keyword &ldquo;{searchQuery}&rdquo;.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Privacy & Engine Transparency Box */}
          <div className="rounded-xl border border-[#F0E8E2] bg-[#FFFDF8] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#77716D]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#292522]" />
              <span>
                {result.transcription_method === "speech_recognition"
                  ? "Audio was processed entirely on your local machine using faster-whisper. Temporary files were cleaned up."
                  : "Extracted directly from official YouTube caption streams without third-party audio downloading."}
              </span>
            </div>
            {result.is_translated && (
              <span className="font-medium text-[#292522]">
                Translation Provider: {result.translation_provider === "youtube_captions" ? "YouTube Official" : "Modular Provider (MyMemory)"}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!result && !isLoading && (
        <div className="rounded-2xl border border-[#F0E8E2] bg-white p-8 sm:p-10 shadow-xs">
          <div className="text-center max-w-lg mx-auto mb-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF1B8] border border-[#F0E8E2] text-[#292522] mb-3">
              <FileText className="h-6 w-6" />
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-[#292522]">
              Ready to extract clean transcripts
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-[#77716D] leading-relaxed">
              Paste any YouTube video link above to extract clean captions and formatted paragraphs in any language, or try a verified sample video below.
            </p>
          </div>

          <div className="border-t border-[#F0E8E2] pt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#77716D] mb-3 text-center sm:text-left">
              Try a sample video:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SAMPLE_VIDEOS.map((sample) => (
                <button
                  key={sample.url}
                  type="button"
                  onClick={() => {
                    setUrl(sample.url);
                    setUrlError(null);
                    setError(null);
                    handleExtract(sample.url);
                  }}
                  className="flex items-center justify-between rounded-xl border border-[#F0E8E2] bg-[#FFFDF8] p-3 text-left hover:border-[#E9A9C3] hover:bg-[#F8DDE8]/20 transition-all group"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs sm:text-sm font-medium text-[#292522] truncate">
                      {sample.title}
                    </p>
                    <span className="text-[11px] text-[#77716D]">{sample.tag}</span>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-[#292522] bg-[#FFF1B8] px-2 py-0.5 rounded-md border border-[#F0E8E2]">
                    Try
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
