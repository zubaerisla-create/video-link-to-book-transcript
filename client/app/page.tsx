"use client";

import React, { useState, useEffect, useId } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
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
  BookmarkPlus,
  BookOpen,
  Loader2,
  ArrowRight,
} from "lucide-react";
import {
  fetchTranscript,
  saveBookApi,
  ApiError,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
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

function HomePageContent() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [paragraphLength, setParagraphLength] = useState<ParagraphLengthMode>("medium");

  // Language & Translation Mode
  const [languageMode, setLanguageMode] = useState<LanguageMode>("original");
  const [outputLanguage, setOutputLanguage] = useState<string>("auto");
  const [targetLanguage, setTargetLanguage] = useState<string>("bn");
  const [enableSpeechFallback, setEnableSpeechFallback] = useState<boolean>(false);

  // Results & Loading
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Extracting transcript...");
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);
  const [result, setResult] = useState<TranscriptResponse | null>(null);
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);

  // Rate limit cooldown countdown timer
  useEffect(() => {
    if (retryCountdown === null || retryCountdown <= 0) return;

    const interval = setInterval(() => {
      setRetryCountdown((prev) => {
        if (prev === null || prev <= 1) {
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [retryCountdown]);

  // Save Book to Library Modal state
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [bookTitle, setBookTitle] = useState("");
  const [isSavingBook, setIsSavingBook] = useState(false);
  const [savedBookId, setSavedBookId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Restore pending save if coming back from login/signup
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const shouldSave = params.get("save") === "true";
    if (shouldSave) {
      try {
        const raw = sessionStorage.getItem("transcriptly_pending_save");
        if (raw) {
          const parsed = JSON.parse(raw) as TranscriptResponse;
          setResult(parsed);
          setUrl(`https://www.youtube.com/watch?v=${parsed.video_id}`);
          setBookTitle(parsed.video_info?.title || `Transcript (${parsed.video_id})`);
          setShowSaveModal(true);
        }
      } catch {
        // invalid JSON
      }
    }
  }, []);

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
    setRetryCountdown(null);
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

  // Centralized API error handler with rate-limit countdown
  const handleApiError = (err: unknown) => {
    if (err instanceof ApiError) {
      let userMessage = err.message;
      if (err.code === "NO_CAPTIONS") {
        userMessage =
          "No accessible captions or subtitles were found for this video. You can enable the Speech-to-Text fallback checkbox above to recognize the audio locally.";
      } else if (err.code === "VIDEO_UNAVAILABLE") {
        userMessage =
          "This YouTube video is unavailable, private, or has been removed.";
      } else if (err.code === "VIDEO_RESTRICTED") {
        userMessage =
          "This video is age-restricted or requires YouTube account login.";
      } else if (err.code === "YOUTUBE_BLOCKED") {
        userMessage =
          "YouTube has temporarily throttled automated caption requests from the server. Please wait before retrying.";
      } else if (err.code === "RATE_LIMIT_EXCEEDED") {
        userMessage =
          "Too many requests from your device. Please wait a moment before trying again.";
      } else if (err.code === "SERVER_BUSY") {
        userMessage =
          "The transcript service is currently busy processing concurrent requests. Please wait a moment and retry.";
      } else if (err.code === "INVALID_URL") {
        userMessage =
          "The YouTube link appears invalid or contains an unsupported video ID.";
      }

      // If throttled or rate-limited, start bounded countdown timer
      if (
        err.statusCode === 429 ||
        err.code === "YOUTUBE_BLOCKED" ||
        err.code === "RATE_LIMIT_EXCEEDED" ||
        err.code === "SERVER_BUSY"
      ) {
        const delay = err.retryAfter && err.retryAfter > 0 ? err.retryAfter : 15;
        setRetryCountdown(delay);
      }

      setError({ message: userMessage, code: err.code });
    } else {
      setError({
        message:
          "Could not connect to the transcript extraction service. Please check your internet connection and try again.",
        code: "NETWORK_ERROR",
      });
    }
  };

  // Execute extraction
  const handleExtract = async (overrideUrl?: string) => {
    if (retryCountdown !== null && retryCountdown > 0) {
      return;
    }

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
      handleApiError(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Re-translate when target language changes after extraction
  const handleTargetLanguageChange = async (newTargetLang: string) => {
    if (retryCountdown !== null && retryCountdown > 0) return;
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
      handleApiError(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Paragraph length change
  const handleParagraphLengthChange = async (newLength: ParagraphLengthMode) => {
    if (retryCountdown !== null && retryCountdown > 0) return;
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
      handleApiError(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setUrl("");
    setUrlError(null);
    setError(null);
    setRetryCountdown(null);
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

  const handleSaveClick = () => {
    if (!result) return;
    if (!isAuthenticated) {
      sessionStorage.setItem("transcriptly_pending_save", JSON.stringify(result));
      router.push("/login?redirect=pending_save");
      return;
    }
    setBookTitle(result.video_info?.title || `Transcript of ${result.video_id}`);
    setSavedBookId(null);
    setSaveError(null);
    setShowSaveModal(true);
  };

  const handleConfirmSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!result || !bookTitle.trim()) return;

    try {
      setIsSavingBook(true);
      setSaveError(null);
      const saved = await saveBookApi({
        title: bookTitle.trim(),
        video_id: result.video_id,
        video_url: `https://www.youtube.com/watch?v=${result.video_id}`,
        channel_title: result.video_info?.author || null,
        thumbnail_url: result.video_info?.thumbnail_url || null,
        language: result.language,
        language_name: result.language_name,
        detected_language: result.detected_language,
        is_translated: result.is_translated,
        target_language: result.target_language,
        translation_provider: result.translation_provider,
        paragraphs: result.paragraphs,
        segments: result.segments,
        srt: result.srt,
        original_paragraphs: result.original_paragraphs,
        original_segments: result.original_segments,
        original_srt: result.original_srt,
        translated_paragraphs: result.translated_paragraphs,
        translated_segments: result.translated_segments,
      });

      setSavedBookId(saved.id);
      sessionStorage.removeItem("transcriptly_pending_save");
    } catch (err) {
      if (err instanceof ApiError) {
        setSaveError(err.message);
      } else {
        setSaveError("Failed to save digital book. Please try again.");
      }
    } finally {
      setIsSavingBook(false);
    }
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
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 sm:py-12">
      {/* Hero Section */}
      <div className="text-center mb-8 sm:mb-10">
        <div className="inline-flex items-center max-w-full text-center rounded-full bg-[#FFF1B8] px-3.5 py-1 text-[11px] sm:text-xs font-semibold tracking-wider text-[#292522] uppercase mb-4 border border-[#F0E8E2]">
          <span className="truncate">Multilingual YouTube Transcript Extractor</span>
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
              disabled={isLoading || (retryCountdown !== null && retryCountdown > 0)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-[#E9A9C3] px-7 py-3 text-sm font-semibold text-[#292522] hover:bg-[#DE91B1] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#292522] border-t-transparent" />
                  <span>{loadingMessage}</span>
                </>
              ) : retryCountdown !== null && retryCountdown > 0 ? (
                <>
                  <Clock className="h-4 w-4" />
                  <span>Retry in {retryCountdown}s</span>
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
        <div
          className={`rounded-2xl border p-6 mb-8 shadow-xs ${
            error.code === "YOUTUBE_BLOCKED" ||
            error.code === "RATE_LIMIT_EXCEEDED" ||
            error.code === "SERVER_BUSY"
              ? "border-amber-200 bg-amber-50/50"
              : "border-red-200 bg-red-50/50"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                error.code === "YOUTUBE_BLOCKED" ||
                error.code === "RATE_LIMIT_EXCEEDED" ||
                error.code === "SERVER_BUSY"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-red-100 text-red-600"
              }`}
            >
              <AlertCircle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-[#292522] mb-1">
                {error.code === "YOUTUBE_BLOCKED" ||
                error.code === "RATE_LIMIT_EXCEEDED" ||
                error.code === "SERVER_BUSY"
                  ? "Request Temporarily Throttled"
                  : "Could not retrieve transcript"}
              </h2>
              <p className="text-sm text-[#77716D] leading-relaxed mb-3">
                {error.message}
              </p>

              {retryCountdown !== null && retryCountdown > 0 && (
                <div className="flex items-center gap-2 mb-4 text-xs font-medium text-amber-800 bg-amber-100/80 px-3 py-1.5 rounded-lg w-fit">
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    Retry will become available in {retryCountdown} second
                    {retryCountdown === 1 ? "" : "s"}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleExtract()}
                  disabled={
                    isLoading || (retryCountdown !== null && retryCountdown > 0)
                  }
                  className="rounded-lg bg-white border border-[#F0E8E2] px-3.5 py-1.5 text-xs font-medium text-[#292522] hover:bg-[#F8DDE8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {retryCountdown !== null && retryCountdown > 0
                    ? `Retry available in ${retryCountdown}s`
                    : "Retry Request"}
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
                  onClick={handleSaveClick}
                  className="flex items-center gap-1.5 rounded-lg border border-[#E9A9C3] bg-[#F8DDE8] px-3 py-1.5 text-xs font-semibold text-[#292522] hover:bg-[#DE91B1]/40 transition-colors shadow-xs cursor-pointer"
                >
                  <BookmarkPlus className="h-3.5 w-3.5 text-[#292522]" />
                  <span>Save to My Library</span>
                </button>

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

      {/* Supporting Editorial Content & AdSense Value Sections */}
      <div className="mt-16 space-y-16">
        {/* Schema markup */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebApplication",
                  "name": "Transcriptly",
                  "url": "https://transcriptly.net",
                  "description":
                    "Extract clean captions from YouTube videos into readable paragraphs, bilingual translations, and personal digital books.",
                  "applicationCategory": "UtilityApplication",
                  "operatingSystem": "All",
                  "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "USD",
                  },
                },
                {
                  "@type": "FAQPage",
                  "mainEntity": [
                    {
                      "@type": "Question",
                      "name": "How do I extract a transcript from a YouTube video?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text":
                          "Copy any YouTube video link, paste it into the URL field above, and click Extract Transcript. Transcriptly immediately extracts available captions and formats them into clean paragraphs.",
                      },
                    },
                    {
                      "@type": "Question",
                      "name": "What makes Transcriptly different from copying subtitles directly on YouTube?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text":
                          "YouTube breaks subtitles into hundreds of 3-word fragments with timestamps on every line. Transcriptly automatically detects natural sentence boundaries and speaker pauses to assemble them into pleasant, readable prose.",
                      },
                    },
                    {
                      "@type": "Question",
                      "name": "Does Transcriptly support non-English languages like Bangla?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text":
                          "Yes. Transcriptly includes native Unicode typography support for multilingual captions, including Bangla (বাংলা), Hindi, Arabic, Spanish, French, and other languages.",
                      },
                    },
                    {
                      "@type": "Question",
                      "name": "Can I save transcripts permanently to read later?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text":
                          "Yes. By creating a free account, you can save any transcript into your personal library and read it with our distraction-free digital book reader.",
                      },
                    },
                    {
                      "@type": "Question",
                      "name": "What export formats are supported?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text":
                          "Transcripts can be exported as plain text (.txt), SubRip subtitle files (.srt) with millisecond timecodes, structured JSON (.json), and formatted PDF books.",
                      },
                    },
                  ],
                },
              ],
            }),
          }}
        />

        {/* 3 Steps */}
        <section className="rounded-3xl border border-[#F0E8E2] bg-white p-6 sm:p-10 shadow-xs">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#292522]">
              How to Get a YouTube Transcript in 3 Steps
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#77716D] leading-relaxed">
              No browser extensions, no command-line tools, and no account required for instant extraction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-[#F0E8E2] bg-[#FFFDF8] p-6 flex flex-col justify-between">
              <div>
                <span className="text-3xl font-black text-[#E9A9C3] mb-3 block">01</span>
                <h3 className="font-bold text-base text-[#292522] mb-2">Paste Any YouTube Link</h3>
                <p className="text-xs sm:text-sm text-[#77716D] leading-relaxed">
                  Provide any public video link: standard watch URLs, shortened <code>youtu.be</code> links, YouTube Shorts, or embed links.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-[#F0E8E2] bg-[#FFFDF8] p-6 flex flex-col justify-between">
              <div>
                <span className="text-3xl font-black text-[#E9A9C3] mb-3 block">02</span>
                <h3 className="font-bold text-base text-[#292522] mb-2">Clean Paragraph Assembly</h3>
                <p className="text-xs sm:text-sm text-[#77716D] leading-relaxed">
                  Transcriptly parses the caption stream and uses speaker pauses to eliminate choppy breaks, assembling coherent sentences.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-[#F0E8E2] bg-[#FFFDF8] p-6 flex flex-col justify-between">
              <div>
                <span className="text-3xl font-black text-[#E9A9C3] mb-3 block">03</span>
                <h3 className="font-bold text-base text-[#292522] mb-2">Read, Save & Export</h3>
                <p className="text-xs sm:text-sm text-[#77716D] leading-relaxed">
                  Copy to clipboard with one click, download SRT/TXT/PDF files, or save to your personal library to read distraction-free.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section className="space-y-6">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#292522]">
              Engineered for Real Reading & Research
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#77716D]">
              Designed to help students, researchers, journalists, and language learners digest video information quickly.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-[#F0E8E2] bg-white p-6 shadow-xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF1B8] border border-[#F0E8E2] text-[#292522] mb-4">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-[#292522] mb-2">Readable Paragraphs</h3>
              <p className="text-xs sm:text-sm text-[#77716D] leading-relaxed">
                Raw subtitle tracks display 2–4 words per line. We assemble them into natural paragraphs suitable for reading and article drafting.
              </p>
            </div>

            <div className="rounded-2xl border border-[#F0E8E2] bg-white p-6 shadow-xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F8DDE8] border border-[#F0E8E2] text-[#292522] mb-4">
                <Globe2 className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-[#292522] mb-2">Native Unicode & Bangla</h3>
              <p className="text-xs sm:text-sm text-[#77716D] leading-relaxed">
                Complete font and encoding integrity for Bangla (বাংলা), Hindi, Arabic, and other non-Latin scripts without unwanted machine rewriting.
              </p>
            </div>

            <div className="rounded-2xl border border-[#F0E8E2] bg-white p-6 shadow-xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF1B8] border border-[#F0E8E2] text-[#292522] mb-4">
                <Columns2 className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-[#292522] mb-2">Side-by-Side Translation</h3>
              <p className="text-xs sm:text-sm text-[#77716D] leading-relaxed">
                Translate video transcripts while maintaining aligned original and translated paragraphs side-by-side for language study.
              </p>
            </div>

            <div className="rounded-2xl border border-[#F0E8E2] bg-white p-6 shadow-xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F8DDE8] border border-[#F0E8E2] text-[#292522] mb-4">
                <BookOpen className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-[#292522] mb-2">Digital Book Reader</h3>
              <p className="text-xs sm:text-sm text-[#77716D] leading-relaxed">
                Save long transcripts as permanent digital books. Read page-by-page with Light, Sepia, and Dark themes and progress memory.
              </p>
            </div>

            <div className="rounded-2xl border border-[#F0E8E2] bg-white p-6 shadow-xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF1B8] border border-[#F0E8E2] text-[#292522] mb-4">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-[#292522] mb-2">Timestamped SRT Subtitles</h3>
              <p className="text-xs sm:text-sm text-[#77716D] leading-relaxed">
                Switch to the timestamped tab to cross-reference video moments, or export standard SubRip (.srt) files for video editors.
              </p>
            </div>

            <div className="rounded-2xl border border-[#F0E8E2] bg-white p-6 shadow-xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F8DDE8] border border-[#F0E8E2] text-[#292522] mb-4">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-[#292522] mb-2">Privacy & Ephemeral Utility</h3>
              <p className="text-xs sm:text-sm text-[#77716D] leading-relaxed">
                Guest extraction is processed strictly in-memory and discarded. Saved books in member accounts are private and never shared.
              </p>
            </div>
          </div>
        </section>

        {/* Caption Availability Transparency Notice */}
        <section className="rounded-2xl border border-[#F0E8E2] bg-[#FFF1B8]/30 p-6 sm:p-8 flex flex-col sm:flex-row gap-5 items-start">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FFF1B8] border border-[#F0E8E2] text-[#292522]">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h3 className="text-base sm:text-lg font-bold text-[#292522]">
              Caption Availability & Transparency
            </h3>
            <p className="text-xs sm:text-sm text-[#77716D] leading-relaxed">
              Transcriptly extracts publicly available creator-uploaded subtitle tracks and YouTube auto-generated captions. If an uploader disables subtitles or the video is restricted, Transcriptly will inform you clearly. For videos without captions, you can enable our optional local speech recognition fallback in Options.
            </p>
            <div className="pt-2">
              <Link
                href="/guides/how-to-fix-missing-unavailable-captions"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#292522] underline hover:text-[#E9A9C3]"
              >
                Read our troubleshooting guide on missing captions →
              </Link>
            </div>
          </div>
        </section>

        {/* Learning Guides Callout */}
        <section className="rounded-3xl border border-[#F0E8E2] bg-white p-6 sm:p-10 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-[#F0E8E2]">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#292522]">
                Guides & Tutorials
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-[#77716D]">
                Learn how to get the most out of video transcripts for studying, research, and note-taking.
              </p>
            </div>
            <Link
              href="/guides"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#292522] hover:text-[#E9A9C3]"
            >
              <span>View All 5 Guides</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/guides/how-to-get-transcript-from-youtube"
              className="rounded-2xl border border-[#F0E8E2] bg-[#FFFDF8] p-4 sm:p-5 hover:border-[#E9A9C3] transition-colors group"
            >
              <h3 className="font-bold text-sm sm:text-base text-[#292522] group-hover:text-[#292522] mb-1">
                How to Get a Transcript from a YouTube Video →
              </h3>
              <p className="text-xs text-[#77716D]">
                Step-by-step walkthrough using built-in YouTube player controls and Transcriptly.
              </p>
            </Link>

            <Link
              href="/guides/how-to-copy-and-save-youtube-captions"
              className="rounded-2xl border border-[#F0E8E2] bg-[#FFFDF8] p-4 sm:p-5 hover:border-[#E9A9C3] transition-colors group"
            >
              <h3 className="font-bold text-sm sm:text-base text-[#292522] group-hover:text-[#292522] mb-1">
                How to Copy, Format, and Save YouTube Captions →
              </h3>
              <p className="text-xs text-[#77716D]">
                Format messy captions into clean paragraphs and export TXT, SRT, and PDF files.
              </p>
            </Link>

            <Link
              href="/guides/how-to-use-transcripts-for-studying-research"
              className="rounded-2xl border border-[#F0E8E2] bg-[#FFFDF8] p-4 sm:p-5 hover:border-[#E9A9C3] transition-colors group"
            >
              <h3 className="font-bold text-sm sm:text-base text-[#292522] group-hover:text-[#292522] mb-1">
                How to Use Transcripts for Studying and Research →
              </h3>
              <p className="text-xs text-[#77716D]">
                Proven strategies to speed up comprehension, cite lectures, and build study books.
              </p>
            </Link>

            <Link
              href="/guides/understanding-transcript-languages-and-timestamps"
              className="rounded-2xl border border-[#F0E8E2] bg-[#FFFDF8] p-4 sm:p-5 hover:border-[#E9A9C3] transition-colors group"
            >
              <h3 className="font-bold text-sm sm:text-base text-[#292522] group-hover:text-[#292522] mb-1">
                Understanding Transcript Languages & SRT Files →
              </h3>
              <p className="text-xs text-[#77716D]">
                How automated caption tracks differ from creator tracks and how SRT timecodes operate.
              </p>
            </Link>
          </div>
        </section>

        {/* Homepage FAQ Section */}
        <section className="space-y-6">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#292522]">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#77716D]">
              Quick answers to common questions about using Transcriptly.
            </p>
          </div>

          <div className="space-y-3 max-w-3xl mx-auto">
            <details className="group rounded-2xl border border-[#F0E8E2] bg-white p-5 shadow-xs open:border-[#E9A9C3] open:bg-[#FFFDF8] transition-colors">
              <summary className="flex cursor-pointer items-center justify-between font-semibold text-sm sm:text-base text-[#292522] list-none">
                <span>How do I extract a transcript from a YouTube video?</span>
                <span className="ml-4 shrink-0 transition-transform duration-200 group-open:rotate-180 text-[#77716D]">
                  <ChevronDown className="h-4 w-4" />
                </span>
              </summary>
              <p className="mt-3 text-xs sm:text-sm text-[#77716D] leading-relaxed border-t border-[#F0E8E2]/60 pt-3">
                Copy the link of any public YouTube video, paste it into the URL box at the top of the page, and click &ldquo;Extract Transcript&rdquo;. Transcriptly fetches available caption tracks and assembles them into clean reading paragraphs within seconds.
              </p>
            </details>

            <details className="group rounded-2xl border border-[#F0E8E2] bg-white p-5 shadow-xs open:border-[#E9A9C3] open:bg-[#FFFDF8] transition-colors">
              <summary className="flex cursor-pointer items-center justify-between font-semibold text-sm sm:text-base text-[#292522] list-none">
                <span>Why are YouTube captions normally so hard to read?</span>
                <span className="ml-4 shrink-0 transition-transform duration-200 group-open:rotate-180 text-[#77716D]">
                  <ChevronDown className="h-4 w-4" />
                </span>
              </summary>
              <p className="mt-3 text-xs sm:text-sm text-[#77716D] leading-relaxed border-t border-[#F0E8E2]/60 pt-3">
                YouTube subtitle files are split into tiny chunks synchronized to video timing (typically 2 to 4 words per segment) without proper punctuation. Transcriptly uses speaker pause analysis to reconstruct natural sentence boundaries, creating fluent paragraphs.
              </p>
            </details>

            <details className="group rounded-2xl border border-[#F0E8E2] bg-white p-5 shadow-xs open:border-[#E9A9C3] open:bg-[#FFFDF8] transition-colors">
              <summary className="flex cursor-pointer items-center justify-between font-semibold text-sm sm:text-base text-[#292522] list-none">
                <span>Does Transcriptly support non-English languages like Bangla?</span>
                <span className="ml-4 shrink-0 transition-transform duration-200 group-open:rotate-180 text-[#77716D]">
                  <ChevronDown className="h-4 w-4" />
                </span>
              </summary>
              <p className="mt-3 text-xs sm:text-sm text-[#77716D] leading-relaxed border-t border-[#F0E8E2]/60 pt-3">
                Yes! We support native Unicode scripts for languages such as Bangla (বাংলা), Hindi, Arabic, Spanish, French, and more. Complex conjunct characters and original punctuation are preserved verbatim.
              </p>
            </details>

            <details className="group rounded-2xl border border-[#F0E8E2] bg-white p-5 shadow-xs open:border-[#E9A9C3] open:bg-[#FFFDF8] transition-colors">
              <summary className="flex cursor-pointer items-center justify-between font-semibold text-sm sm:text-base text-[#292522] list-none">
                <span>Can I save transcripts and read them as digital books?</span>
                <span className="ml-4 shrink-0 transition-transform duration-200 group-open:rotate-180 text-[#77716D]">
                  <ChevronDown className="h-4 w-4" />
                </span>
              </summary>
              <p className="mt-3 text-xs sm:text-sm text-[#77716D] leading-relaxed border-t border-[#F0E8E2]/60 pt-3">
                Yes. Log in or create a free account to save transcripts directly into your private library. Our digital book reader includes page-by-page reading, Sepia/Dark modes, progress tracking, and formatted PDF book downloads.
              </p>
            </details>

            <details className="group rounded-2xl border border-[#F0E8E2] bg-white p-5 shadow-xs open:border-[#E9A9C3] open:bg-[#FFFDF8] transition-colors">
              <summary className="flex cursor-pointer items-center justify-between font-semibold text-sm sm:text-base text-[#292522] list-none">
                <span>Is Transcriptly free to use?</span>
                <span className="ml-4 shrink-0 transition-transform duration-200 group-open:rotate-180 text-[#77716D]">
                  <ChevronDown className="h-4 w-4" />
                </span>
              </summary>
              <p className="mt-3 text-xs sm:text-sm text-[#77716D] leading-relaxed border-t border-[#F0E8E2]/60 pt-3">
                Yes. Transcriptly is completely free to use. We do not require paid subscriptions or credit card information. For more answers, check our complete <Link href="/faq" className="underline font-semibold text-[#292522] hover:text-[#E9A9C3]">FAQ Page</Link>.
              </p>
            </details>
          </div>
        </section>
      </div>

      {/* Save to My Library Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl border border-[#F0E8E2] bg-white p-6 sm:p-8 shadow-xl">
            {savedBookId ? (
              <div className="text-center py-4">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
                  <Check className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-[#292522]">Book Saved to Your Library!</h3>
                <p className="mt-1 text-xs text-[#77716D]">
                  Your transcript has been formatted and stored as a permanent digital book.
                </p>

                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => router.push(`/books/${savedBookId}`)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-[#E9A9C3] px-5 py-2.5 text-xs font-semibold text-[#292522] hover:bg-[#DE91B1] shadow-xs cursor-pointer"
                  >
                    <BookOpen className="h-4 w-4" />
                    <span>Open in Digital Reader</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/dashboard")}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-xl border border-[#F0E8E2] bg-[#FFFDF8] px-4 py-2.5 text-xs font-medium text-[#292522] hover:bg-[#FFF1B8]/60 cursor-pointer"
                  >
                    <span>Go to Dashboard</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSaveModal(false)}
                    className="text-xs text-[#77716D] hover:text-[#292522] px-2 py-1"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConfirmSave} className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#F0E8E2] pb-3">
                  <div className="flex items-center gap-2">
                    <BookmarkPlus className="h-5 w-5 text-[#292522]" />
                    <h3 className="text-base font-bold text-[#292522]">Save to My Library</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSaveModal(false)}
                    className="text-[#77716D] hover:text-[#292522] p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {saveError && (
                  <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-2.5 text-xs text-red-700">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{saveError}</span>
                  </div>
                )}

                {/* Video metadata badge */}
                {result && (
                  <div className="rounded-2xl border border-[#F0E8E2] bg-[#FFFDF8] p-3 text-xs space-y-1">
                    <p className="font-semibold text-[#292522] line-clamp-1">
                      {result.video_info?.title || result.video_id}
                    </p>
                    <div className="flex flex-wrap gap-2 text-[11px] text-[#77716D]">
                      {result.video_info?.author && <span>Channel: {result.video_info.author}</span>}
                      <span>•</span>
                      <span>Language: {result.language_name}</span>
                      <span>•</span>
                      <span>{result.word_count} words</span>
                      <span>•</span>
                      <span>{result.paragraphs.length} paragraphs</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#77716D] mb-1.5">
                    Suggested Book Title (Editable):
                  </label>
                  <input
                    type="text"
                    value={bookTitle}
                    onChange={(e) => setBookTitle(e.target.value)}
                    required
                    placeholder="Enter book title..."
                    className="w-full rounded-xl border border-[#F0E8E2] bg-[#FFFDF8] px-3 py-2 text-xs sm:text-sm text-[#292522] focus:outline-none focus:ring-1 focus:ring-[#E9A9C3]"
                  />
                  <p className="mt-1 text-[11px] text-[#77716D]">
                    This will appear on the cover in your personal library and digital book reader.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#F0E8E2]">
                  <button
                    type="button"
                    onClick={() => setShowSaveModal(false)}
                    disabled={isSavingBook}
                    className="rounded-xl px-3.5 py-2 text-xs font-medium text-[#77716D] hover:text-[#292522]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingBook || !bookTitle.trim()}
                    className="flex items-center gap-1.5 rounded-xl bg-[#E9A9C3] px-4 py-2 text-xs font-semibold text-[#292522] hover:bg-[#DE91B1] shadow-xs disabled:opacity-60 cursor-pointer"
                  >
                    {isSavingBook ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Saving Book...</span>
                      </>
                    ) : (
                      <>
                        <BookmarkPlus className="h-3.5 w-3.5" />
                        <span>Confirm & Save</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  return <HomePageContent />;
}
