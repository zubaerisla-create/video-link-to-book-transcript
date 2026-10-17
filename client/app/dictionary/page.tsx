"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bookmark,
  Search,
  SlidersHorizontal,
  Volume2,
  Trash2,
  Edit3,
  ExternalLink,
  BookOpen,
  Sparkles,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  Filter,
  Plus,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  listSavedWordsApi,
  updateSavedWordApi,
  deleteSavedWordApi,
  ApiError,
} from "@/lib/api";
import {
  SavedWord,
  LearningStatus,
  SavedWordListResponse,
} from "@/lib/types";
import { VocabularyReviewModal } from "@/components/dictionary/VocabularyReviewModal";

export default function DictionaryPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [words, setWords] = useState<SavedWord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusCounts, setStatusCounts] = useState({
    total: 0,
    new: 0,
    learning: 0,
    learned: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortOption, setSortOption] = useState<string>("newest");

  // Modals & Actions
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [deletingWord, setDeletingWord] = useState<SavedWord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit Note Modal
  const [editingNoteWord, setEditingNoteWord] = useState<SavedWord | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Status updating indicator
  const [updatingWordId, setUpdatingWordId] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login?redirect=/dictionary");
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch saved words
  const loadWords = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await listSavedWordsApi({
        search: searchQuery,
        status: statusFilter,
        sort: sortOption,
        page: currentPage,
        page_size: 15,
      });
      setWords(res.items);
      setTotalCount(res.total);
      setTotalPages(res.total_pages);
      setStatusCounts(res.counts);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to load your personal dictionary.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, searchQuery, statusFilter, sortOption, currentPage]);

  useEffect(() => {
    loadWords();
  }, [loadWords]);

  // Search debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // Status filter click
  const handleFilterClick = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  // Status toggle on card
  const handleStatusChange = async (word: SavedWord, newStatus: LearningStatus) => {
    try {
      setUpdatingWordId(word.id);
      const updated = await updateSavedWordApi(word.id, { learning_status: newStatus });
      setWords((prev) => prev.map((w) => (w.id === word.id ? updated : w)));
      // Refresh status counts
      loadWords();
    } catch {
      // Error updating
    } finally {
      setUpdatingWordId(null);
    }
  };

  // Audio pronunciation
  const handlePlayAudio = (wordText: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(wordText);
      utterance.lang = "en-US";
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Open note edit
  const openEditNote = (word: SavedWord) => {
    setEditingNoteWord(word);
    setNoteDraft(word.notes || "");
  };

  // Save note
  const handleSaveNote = async () => {
    if (!editingNoteWord || isSavingNote) return;
    try {
      setIsSavingNote(true);
      const updated = await updateSavedWordApi(editingNoteWord.id, { notes: noteDraft });
      setWords((prev) => prev.map((w) => (w.id === editingNoteWord.id ? updated : w)));
      setEditingNoteWord(null);
    } catch {
      // Keep modal open on error
    } finally {
      setIsSavingNote(false);
    }
  };

  // Delete word confirmation
  const handleDeleteWord = async () => {
    if (!deletingWord || isDeleting) return;
    try {
      setIsDeleting(true);
      await deleteSavedWordApi(deletingWord.id);
      setDeletingWord(null);
      loadWords();
    } catch {
      // Failed to delete
    } finally {
      setIsDeleting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#FFFDF8]">
        <div className="text-center">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-[#E9A9C3]" />
          <p className="text-xs text-[#77716D]">Loading your personal dictionary...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFDF8] pb-24">
      {/* Top Banner */}
      <div className="border-b border-[#F0E8E2] bg-white/70 backdrop-blur-xs">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#F8DDE8] text-[#9D3D64]">
                  <Bookmark className="h-4 w-4" />
                </span>
                <h1 className="text-2xl font-extrabold text-[#292522] tracking-tight">
                  My Dictionary
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-[#77716D]">
                Your personal English-to-Bangla vocabulary collection saved while reading transcripts.
              </p>
            </div>

            {/* Right Action: Flashcards Review */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsReviewOpen(true)}
                disabled={statusCounts.total === 0}
                className="flex items-center gap-2 rounded-2xl bg-[#E9A9C3] px-4 py-2.5 text-xs sm:text-sm font-bold text-[#292522] hover:bg-[#DE91B1] shadow-xs transition-colors cursor-pointer disabled:opacity-40"
              >
                <Sparkles className="h-4 w-4 text-[#292522]" />
                <span>Review Flashcards</span>
              </button>
            </div>
          </div>

          {/* Metric Status Counters */}
          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-4">
            <button
              type="button"
              onClick={() => handleFilterClick("all")}
              className={`rounded-2xl border p-3 sm:p-4 text-left transition-all ${
                statusFilter === "all"
                  ? "border-[#E9A9C3] bg-white shadow-xs"
                  : "border-[#F0E8E2] bg-white/60 hover:bg-white"
              }`}
            >
              <span className="text-[11px] font-semibold text-[#77716D] uppercase tracking-wider block">
                Total Saved
              </span>
              <span className="text-xl sm:text-2xl font-extrabold text-[#292522]">
                {statusCounts.total}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleFilterClick("learning")}
              className={`rounded-2xl border p-3 sm:p-4 text-left transition-all ${
                statusFilter === "learning"
                  ? "border-amber-300 bg-amber-50/50 shadow-xs"
                  : "border-[#F0E8E2] bg-white/60 hover:bg-white"
              }`}
            >
              <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">
                Learning
              </span>
              <span className="text-xl sm:text-2xl font-extrabold text-amber-900">
                {statusCounts.learning}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleFilterClick("learned")}
              className={`rounded-2xl border p-3 sm:p-4 text-left transition-all ${
                statusFilter === "learned"
                  ? "border-emerald-300 bg-emerald-50/50 shadow-xs"
                  : "border-[#F0E8E2] bg-white/60 hover:bg-white"
              }`}
            >
              <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">
                Learned
              </span>
              <span className="text-xl sm:text-2xl font-extrabold text-emerald-900">
                {statusCounts.learned}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleFilterClick("new")}
              className={`rounded-2xl border p-3 sm:p-4 text-left transition-all ${
                statusFilter === "new"
                  ? "border-blue-300 bg-blue-50/50 shadow-xs"
                  : "border-[#F0E8E2] bg-white/60 hover:bg-white"
              }`}
            >
              <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider block">
                New
              </span>
              <span className="text-xl sm:text-2xl font-extrabold text-blue-900">
                {statusCounts.new}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Controls Bar: Search & Sort */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#77716D]" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search English word or বাংলা অর্থ..."
              className="w-full rounded-2xl border border-[#F0E8E2] bg-white py-2 pl-9 pr-8 text-xs sm:text-sm text-[#292522] placeholder:text-[#77716D]/70 focus:outline-none focus:ring-2 focus:ring-[#E9A9C3] shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#77716D] hover:text-[#292522]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-3.5 w-3.5 text-[#77716D]" />
            <span className="text-xs text-[#77716D]">Sort by:</span>
            <select
              value={sortOption}
              onChange={(e) => {
                setSortOption(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-xl border border-[#F0E8E2] bg-white px-3 py-1.5 text-xs font-medium text-[#292522] focus:outline-none focus:ring-1 focus:ring-[#E9A9C3] shadow-xs cursor-pointer"
            >
              <option value="newest">Recently Added</option>
              <option value="oldest">Oldest First</option>
              <option value="alphabetical">Alphabetical (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Word Cards Grid */}
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#E9A9C3]" />
            <p className="text-xs text-[#77716D]">Loading dictionary words...</p>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center space-y-3">
            <AlertCircle className="mx-auto h-8 w-8 text-red-600" />
            <p className="text-xs text-red-700">{error}</p>
            <button
              type="button"
              onClick={loadWords}
              className="inline-flex items-center gap-1 text-xs font-semibold text-red-800 underline"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Retry</span>
            </button>
          </div>
        ) : words.length === 0 ? (
          <div className="rounded-3xl border border-[#F0E8E2] bg-white p-12 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-[#FFF1B8]/60 text-[#854D0E]">
              <Bookmark className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#292522]">
                {searchQuery || statusFilter !== "all"
                  ? "No Matching Words Found"
                  : "Your Dictionary is Empty"}
              </h3>
              <p className="mt-1 text-xs text-[#77716D] max-w-sm mx-auto">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your search query or status filter to see other saved words."
                  : "Highlight any English word while reading books in Transcriptly to see its instant Bangla translation and save it here."}
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-[#E9A9C3] px-5 py-2.5 text-xs font-bold text-[#292522] hover:bg-[#DE91B1] shadow-xs"
              >
                <BookOpen className="h-4 w-4" />
                <span>Go to My Books</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {words.map((word) => {
              const isUpdating = updatingWordId === word.id;
              const formattedDate = new Date(word.created_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              });

              return (
                <div
                  key={word.id}
                  className="rounded-3xl border border-[#F0E8E2] bg-white p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
                >
                  {/* Top Word Row */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-lg font-bold text-[#292522] tracking-tight break-all">
                            {word.original_word}
                          </h2>
                          {word.part_of_speech && (
                            <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-md bg-[#F8DDE8]/50 text-[#9D3D64]">
                              {word.part_of_speech}
                            </span>
                          )}
                        </div>

                        {word.pronunciation && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs font-mono text-[#77716D]">
                              {word.pronunciation}
                            </span>
                            <button
                              type="button"
                              onClick={() => handlePlayAudio(word.original_word)}
                              title="Listen to pronunciation"
                              className="p-1 rounded-md text-[#77716D] hover:text-[#292522] hover:bg-black/5 transition-colors"
                            >
                              <Volume2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Learning Status Pill Selector */}
                      <select
                        value={word.learning_status}
                        disabled={isUpdating}
                        onChange={(e) =>
                          handleStatusChange(word, e.target.value as LearningStatus)
                        }
                        className={`rounded-xl border px-2.5 py-1 text-xs font-semibold focus:outline-none cursor-pointer ${
                          word.learning_status === "learned"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                            : word.learning_status === "learning"
                            ? "bg-amber-50 text-amber-800 border-amber-300"
                            : "bg-blue-50 text-blue-800 border-blue-300"
                        }`}
                      >
                        <option value="learning">Learning</option>
                        <option value="learned">Learned</option>
                        <option value="new">New</option>
                      </select>
                    </div>

                    {/* Bangla Meaning Box */}
                    <div className="rounded-2xl bg-[#FFF1B8]/40 border border-[#FFF1B8]/60 p-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#854D0E] block mb-0.5">
                        বাংলা অর্থ
                      </span>
                      <p className="text-base font-bold text-[#292522] leading-snug">
                        {word.bangla_meaning}
                      </p>
                    </div>

                    {/* English Definition */}
                    {word.english_definition && (
                      <div className="text-xs text-[#77716D] leading-relaxed">
                        <span className="font-semibold text-[#292522]">Def: </span>
                        {word.english_definition}
                      </div>
                    )}

                    {/* Example Sentence */}
                    {word.example_sentence && (
                      <div className="text-xs text-[#77716D] italic border-l-2 border-[#E9A9C3] pl-2.5 py-0.5">
                        &ldquo;{word.example_sentence}&rdquo;
                      </div>
                    )}

                    {/* Personal Notes */}
                    <div className="pt-1">
                      {word.notes ? (
                        <div className="rounded-xl border border-dashed border-[#F0E8E2] bg-[#FFFDF8] p-2.5 text-xs text-[#433422] flex items-start justify-between gap-2">
                          <p className="line-clamp-3 italic">
                            &ldquo;{word.notes}&rdquo;
                          </p>
                          <button
                            type="button"
                            onClick={() => openEditNote(word)}
                            title="Edit note"
                            className="p-1 text-[#77716D] hover:text-[#292522] shrink-0"
                          >
                            <Edit3 className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openEditNote(word)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-[#77716D] hover:text-[#292522] transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Add note</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom Row: Source Book Link & Delete */}
                  <div className="pt-3 border-t border-[#F0E8E2] flex items-center justify-between gap-2 text-[11px] text-[#77716D]">
                    <div className="min-w-0 flex-1 flex items-center gap-1">
                      {word.source_book_id && word.source_book_title ? (
                        <Link
                          href={`/books/${word.source_book_id}`}
                          title={`Open ${word.source_book_title}`}
                          className="flex items-center gap-1 text-[#E9A9C3] hover:underline truncate"
                        >
                          <BookOpen className="h-3 w-3 shrink-0" />
                          <span className="truncate">{word.source_book_title}</span>
                        </Link>
                      ) : (
                        <span>Added {formattedDate}</span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setDeletingWord(word)}
                      title="Delete word"
                      className="p-1 rounded-lg text-[#77716D] hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between border-t border-[#F0E8E2] pt-4">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="flex items-center gap-1 rounded-xl border border-[#F0E8E2] bg-white px-3.5 py-2 text-xs font-semibold text-[#292522] hover:bg-[#FFFDF8] shadow-xs disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </button>

            <span className="text-xs font-semibold text-[#77716D]">
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="flex items-center gap-1 rounded-xl border border-[#F0E8E2] bg-white px-3.5 py-2 text-xs font-semibold text-[#292522] hover:bg-[#FFFDF8] shadow-xs disabled:opacity-40 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </main>

      {/* Review Flashcards Modal */}
      <VocabularyReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        onWordsUpdated={loadWords}
      />

      {/* Edit Note Modal */}
      {editingNoteWord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-3xl border border-[#F0E8E2] bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0E8E2]">
              <h3 className="text-sm font-bold text-[#292522]">
                Personal Note for &ldquo;{editingNoteWord.original_word}&rdquo;
              </h3>
              <button
                type="button"
                onClick={() => setEditingNoteWord(null)}
                className="p-1 rounded-lg text-[#77716D] hover:text-[#292522]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="py-4">
              <textarea
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder="Write your personal mnemonics, example sentence, or context..."
                rows={4}
                className="w-full rounded-2xl border border-[#F0E8E2] p-3 text-xs sm:text-sm text-[#292522] placeholder:text-[#77716D]/60 focus:outline-none focus:ring-2 focus:ring-[#E9A9C3]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F0E8E2]">
              <button
                type="button"
                onClick={() => setEditingNoteWord(null)}
                className="rounded-xl border border-[#F0E8E2] px-4 py-2 text-xs font-semibold text-[#77716D] hover:text-[#292522]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNote}
                disabled={isSavingNote}
                className="rounded-xl bg-[#E9A9C3] px-4 py-2 text-xs font-bold text-[#292522] hover:bg-[#DE91B1] shadow-xs disabled:opacity-50"
              >
                {isSavingNote ? "Saving..." : "Save Note"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingWord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-sm rounded-3xl border border-[#F0E8E2] bg-white p-6 shadow-2xl text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-[#292522]">Delete Word?</h3>
            <p className="mt-1 text-xs text-[#77716D]">
              Are you sure you want to remove &ldquo;{deletingWord.original_word}&rdquo; from your personal dictionary?
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingWord(null)}
                className="flex-1 rounded-xl border border-[#F0E8E2] py-2.5 text-xs font-semibold text-[#292522] hover:bg-[#FFFDF8]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteWord}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white hover:bg-red-700 shadow-xs disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete Word"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
