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
} from "lucide-react";
import {
  fetchTranscript,
  fetchTranscriptLanguages,
  ApiError,
} from "@/lib/api";
import {
  TranscriptResponse,
  ParagraphLengthMode,
  TranscriptLanguage,
} from "@/lib/types";
import { isValidYouTubeUrl, extractClientVideoId } from "@/lib/validation";

const SAMPLE_VIDEOS = [
  {
    title: "Rick Astley - Never Gonna Give You Up",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    tag: "Music / Multi-language",
  },
  {
    title: "Steve Jobs Stanford Commencement Speech",
    url: "https://www.youtube.com/watch?v=UF8uR6Z6KLc",
    tag: "Speech / English",
  },
];

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [paragraphLength, setParagraphLength] = useState<ParagraphLengthMode>("medium");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);
  const [result, setResult] = useState<TranscriptResponse | null>(null);

  // Active view tab: "paragraphs" | "segments"
  const [activeTab, setActiveTab] = useState<"paragraphs" | "segments">("paragraphs");
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);

  // Available languages when inspecting tracks
  const [availableLanguages, setAvailableLanguages] = useState<TranscriptLanguage[]>([]);
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);

  // Accessible IDs for inputs
  const urlInputId = useId();
  const searchInputId = useId();

  // Handle URL change & live validation
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUrl(val);
    if (urlError) {
      setUrlError(null);
    }
    if (error) {
      setError(null);
    }
  };

  // Clear input
  const handleClear = () => {
    setUrl("");
    setUrlError(null);
    setError(null);
  };

  // Clipboard paste action
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
        setUrlError(null);
        setError(null);
      }
    } catch {
      // Clipboard permission denied or unsupported
    }
  };

  // Execute extraction
  const handleExtract = async (overrideUrl?: string, overrideLang?: string) => {
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

    try {
      const data = await fetchTranscript(
        targetUrl,
        overrideLang || selectedLanguage || undefined,
        paragraphLength
      );
      setResult(data);
      setAvailableLanguages(data.available_languages || []);
      setSelectedLanguage(data.language);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        let userMessage = err.message;
        if (err.code === "NO_CAPTIONS") {
          userMessage =
            "No accessible captions or subtitles were found for this video. The creator may have disabled subtitles or YouTube has not auto-generated captions for this content.";
        } else if (err.code === "VIDEO_UNAVAILABLE") {
          userMessage =
            "This YouTube video is unavailable, private, or has been removed.";
        } else if (err.code === "YOUTUBE_BLOCKED") {
          userMessage =
            "YouTube has temporarily throttled caption requests from this network. Please wait a few moments and retry.";
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

  // Language switch
  const handleLanguageSelect = async (langCode: string) => {
    if (!result || langCode === selectedLanguage) return;
    setIsChangingLanguage(true);
    try {
      const data = await fetchTranscript(url, langCode, paragraphLength);
      setResult(data);
      setSelectedLanguage(data.language);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError({ message: err.message, code: err.code });
      }
    } finally {
      setIsChangingLanguage(false);
    }
  };

  // Paragraph length change re-format
  const handleParagraphLengthChange = async (newLength: ParagraphLengthMode) => {
    setParagraphLength(newLength);
    if (result && url) {
      setIsLoading(true);
      try {
        const data = await fetchTranscript(url, selectedLanguage, newLength);
        setResult(data);
      } catch (err: unknown) {
        if (err instanceof ApiError) {
          setError({ message: err.message, code: err.code });
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Reset to initial
  const handleReset = () => {
    setUrl("");
    setUrlError(null);
    setError(null);
    setResult(null);
    setSearchQuery("");
    setCopied(false);
    setSelectedLanguage("");
  };

  // Copy full transcript to clipboard
  const handleCopyAll = async () => {
    if (!result) return;
    const textToCopy =
      activeTab === "paragraphs"
        ? result.paragraphs.join("\n\n")
        : result.segments
            .map((s) => `[${formatTime(s.start)}] ${s.text}`)
            .join("\n");

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
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
    const textContent = `${result.video_info?.title || "YouTube Transcript"}\nURL: https://www.youtube.com/watch?v=${result.video_id}\nLanguage: ${result.language_name} (${result.language})\n\n${result.paragraphs.join("\n\n")}`;
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
    if (!result || !result.srt) return;
    const title = result.video_info?.title || `youtube-${result.video_id}`;
    const cleanTitle = title.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50);
    downloadFile(result.srt, `${cleanTitle}-captions.srt`, "text/plain;charset=utf-8");
  };

  // Helper time format mm:ss
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Filtered paragraphs or segments
  const filteredParagraphs = result
    ? result.paragraphs.filter((p) =>
        searchQuery ? p.toLowerCase().includes(searchQuery.toLowerCase()) : true
      )
    : [];

  const filteredSegments = result
    ? result.segments.filter((s) =>
        searchQuery ? s.text.toLowerCase().includes(searchQuery.toLowerCase()) : true
      )
    : [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Hero Section */}
      <div className="text-center mb-8 sm:mb-10">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF1B8] px-3 py-1 text-xs font-semibold tracking-wider text-[#292522] uppercase mb-4 border border-[#F0E8E2]">
          <Sparkles className="h-3.5 w-3.5 text-[#292522]" />
          <span>YouTube Transcript Extractor</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#292522]">
          Turn YouTube videos into text.
        </h1>
        <p className="mt-3 text-base sm:text-lg text-[#77716D] max-w-2xl mx-auto leading-relaxed">
          Extract captions, organize transcripts into readable paragraphs, and export your text in seconds.
        </p>
        <p className="mt-2 text-xs text-[#77716D]">
          Requires accessible captions or subtitles on the YouTube video.
        </p>
      </div>

      {/* URL Input Card */}
      <div className="rounded-2xl border border-[#F0E8E2] bg-white p-5 sm:p-7 shadow-xs mb-8 transition-shadow hover:shadow-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleExtract();
          }}
          className="space-y-4"
        >
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

            {/* In-input quick buttons: Clear & Paste */}
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

          {/* Validation message if invalid */}
          {urlError && (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-red-600 pl-1">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{urlError}</span>
            </div>
          )}

          {/* Controls bar: Paragraph setting + Extract button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[#77716D] flex items-center gap-1">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Paragraph length:
              </span>
              <div className="inline-flex rounded-lg border border-[#F0E8E2] bg-[#FFFDF8] p-0.5">
                {(["short", "medium", "long"] as ParagraphLengthMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => handleParagraphLengthChange(mode)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
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

            <button
              type="submit"
              disabled={isLoading || isChangingLanguage}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#E9A9C3] px-6 py-3 text-sm font-semibold text-[#292522] hover:bg-[#DE91B1] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#292522] border-t-transparent" />
                  <span>Extracting transcript...</span>
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
          <h2 className="text-lg font-semibold text-[#292522] mb-1">Extracting transcript...</h2>
          <p className="text-sm text-[#77716D] max-w-sm mx-auto">
            Retrieving available subtitle tracks and assembling clean, natural paragraphs.
          </p>
        </div>
      )}

      {/* Success State: Result Section */}
      {result && (
        <div className="space-y-6">
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
                <span className="rounded-md bg-[#FFF1B8] border border-[#F0E8E2] px-2 py-0.5 text-xs font-semibold text-[#292522]">
                  {result.language_name} {result.is_generated ? "(Auto-generated)" : "(Manual)"}
                </span>

                <span className="rounded-md bg-[#F8DDE8] border border-[#F0E8E2] px-2 py-0.5 text-xs font-medium text-[#292522]">
                  {result.paragraphs.length} paragraphs
                </span>

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

              {/* Language switcher dropdown if multiple caption languages are available */}
              {availableLanguages.length > 1 && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-[#77716D]">Available tracks:</span>
                  <div className="relative inline-block">
                    <select
                      value={selectedLanguage}
                      disabled={isChangingLanguage}
                      onChange={(e) => handleLanguageSelect(e.target.value)}
                      className="rounded-lg border border-[#F0E8E2] bg-[#FFFDF8] px-2.5 py-1 text-xs font-medium text-[#292522] focus:outline-none focus:ring-1 focus:ring-[#E9A9C3] pr-7 appearance-none cursor-pointer"
                    >
                      {availableLanguages.map((lang) => (
                        <option key={`${lang.code}-${lang.is_generated}`} value={lang.code}>
                          {lang.name} {lang.is_generated ? "(auto)" : "(manual)"}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#77716D]" />
                  </div>
                  {isChangingLanguage && (
                    <span className="text-xs text-[#77716D] animate-pulse">Switching...</span>
                  )}
                </div>
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

          {/* Transcript Control Bar: Metrics + Tabs + Export Actions */}
          <div className="rounded-2xl border border-[#F0E8E2] bg-white p-4 sm:p-5 shadow-xs">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              {/* Segmented View Tabs */}
              <div className="flex items-center gap-2">
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

              {/* Action Buttons: Copy & Export */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Search in transcript */}
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

                {/* Copy All */}
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

                {/* Download TXT */}
                <button
                  type="button"
                  onClick={handleDownloadTxt}
                  title="Download plain text"
                  className="flex items-center gap-1.5 rounded-lg border border-[#F0E8E2] bg-[#FFFDF8] px-2.5 py-1.5 text-xs font-medium text-[#292522] hover:bg-[#FFF1B8]/60 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>TXT</span>
                </button>

                {/* Download JSON */}
                <button
                  type="button"
                  onClick={handleDownloadJson}
                  title="Download structured JSON"
                  className="flex items-center gap-1.5 rounded-lg border border-[#F0E8E2] bg-[#FFFDF8] px-2.5 py-1.5 text-xs font-medium text-[#292522] hover:bg-[#FFF1B8]/60 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>JSON</span>
                </button>

                {/* Download SRT */}
                {result.srt && (
                  <button
                    type="button"
                    onClick={handleDownloadSrt}
                    title="Download SubRip subtitle format"
                    className="flex items-center gap-1.5 rounded-lg border border-[#F0E8E2] bg-[#FFFDF8] px-2.5 py-1.5 text-xs font-medium text-[#292522] hover:bg-[#FFF1B8]/60 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>SRT</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Transcript Content Reading View */}
          <div className="rounded-2xl border border-[#F0E8E2] bg-white p-6 sm:p-8 shadow-xs">
            {activeTab === "paragraphs" ? (
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
        </div>
      )}

      {/* Empty State / Initial Guidance & Samples */}
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
              Paste any YouTube video link above or click one of the verified sample videos below to see the paragraph formatter in action.
            </p>
          </div>

          {/* Quick sample chips */}
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
                    <p className="text-xs sm:text-sm font-medium text-[#292522] group-hover:text-[#292522] truncate">
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
