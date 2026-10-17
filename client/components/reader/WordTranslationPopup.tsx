"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Bookmark,
  Check,
  RotateCcw,
  Volume2,
  X,
  ExternalLink,
  BookOpen,
  Sparkles,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { lookupWordApi, saveWordApi, ApiError } from "@/lib/api";
import { DictionaryLookupResult, SavedWord } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";

interface WordTranslationPopupProps {
  word: string;
  position: { top: number; left: number; placement: "top" | "bottom" };
  theme: "light" | "sepia" | "dark";
  bookId?: string;
  bookTitle?: string;
  onClose: () => void;
  onWordSaved?: (savedWord: SavedWord) => void;
}

export function WordTranslationPopup({
  word,
  position,
  theme,
  bookId,
  bookTitle,
  onClose,
  onWordSaved,
}: WordTranslationPopupProps) {
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<DictionaryLookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Theme-aware styles
  const themeStyles = {
    light: {
      cardBg: "bg-white",
      border: "border-[#F0E8E2]",
      textPrimary: "text-[#292522]",
      textSecondary: "text-[#77716D]",
      accentBg: "bg-[#FFF1B8]/60",
      accentText: "text-[#854D0E]",
      pillBg: "bg-[#F8DDE8]/40",
      pillText: "text-[#9D3D64]",
      buttonPrimary: "bg-[#E9A9C3] text-[#292522] hover:bg-[#DE91B1]",
      buttonSaved: "bg-emerald-50 text-emerald-800 border-emerald-200",
      shadow: "shadow-2xl shadow-stone-900/10",
    },
    sepia: {
      cardBg: "bg-[#FAF4EC]",
      border: "border-[#E8DACB]",
      textPrimary: "text-[#433422]",
      textSecondary: "text-[#847363]",
      accentBg: "bg-[#ECDCC9]",
      accentText: "text-[#654321]",
      pillBg: "bg-[#E6D7C3]/60",
      pillText: "text-[#5C4533]",
      buttonPrimary: "bg-[#DFCAB5] text-[#433422] hover:bg-[#D4BC9F]",
      buttonSaved: "bg-[#E2EDE5] text-emerald-900 border-emerald-300",
      shadow: "shadow-2xl shadow-amber-950/15",
    },
    dark: {
      cardBg: "bg-[#242220]",
      border: "border-[#363330]",
      textPrimary: "text-[#E6DFD9]",
      textSecondary: "text-[#9E9791]",
      accentBg: "bg-[#332E2A]",
      accentText: "text-[#FCD34D]",
      pillBg: "bg-[#38332E]",
      pillText: "text-[#F8DDE8]",
      buttonPrimary: "bg-[#E9A9C3] text-[#181615] hover:bg-[#DE91B1]",
      buttonSaved: "bg-emerald-950/60 text-emerald-300 border-emerald-800",
      shadow: "shadow-2xl shadow-black/40",
    },
  }[theme];

  // Fetch translation & definition
  const fetchLookup = async () => {
    const controller = new AbortController();
    try {
      setIsLoading(true);
      setError(null);
      const res = await lookupWordApi(word, controller.signal);
      setData(res);
      if (res.is_saved) {
        setIsSaved(true);
        setSavedId(res.saved_id || null);
      }
    } catch (err: any) {
      if (err.name === "AbortError") return;
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Could not retrieve translation for this word.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLookup();
  }, [word]);

  // Handle Save Word
  const handleSaveWord = async () => {
    if (!data || isSaving) return;

    if (!isAuthenticated) {
      // Redirect to login or show notice
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        original_word: data.word,
        bangla_meaning: data.bangla_meaning,
        english_definition: data.english_definition || undefined,
        pronunciation: data.pronunciation || undefined,
        example_sentence: data.example_sentence || undefined,
        part_of_speech: data.part_of_speech || undefined,
        source_book_id: bookId || undefined,
        source_book_title: bookTitle || undefined,
        learning_status: "learning" as const,
      };
      const saved = await saveWordApi(payload);
      setIsSaved(true);
      setSavedId(saved.id);
      if (onWordSaved) {
        onWordSaved(saved);
      }
    } catch (err: any) {
      // Keep state clean on error
    } finally {
      setIsSaving(false);
    }
  };

  // Text-to-speech pronunciation
  const handlePlayAudio = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(data?.word || word);
      utterance.lang = "en-US";
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div
      ref={popupRef}
      style={{
        position: "fixed",
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      className={`z-50 w-72 sm:w-80 rounded-2xl border ${themeStyles.border} ${themeStyles.cardBg} ${themeStyles.shadow} p-3.5 sm:p-4 animate-in fade-in zoom-in-95 duration-150 select-text`}
      role="dialog"
      aria-label={`Translation for ${word}`}
    >
      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-2 border-b border-black/5 dark:border-white/5 pb-2 mb-2.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-base font-bold ${themeStyles.textPrimary} tracking-tight break-all`}>
              {data?.word || word}
            </span>
            {data?.part_of_speech && (
              <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-md ${themeStyles.pillBg} ${themeStyles.pillText}`}>
                {data.part_of_speech}
              </span>
            )}
          </div>
          {data?.pronunciation && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-xs font-mono ${themeStyles.textSecondary}`}>
                {data.pronunciation}
              </span>
              <button
                type="button"
                onClick={handlePlayAudio}
                title="Pronounce word"
                className={`p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 ${themeStyles.textSecondary} hover:${themeStyles.textPrimary} transition-colors`}
              >
                <Volume2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close translation popup"
          className={`p-1 rounded-lg text-[#77716D] hover:text-[#292522] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body Content */}
      {isLoading ? (
        <div className="py-6 text-center space-y-2">
          <Loader2 className="mx-auto h-5 w-5 animate-spin text-[#E9A9C3]" />
          <p className={`text-xs ${themeStyles.textSecondary}`}>Looking up Bangla meaning...</p>
        </div>
      ) : error ? (
        <div className="py-4 text-center space-y-2">
          <AlertCircle className="mx-auto h-5 w-5 text-amber-500" />
          <p className="text-xs text-amber-800 dark:text-amber-200">{error}</p>
          <button
            type="button"
            onClick={fetchLookup}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#E9A9C3] hover:underline pt-1"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Try Again</span>
          </button>
        </div>
      ) : data ? (
        <div className="space-y-2.5">
          {/* Bangla Meaning */}
          <div className={`rounded-xl ${themeStyles.accentBg} p-2.5`}>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${themeStyles.accentText} block mb-0.5`}>
              বাংলা অর্থ
            </span>
            <p className={`text-base font-bold text-[#292522] dark:text-[#FFFDF8] leading-snug`}>
              {data.bangla_meaning}
            </p>
          </div>

          {/* English Definition */}
          {data.english_definition && (
            <div className="text-xs space-y-0.5">
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${themeStyles.textSecondary}`}>
                Definition
              </span>
              <p className={`${themeStyles.textPrimary} leading-relaxed`}>
                {data.english_definition}
              </p>
            </div>
          )}

          {/* Example Sentence */}
          {data.example_sentence && (
            <div className={`text-xs rounded-lg border-l-2 border-[#E9A9C3] pl-2.5 py-1 ${themeStyles.textSecondary} italic leading-relaxed`}>
              &ldquo;{data.example_sentence}&rdquo;
            </div>
          )}

          {/* Action Row: Save Word / Already Saved */}
          <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between gap-2">
            {!isAuthenticated ? (
              <Link
                href="/login"
                className={`text-[11px] font-semibold text-[#E9A9C3] hover:underline flex items-center gap-1`}
              >
                <span>Log in to save word</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            ) : isSaved ? (
              <div className="flex items-center justify-between w-full">
                <span className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium ${themeStyles.buttonSaved}`}>
                  <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Already Saved</span>
                </span>
                <Link
                  href="/dictionary"
                  className={`text-xs font-semibold text-[#E9A9C3] hover:underline flex items-center gap-1`}
                >
                  <span>My Dictionary</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSaveWord}
                disabled={isSaving}
                className={`w-full flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold ${themeStyles.buttonPrimary} shadow-xs transition-colors cursor-pointer disabled:opacity-50`}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="h-3.5 w-3.5" />
                    <span>Save to My Dictionary</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
