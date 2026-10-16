"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Search,
  SlidersHorizontal,
  ExternalLink,
  Calendar,
  Clock,
  Trash2,
  Edit2,
  Download,
  Plus,
  RotateCcw,
  AlertCircle,
  FileText,
  FileDown,
  Globe2,
  Check,
  X,
  Languages,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  listBooksApi,
  updateBookApi,
  deleteBookApi,
  getBookPdfUrl,
  getBookExportUrl,
  ApiError,
} from "@/lib/api";
import { BookSummary } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [books, setBooks] = useState<BookSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search and Sort
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<string>("date_desc");

  // Rename modal
  const [editingBook, setEditingBook] = useState<BookSummary | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  // Delete modal
  const [deletingBook, setDeletingBook] = useState<BookSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login?redirect=/dashboard");
    }
  }, [authLoading, isAuthenticated, router]);

  // Load books
  const fetchBooks = async () => {
    if (!isAuthenticated) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await listBooksApi(searchQuery, sortOption);
      setBooks(res.books);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to load your library books.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchBooks();
    }
  }, [isAuthenticated, sortOption]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBooks();
  };

  const handleRenameConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBook || !newTitle.trim()) return;

    try {
      setIsRenaming(true);
      const updated = await updateBookApi(editingBook.id, { title: newTitle.trim() });
      setBooks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      setEditingBook(null);
    } catch (err) {
      alert("Failed to rename book. Please try again.");
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingBook) return;

    try {
      setIsDeleting(true);
      await deleteBookApi(deletingBook.id);
      setBooks((prev) => prev.filter((b) => b.id !== deletingBook.id));
      setDeletingBook(null);
    } catch {
      alert("Failed to delete book. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  if (authLoading || (!isAuthenticated && authLoading)) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 text-center text-xs text-[#77716D]">
        Checking authentication...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Header with Greeting & Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#F0E8E2]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#292522]">
            My Digital Library
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#77716D]">
            Welcome back, {user?.full_name}. You have <strong>{books.length}</strong> saved {books.length === 1 ? "book" : "books"}.
          </p>
        </div>

        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-xl bg-[#E9A9C3] px-4 py-2.5 text-xs font-semibold text-[#292522] hover:bg-[#DE91B1] transition-colors shadow-xs"
        >
          <Plus className="h-4 w-4" />
          <span>New Transcript</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="my-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#77716D]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your library by title or channel..."
            className="w-full rounded-xl border border-[#F0E8E2] bg-white py-2 pl-9 pr-3 text-xs sm:text-sm text-[#292522] placeholder:text-[#77716D]/50 focus:outline-none focus:ring-1 focus:ring-[#E9A9C3]"
          />
        </form>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-[#77716D] shrink-0">
            Sort by:
          </label>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="rounded-xl border border-[#F0E8E2] bg-white py-2 px-3 text-xs font-medium text-[#292522] focus:outline-none focus:ring-1 focus:ring-[#E9A9C3] cursor-pointer"
          >
            <option value="date_desc">Newest Saved</option>
            <option value="date_asc">Oldest Saved</option>
            <option value="title_asc">Title (A–Z)</option>
            <option value="progress_desc">Reading Progress</option>
          </select>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="py-20 text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[#E9A9C3] border-t-transparent" />
          <p className="text-xs text-[#77716D]">Loading your personal books...</p>
        </div>
      ) : books.length === 0 ? (
        /* Empty State */
        <div className="rounded-3xl border border-[#F0E8E2] bg-white p-12 text-center shadow-xs">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF1B8] border border-[#F0E8E2] text-[#292522]">
            <BookOpen className="h-7 w-7 text-[#292522]" />
          </div>
          <h2 className="text-lg font-bold text-[#292522]">Your library is empty</h2>
          <p className="mt-1 text-xs sm:text-sm text-[#77716D] max-w-sm mx-auto">
            Extract any YouTube video transcript and click &quot;Save to My Library&quot; to turn it into an accessible digital book.
          </p>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#E9A9C3] px-4 py-2 text-xs font-semibold text-[#292522] hover:bg-[#DE91B1] shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Extract a Transcript</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Books Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map((book) => {
            const progressPercent = Math.round(book.reading_progress || 0);

            return (
              <div
                key={book.id}
                className="group flex flex-col justify-between rounded-3xl border border-[#F0E8E2] bg-white p-5 shadow-xs hover:border-[#E9A9C3] hover:shadow-md transition-all"
              >
                <div>
                  {/* Thumbnail / Book Cover Jacket */}
                  <div className="relative mb-3 aspect-video w-full overflow-hidden rounded-2xl border border-[#F0E8E2] bg-[#FFFDF8]">
                    {book.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={book.thumbnail_url}
                        alt={book.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[#FFF1B8]/40 text-[#77716D]">
                        <BookOpen className="h-8 w-8 text-[#292522]/40" />
                      </div>
                    )}
                    {/* Language Badge */}
                    <span className="absolute bottom-2 left-2 rounded-md bg-[#292522]/85 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-xs">
                      {book.language_name}
                    </span>
                    {book.is_translated && (
                      <span className="absolute top-2 right-2 rounded-md bg-[#FFF1B8] border border-[#F0E8E2] px-1.5 py-0.5 text-[10px] font-semibold text-[#292522]">
                        Translated
                      </span>
                    )}
                  </div>

                  {/* Title & Metadata */}
                  <h3 className="text-sm font-bold text-[#292522] line-clamp-2 leading-snug group-hover:text-[#292522]">
                    {book.title}
                  </h3>

                  {book.channel_title && (
                    <p className="mt-1 text-xs text-[#77716D] line-clamp-1">
                      {book.channel_title}
                    </p>
                  )}

                  {/* Reading Progress Bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] text-[#77716D] mb-1">
                      <span>Progress</span>
                      <span className="font-semibold text-[#292522]">
                        {progressPercent}% (Page {book.last_page_read} of {book.total_pages})
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-[#F0E8E2] overflow-hidden">
                      <div
                        className="h-full bg-[#E9A9C3] rounded-full transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Word count & Date */}
                  <div className="mt-3 flex items-center justify-between text-[11px] text-[#77716D] pt-2 border-t border-[#F0E8E2]/60">
                    <span>{book.word_count.toLocaleString()} words</span>
                    <span>Saved {formatDate(book.created_at)}</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-4 pt-3 border-t border-[#F0E8E2] flex items-center justify-between gap-2">
                  <Link
                    href={`/books/${book.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#FFF1B8] hover:bg-[#F8DDE8] py-2 px-3 text-xs font-semibold text-[#292522] transition-colors"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>{progressPercent > 0 ? "Continue" : "Read Book"}</span>
                  </Link>

                  {/* Rename button */}
                  <button
                    type="button"
                    onClick={() => {
                      setEditingBook(book);
                      setNewTitle(book.title);
                    }}
                    title="Rename Title"
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#F0E8E2] bg-[#FFFDF8] text-[#77716D] hover:text-[#292522] hover:bg-[#F0E8E2]/50 transition-colors"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>

                  {/* PDF Download Direct Link */}
                  <a
                    href={getBookPdfUrl(book.id)}
                    download
                    title="Download Book PDF"
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#F0E8E2] bg-[#FFFDF8] text-[#77716D] hover:text-[#292522] hover:bg-[#F0E8E2]/50 transition-colors"
                  >
                    <FileDown className="h-3.5 w-3.5" />
                  </a>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => setDeletingBook(book)}
                    title="Delete Book"
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#F0E8E2] bg-[#FFFDF8] text-[#77716D] hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rename Book Modal */}
      {editingBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-[#F0E8E2] bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-[#292522] mb-3">Rename Book Title</h3>
            <form onSubmit={handleRenameConfirm} className="space-y-4">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                className="w-full rounded-xl border border-[#F0E8E2] bg-[#FFFDF8] p-2.5 text-xs sm:text-sm text-[#292522] focus:outline-none focus:ring-1 focus:ring-[#E9A9C3]"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingBook(null)}
                  className="rounded-xl px-3 py-1.5 text-xs text-[#77716D]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRenaming || !newTitle.trim()}
                  className="rounded-xl bg-[#E9A9C3] px-4 py-2 text-xs font-semibold text-[#292522] hover:bg-[#DE91B1] shadow-xs"
                >
                  {isRenaming ? "Saving..." : "Save Title"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-[#F0E8E2] bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-red-700 mb-2">Delete Book</h3>
            <p className="text-xs text-[#77716D] leading-relaxed mb-4">
              Are you sure you want to delete <strong>&quot;{deletingBook.title}&quot;</strong>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingBook(null)}
                className="rounded-xl px-3 py-1.5 text-xs text-[#77716D]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 shadow-xs"
              >
                {isDeleting ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
