"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BookOpen,
  Check,
  Copy,
  ExternalLink,
  FileText,
  Globe,
  Languages,
  Loader2,
  Save,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Clock,
  Sparkles,
  LogIn,
  UserPlus,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getStagedTranscriptApi, saveBookApi, ApiError } from "@/lib/api";
import { TranscriptResponse, TranscriptSegment } from "@/lib/types";

function ImportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token");

  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [transcript, setTranscript] = useState<TranscriptResponse | null>(null);
  const [bookTitle, setBookTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  // Active view tab: "paragraphs" | "segments"
  const [viewTab, setViewTab] = useState<"paragraphs" | "segments">("paragraphs");

  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadTranscript() {
      // 1. Check if we already have a cached preview in sessionStorage
      const cachedRaw = typeof window !== "undefined" ? sessionStorage.getItem("transcriptly_import_preview") : null;
      let cached: { token?: string; data: TranscriptResponse } | null = null;
      if (cachedRaw) {
        try {
          cached = JSON.parse(cachedRaw);
        } catch {
          // ignore cache parse error
        }
      }

      // If token provided in URL matches cached token, use cached immediately
      if (tokenFromUrl && cached && cached.token === tokenFromUrl && cached.data) {
        if (isMounted) {
          setTranscript(cached.data);
          setBookTitle(cached.data.video_info?.title || `YouTube Video (${cached.data.video_id})`);
          setIsLoading(false);
        }
        return;
      }

      // If token provided in URL, fetch it from backend (single-use consumption)
      if (tokenFromUrl) {
        try {
          setIsLoading(true);
          setError(null);
          setIsExpired(false);
          const data = await getStagedTranscriptApi(tokenFromUrl);
          if (isMounted) {
            setTranscript(data);
            setBookTitle(data.video_info?.title || `YouTube Video (${data.video_id})`);
            // Cache in sessionStorage so user can navigate to login/signup and return without re-fetching
            sessionStorage.setItem(
              "transcriptly_import_preview",
              JSON.stringify({ token: tokenFromUrl, data })
            );
          }
        } catch (err) {
          if (isMounted) {
            if (err instanceof ApiError && (err.code === "TOKEN_EXPIRED" || err.statusCode === 404)) {
              // If single-use token was consumed on previous visit and cached copy exists, fallback to cache
              if (cached && cached.data) {
                setTranscript(cached.data);
                setBookTitle(cached.data.video_info?.title || `YouTube Video (${cached.data.video_id})`);
              } else {
                setIsExpired(true);
                setError(
                  "This import draft has expired or has already been saved. Import tokens are single-use and valid for 5 minutes."
                );
              }
            } else {
              setError(
                err instanceof Error
                  ? err.message
                  : "Failed to retrieve the staged transcript. Please re-import from the Chrome extension."
              );
            }
          }
        } finally {
          if (isMounted) setIsLoading(false);
        }
        return;
      }

      // If no token in URL, try loading whatever is in sessionStorage
      if (cached && cached.data) {
        if (isMounted) {
          setTranscript(cached.data);
          setBookTitle(cached.data.video_info?.title || `YouTube Video (${cached.data.video_id})`);
          setIsLoading(false);
        }
        return;
      }

      // Neither token nor cache
      if (isMounted) {
        setIsLoading(false);
        setError("No import token specified. Please activate the Transcriptly Chrome extension on a YouTube video to import a transcript.");
      }
    }

    loadTranscript();

    return () => {
      isMounted = false;
    };
  }, [tokenFromUrl]);

  const handleCopyText = async () => {
    if (!transcript) return;
    const fullText = transcript.paragraphs.join("\n\n");
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard fallback
    }
  };

  const handleConfirmSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transcript || !bookTitle.trim()) return;

    try {
      setIsSaving(true);
      setSaveError(null);

      const saved = await saveBookApi({
        title: bookTitle.trim(),
        video_id: transcript.video_id,
        video_url: `https://www.youtube.com/watch?v=${transcript.video_id}`,
        channel_title: transcript.video_info?.author || null,
        thumbnail_url: transcript.video_info?.thumbnail_url || null,
        language: transcript.language,
        language_name: transcript.language_name,
        detected_language: transcript.detected_language,
        is_translated: transcript.is_translated,
        target_language: transcript.target_language,
        translation_provider: transcript.translation_provider,
        paragraphs: transcript.paragraphs,
        segments: transcript.segments,
        srt: transcript.srt,
        original_paragraphs: transcript.original_paragraphs,
        original_segments: transcript.original_segments,
        original_srt: transcript.original_srt,
        translated_paragraphs: transcript.translated_paragraphs,
        translated_segments: transcript.translated_segments,
      });

      // Clear preview from sessionStorage upon successful save
      sessionStorage.removeItem("transcriptly_import_preview");
      // Redirect to the saved book reader
      router.push(`/books/${saved.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setSaveError(err.message);
      } else {
        setSaveError("Failed to save book to your library. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const formatTimestamp = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="min-h-screen bg-[#FFFDF8] text-[#292522]">
      {/* Top Banner / Navbar minimal indicator */}
      <div className="border-b border-[#F0E8E2] bg-white/80 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 py-3.5">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-serif text-lg sm:text-xl font-bold tracking-tight text-[#292522]">
            <Image
              src="/logo.png"
              alt="Transcriptly Logo"
              width={26}
              height={26}
              className="rounded-lg object-contain"
            />
            Transcriptly
          </Link>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E9A9C3]/20 px-3 py-1 text-xs font-medium text-[#292522]">
              <Sparkles className="h-3.5 w-3.5 text-[#292522]" />
              Chrome Extension Import
            </span>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-[#E9A9C3] mb-4" />
            <h2 className="font-serif text-xl font-semibold text-[#292522]">
              Preparing your imported transcript...
            </h2>
            <p className="mt-1 text-sm text-[#7D7571]">
              Retrieving draft, verifying Unicode formatting, and preparing the book preview.
            </p>
          </div>
        )}

        {/* Error / Expired state */}
        {!isLoading && error && !transcript && (
          <div className="mx-auto max-w-lg rounded-3xl border border-[#F0E8E2] bg-white p-6 sm:p-8 shadow-xs text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF1B8]/40 text-[#292522]">
              <AlertCircle className="h-7 w-7" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-[#292522]">
              {isExpired ? "Import Session Expired" : "Unable to Load Import"}
            </h2>
            <p className="mt-2 text-sm text-[#7D7571] leading-relaxed">
              {error}
            </p>

            <div className="mt-6 flex flex-col gap-2.5">
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#292522] px-5 py-3 text-sm font-medium text-white hover:bg-[#1a1715] transition-colors"
              >
                Go to Transcriptly Home
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#F0E8E2] bg-white px-5 py-3 text-sm font-medium text-[#292522] hover:bg-[#FFFDF8] transition-colors"
              >
                View My Library
              </Link>
            </div>
          </div>
        )}

        {/* Active Transcript Import Preview */}
        {!isLoading && transcript && (
          <div className="space-y-8">
            {/* Page Title & Intro */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#7D7571] mb-1">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Verified Browser Capture
                </div>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#292522]">
                  Review & Save Transcript
                </h1>
                <p className="text-sm text-[#7D7571] mt-1">
                  Captured directly from YouTube's native transcript reader without datacenter rate limits.
                </p>
              </div>

              {/* Quick Actions (Copy / Original Video) */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#F0E8E2] bg-white px-3.5 py-2 text-xs font-medium text-[#292522] hover:bg-[#FFFDF8] transition-colors shadow-2xs"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied!" : "Copy Text"}
                </button>
                <a
                  href={`https://www.youtube.com/watch?v=${transcript.video_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#F0E8E2] bg-white px-3.5 py-2 text-xs font-medium text-[#7D7571] hover:text-[#292522] hover:bg-[#FFFDF8] transition-colors shadow-2xs"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  YouTube
                </a>
              </div>
            </div>

            {/* Video Overview Card */}
            <div className="rounded-3xl border border-[#F0E8E2] bg-white p-5 sm:p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row gap-5 items-start">
                {transcript.video_info?.thumbnail_url ? (
                  <div className="relative aspect-video w-full sm:w-48 shrink-0 overflow-hidden rounded-2xl bg-[#F0E8E2]">
                    <img
                      src={transcript.video_info.thumbnail_url}
                      alt={transcript.video_info.title || "Video thumbnail"}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-video w-full sm:w-48 shrink-0 items-center justify-center rounded-2xl bg-[#FFF1B8]/30 border border-[#F0E8E2] text-[#7D7571]">
                    <FileText className="h-8 w-8" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1 rounded-md bg-[#FFF1B8]/60 px-2.5 py-0.5 text-xs font-medium text-[#292522]">
                      <Globe className="h-3 w-3" />
                      {transcript.detected_language_name || transcript.language_name}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-[#7D7571]">
                      {transcript.word_count.toLocaleString()} words
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-[#7D7571]">
                      {transcript.segments.length} segments
                    </span>
                  </div>

                  <label className="block text-xs font-semibold text-[#7D7571] mb-1">
                    Book Title
                  </label>
                  <input
                    type="text"
                    value={bookTitle}
                    onChange={(e) => setBookTitle(e.target.value)}
                    placeholder="Enter a title for this book..."
                    className="w-full rounded-xl border border-[#F0E8E2] bg-[#FFFDF8] px-3.5 py-2 text-sm font-semibold text-[#292522] focus:border-[#292522] focus:outline-hidden focus:ring-1 focus:ring-[#292522]"
                  />

                  {transcript.video_info?.author && (
                    <p className="mt-2 text-xs text-[#7D7571]">
                      Channel: <span className="font-medium text-[#292522]">{transcript.video_info.author}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Save / Auth Action Box */}
            <div className="rounded-3xl border border-[#F0E8E2] bg-white p-5 sm:p-6 shadow-xs">
              {saveError && (
                <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{saveError}</span>
                </div>
              )}

              {isAuthenticated ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-[#292522]">
                      Save to Your Digital Library
                    </h3>
                    <p className="text-xs text-[#7D7571] mt-0.5">
                      Save as a readable digital book with custom fonts, reading progress, and PDF export.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleConfirmSave}
                    disabled={isSaving || !bookTitle.trim()}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#292522] px-6 py-3 text-sm font-semibold text-white shadow-xs hover:bg-[#1a1715] disabled:opacity-50 transition-colors shrink-0"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <BookOpen className="h-4 w-4" />
                    )}
                    {isSaving ? "Saving Book..." : "Confirm & Save to Library"}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-[#292522]">
                      Sign In to Save This Book
                    </h3>
                    <p className="text-xs text-[#7D7571] mt-0.5">
                      Create a free account or log in. Your imported draft will stay safely loaded when you return.
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <Link
                      href="/login?redirect=/import"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#F0E8E2] bg-white px-4 py-2.5 text-xs font-semibold text-[#292522] hover:bg-[#FFFDF8] transition-colors"
                    >
                      <LogIn className="h-3.5 w-3.5" />
                      Log In
                    </Link>
                    <Link
                      href="/signup?redirect=/import"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#292522] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#1a1715] transition-colors"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      Create Account
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Transcript Preview Tabs & Reader Body */}
            <div className="rounded-3xl border border-[#F0E8E2] bg-white p-6 sm:p-8 shadow-xs">
              {/* Tab selector */}
              <div className="flex items-center justify-between border-b border-[#F0E8E2] pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setViewTab("paragraphs")}
                    className={`rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
                      viewTab === "paragraphs"
                        ? "bg-[#292522] text-white"
                        : "text-[#7D7571] hover:text-[#292522] hover:bg-[#FFFDF8]"
                    }`}
                  >
                    Formatted Story ({transcript.paragraphs.length} paragraphs)
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewTab("segments")}
                    className={`rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
                      viewTab === "segments"
                        ? "bg-[#292522] text-white"
                        : "text-[#7D7571] hover:text-[#292522] hover:bg-[#FFFDF8]"
                    }`}
                  >
                    Timestamp Segments ({transcript.segments.length})
                  </button>
                </div>
              </div>

              {/* View Tab: Paragraphs */}
              {viewTab === "paragraphs" && (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {transcript.paragraphs.map((para, i) => (
                    <p
                      key={i}
                      className="font-serif text-base sm:text-lg leading-relaxed text-[#292522]"
                    >
                      {para}
                    </p>
                  ))}
                </div>
              )}

              {/* View Tab: Segments */}
              {viewTab === "segments" && (
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                  {transcript.segments.map((seg, i) => (
                    <div
                      key={i}
                      className="group flex items-baseline gap-3 rounded-xl p-2 hover:bg-[#FFFDF8] transition-colors"
                    >
                      <span className="font-mono text-xs font-semibold text-[#7D7571] shrink-0 w-12 text-right">
                        {formatTimestamp(seg.start)}
                      </span>
                      <p className="text-sm leading-relaxed text-[#292522] flex-1">
                        {seg.text}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ImportPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FFFDF8] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#E9A9C3]" />
        </div>
      }
    >
      <ImportContent />
    </Suspense>
  );
}
