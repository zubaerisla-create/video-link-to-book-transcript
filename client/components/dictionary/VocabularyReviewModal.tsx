"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Volume2,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  BookOpen,
  ArrowRight,
  Eye,
  Loader2,
  Trophy,
} from "lucide-react";
import { getReviewWordsApi, updateSavedWordApi } from "@/lib/api";
import { ReviewWord, LearningStatus } from "@/lib/types";

interface VocabularyReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWordsUpdated?: () => void;
}

export function VocabularyReviewModal({
  isOpen,
  onClose,
  onWordsUpdated,
}: VocabularyReviewModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [cards, setCards] = useState<ReviewWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [learnedCount, setLearnedCount] = useState(0);
  const [stillLearningCount, setStillLearningCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const fetchCards = async () => {
    try {
      setIsLoading(true);
      setIsCompleted(false);
      setCurrentIndex(0);
      setIsRevealed(false);
      setLearnedCount(0);
      setStillLearningCount(0);

      const words = await getReviewWordsApi("all", 25);
      setCards(words);
    } catch {
      // Handle silently
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCards();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentCard = cards[currentIndex];
  const totalCards = cards.length;

  const handleReveal = () => {
    setIsRevealed(true);
  };

  const handlePlayAudio = () => {
    if (currentCard && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentCard.original_word);
      utterance.lang = "en-US";
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleStatusChange = async (newStatus: LearningStatus) => {
    if (!currentCard || isUpdating) return;

    try {
      setIsUpdating(true);
      await updateSavedWordApi(currentCard.id, { learning_status: newStatus });
      if (newStatus === "learned") {
        setLearnedCount((prev) => prev + 1);
      } else {
        setStillLearningCount((prev) => prev + 1);
      }

      if (onWordsUpdated) {
        onWordsUpdated();
      }

      // Next card or finish
      if (currentIndex + 1 < totalCards) {
        setCurrentIndex((prev) => prev + 1);
        setIsRevealed(false);
      } else {
        setIsCompleted(true);
      }
    } catch {
      // Advance anyway
      if (currentIndex + 1 < totalCards) {
        setCurrentIndex((prev) => prev + 1);
        setIsRevealed(false);
      } else {
        setIsCompleted(true);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-3xl border border-[#F0E8E2] bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-[#F0E8E2] px-6 py-4 bg-[#FFFDF8]">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFF1B8]/60 text-[#854D0E]">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#292522]">Vocabulary Flashcards</h2>
              <p className="text-[10px] text-[#77716D]">
                {totalCards > 0 ? `Card ${currentIndex + 1} of ${totalCards}` : "Review Mode"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-[#77716D] hover:text-[#292522] hover:bg-[#F0E8E2]/50 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#E9A9C3]" />
              <p className="text-xs text-[#77716D]">Preparing your review deck...</p>
            </div>
          ) : totalCards === 0 ? (
            <div className="py-12 text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-[#F8DDE8]/40 text-[#9D3D64]">
                <BookOpen className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#292522]">No Words to Review Yet</h3>
                <p className="mt-1 text-xs text-[#77716D] max-w-xs mx-auto">
                  Save words while reading transcripts, then return here to practice and reinforce your vocabulary.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-[#E9A9C3] px-5 py-2 text-xs font-bold text-[#292522] hover:bg-[#DE91B1] transition-colors"
              >
                Close
              </button>
            </div>
          ) : isCompleted ? (
            /* Completed Screen */
            <div className="py-10 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-100 text-amber-600 shadow-sm">
                <Trophy className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#292522]">Session Completed! 🎉</h3>
                <p className="mt-1 text-xs text-[#77716D]">
                  Great job practicing your vocabulary today.
                </p>
              </div>

              <div className="mx-auto max-w-xs grid grid-cols-2 gap-3 py-3">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3 text-center">
                  <span className="text-xl font-extrabold text-emerald-800">{learnedCount}</span>
                  <p className="text-[11px] font-semibold text-emerald-700">Marked Learned</p>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3 text-center">
                  <span className="text-xl font-extrabold text-amber-800">{stillLearningCount}</span>
                  <p className="text-[11px] font-semibold text-amber-700">Still Learning</p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={fetchCards}
                  className="flex items-center gap-1.5 rounded-xl border border-[#F0E8E2] px-4 py-2 text-xs font-semibold text-[#292522] hover:bg-[#FFFDF8]"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Practice Again</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl bg-[#E9A9C3] px-5 py-2 text-xs font-bold text-[#292522] hover:bg-[#DE91B1]"
                >
                  Back to Dictionary
                </button>
              </div>
            </div>
          ) : (
            /* Active Flashcard */
            <div className="space-y-6">
              {/* Progress Bar */}
              <div className="w-full bg-[#F0E8E2] rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-[#E9A9C3] h-full transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / totalCards) * 100}%` }}
                />
              </div>

              {/* Flashcard Surface */}
              <div className="rounded-3xl border border-[#F0E8E2] bg-[#FFFDF8] p-6 sm:p-8 text-center space-y-4 shadow-sm min-h-[220px] flex flex-col justify-center">
                {/* English Word */}
                <div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[#292522] tracking-tight">
                    {currentCard.original_word}
                  </h3>
                  {currentCard.pronunciation && (
                    <div className="flex items-center justify-center gap-1.5 mt-1.5">
                      <span className="text-xs font-mono text-[#77716D]">
                        {currentCard.pronunciation}
                      </span>
                      <button
                        type="button"
                        onClick={handlePlayAudio}
                        title="Pronounce word"
                        className="p-1 rounded-md text-[#77716D] hover:text-[#292522] transition-colors"
                      >
                        <Volume2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Example sentence hint */}
                {currentCard.example_sentence && (
                  <p className="text-xs text-[#77716D] italic max-w-sm mx-auto">
                    &ldquo;{currentCard.example_sentence}&rdquo;
                  </p>
                )}

                {/* Revealed Bangla Meaning */}
                {isRevealed ? (
                  <div className="rounded-2xl bg-[#FFF1B8]/50 border border-[#FFF1B8] p-4 animate-in fade-in zoom-in-95 duration-150">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#854D0E] block mb-1">
                      বাংলা অর্থ
                    </span>
                    <p className="text-xl font-bold text-[#292522]">
                      {currentCard.bangla_meaning}
                    </p>
                    {currentCard.english_definition && (
                      <p className="mt-2 text-xs text-[#77716D] text-left border-t border-[#FFF1B8] pt-2">
                        {currentCard.english_definition}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleReveal}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#F8DDE8] px-4 py-2.5 text-xs font-bold text-[#292522] hover:bg-[#E9A9C3] transition-colors cursor-pointer shadow-xs"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Reveal Bangla Meaning</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Assessment Controls */}
              {isRevealed && (
                <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-bottom-2 duration-150">
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleStatusChange("learning")}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-800 hover:bg-amber-100 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <span>Still Learning</span>
                  </button>
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleStatusChange("learned")}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Mark as Learned</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
