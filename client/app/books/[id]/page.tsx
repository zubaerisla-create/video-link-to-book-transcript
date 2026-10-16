"use client";

import React, { useState, useEffect, useMemo, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Search,
  Sliders,
  Type,
  Sun,
  Moon,
  Coffee,
  Download,
  FileDown,
  ListFilter,
  Scroll,
  ExternalLink,
  RotateCcw,
  AlertCircle,
  FileText,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  getBookApi,
  updateProgressApi,
  getBookPdfUrl,
  getBookExportUrl,
  ApiError,
} from "@/lib/api";
import { BookDetail } from "@/lib/types";

interface ReaderPageProps {
  params: Promise<{ id: string }>;
}

type ReaderTheme = "light" | "sepia" | "dark";
type FontSize = "sm" | "md" | "lg" | "xl";

interface BookPage {
  pageNumber: number;
  paragraphs: string[];
}

function paginateParagraphs(paragraphs: string[], targetWordsPerPage = 250): BookPage[] {
  const pages: BookPage[] = [];
  let currentPageParas: string[] = [];
  let currentWordCount = 0;

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;
    const words = trimmed.split(/\s+/).length;

    if (currentWordCount > 0 && currentWordCount + words > targetWordsPerPage * 1.3) {
      pages.push({
        pageNumber: pages.length + 1,
        paragraphs: currentPageParas,
      });
      currentPageParas = [trimmed];
      currentWordCount = words;
    } else {
      currentPageParas.push(trimmed);
      currentWordCount += words;
    }
  }

  if (currentPageParas.length > 0) {
    pages.push({
      pageNumber: pages.length + 1,
      paragraphs: currentPageParas,
    });
  }

  if (pages.length === 0) {
    pages.push({ pageNumber: 1, paragraphs: ["(No text content available in this transcript.)"] });
  }

  return pages;
}

export default function BookReaderPage({ params }: ReaderPageProps) {
  const resolvedParams = use(params);
  const bookId = resolvedParams.id;
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [book, setBook] = useState<BookDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reader Preferences
  const [theme, setTheme] = useState<ReaderTheme>("light");
  const [fontSize, setFontSize] = useState<FontSize>("md");
  const [isContinuous, setIsContinuous] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Load Book
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/login?redirect=/books/${bookId}`);
      return;
    }

    const fetchBook = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getBookApi(bookId);
        setBook(data);
        if (data.reading_theme && ["light", "sepia", "dark"].includes(data.reading_theme)) {
          setTheme(data.reading_theme as ReaderTheme);
        }
        if (data.font_size && ["sm", "md", "lg", "xl"].includes(data.font_size)) {
          setFontSize(data.font_size as FontSize);
        }
        // Auto-resume from last page read
        if (data.last_page_read && data.last_page_read >= 1) {
          setCurrentPage(data.last_page_read);
        }
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Failed to load book content.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchBook();
    }
  }, [bookId, isAuthenticated, authLoading, router]);

  // Paginated Pages
  const pages = useMemo(() => {
    if (!book || !book.paragraphs) return [];
    return paginateParagraphs(book.paragraphs);
  }, [book]);

  const totalPages = pages.length || 1;

  // Sync Reading Progress to Backend
  const saveReadingProgress = async (page: number) => {
    if (!book) return;
    const progress = Math.min(100, Math.round((page / totalPages) * 100));
    try {
      await updateProgressApi(book.id, {
        last_page_read: page,
        reading_progress: progress,
      });
    } catch {
      // Non-critical background sync
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const prev = currentPage - 1;
      setCurrentPage(prev);
      saveReadingProgress(prev);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      const next = currentPage + 1;
      setCurrentPage(next);
      saveReadingProgress(next);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Keyboard Navigation (Left / Right Arrow Keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isContinuous) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === "ArrowLeft") {
        handlePrevPage();
      } else if (e.key === "ArrowRight") {
        handleNextPage();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPage, totalPages, isContinuous]);

  // Detect RTL languages
  const isRtl = useMemo(() => {
    if (!book) return false;
    const code = book.language.toLowerCase().slice(0, 2);
    return ["ar", "ur", "he", "fa"].includes(code);
  }, [book]);

  // Font Size Classes
  const fontSizeClasses: Record<FontSize, string> = {
    sm: "text-sm leading-relaxed",
    md: "text-base leading-relaxed sm:leading-loose",
    lg: "text-lg leading-loose",
    xl: "text-xl leading-loose",
  };

  // Theme Styling Objects
  const themeStyles = {
    light: {
      pageBg: "bg-[#FFFDF8]",
      cardBg: "bg-white",
      text: "text-[#292522]",
      mutedText: "text-[#77716D]",
      border: "border-[#F0E8E2]",
      accentBg: "bg-[#FFF1B8]",
      buttonBg: "bg-[#FFFDF8] hover:bg-[#F8DDE8]/40",
      activePill: "bg-[#F8DDE8] text-[#292522] font-semibold",
    },
    sepia: {
      pageBg: "bg-[#F5EBE1]",
      cardBg: "bg-[#FAF4EC]",
      text: "text-[#433422]",
      mutedText: "text-[#847363]",
      border: "border-[#E8DACB]",
      accentBg: "bg-[#ECDCC9]",
      buttonBg: "bg-[#FAF4EC] hover:bg-[#ECDCC9]/50",
      activePill: "bg-[#DFCAB5] text-[#433422] font-semibold",
    },
    dark: {
      pageBg: "bg-[#181615]",
      cardBg: "bg-[#242220]",
      text: "text-[#E6DFD9]",
      mutedText: "text-[#9E9791]",
      border: "border-[#363330]",
      accentBg: "bg-[#332E2A]",
      buttonBg: "bg-[#242220] hover:bg-[#332E2A]",
      activePill: "bg-[#4D453F] text-[#FFFDF8] font-semibold",
    },
  }[theme];

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[#E9A9C3] border-t-transparent" />
          <p className="text-xs text-[#77716D]">Loading digital book reader...</p>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 shadow-xs">
          <AlertCircle className="mx-auto h-8 w-8 text-red-600 mb-3" />
          <h2 className="text-base font-bold text-red-800">Book Not Accessible</h2>
          <p className="mt-1 text-xs text-red-700">{error || "This book could not be found or you do not have permission to view it."}</p>
          <div className="mt-6">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#E9A9C3] px-4 py-2 text-xs font-semibold text-[#292522] hover:bg-[#DE91B1]"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Library</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const activePageObj = pages[currentPage - 1] || pages[0];

  return (
    <div className={`min-h-screen ${themeStyles.pageBg} transition-colors duration-200 pb-20`}>
      {/* Top Reader Sticky Toolbar */}
      <header className={`sticky top-0 z-30 border-b ${themeStyles.border} ${themeStyles.cardBg}/95 backdrop-blur-md transition-colors`}>
        <div className="mx-auto max-w-4xl flex items-center justify-between px-4 py-2.5 sm:px-6">
          {/* Left: Back & Title info */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/dashboard"
              title="Return to Library"
              className={`flex items-center gap-1 rounded-xl border ${themeStyles.border} ${themeStyles.buttonBg} p-2 text-xs font-medium ${themeStyles.text} transition-colors shrink-0`}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Library</span>
            </Link>

            <div className="min-w-0">
              <h1 className={`text-xs sm:text-sm font-bold ${themeStyles.text} truncate`}>
                {book.title}
              </h1>
              <div className="flex items-center gap-2 text-[10px] text-[#77716D]">
                <span>{book.language_name}</span>
                <span>•</span>
                <span>{book.word_count.toLocaleString()} words</span>
              </div>
            </div>
          </div>

          {/* Right: Customization Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Search Input Toggle */}
            <div className="relative hidden md:block">
              <Search className={`pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 ${themeStyles.mutedText}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find in book..."
                className={`rounded-xl border ${themeStyles.border} ${themeStyles.pageBg} py-1.5 pl-8 pr-6 text-xs ${themeStyles.text} focus:outline-none focus:ring-1 focus:ring-[#E9A9C3] w-36`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[#77716D]"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Mode Toggle: Page by Page vs Continuous */}
            <button
              type="button"
              onClick={() => setIsContinuous(!isContinuous)}
              title={isContinuous ? "Switch to Page-by-Page Reading" : "Switch to Continuous Scrolling"}
              className={`flex items-center gap-1 rounded-xl border ${themeStyles.border} ${themeStyles.buttonBg} p-2 text-xs font-medium ${themeStyles.text} transition-colors`}
            >
              <Scroll className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">{isContinuous ? "Continuous" : "Paged"}</span>
            </button>

            {/* Font Size Selector */}
            <div className={`flex items-center rounded-xl border ${themeStyles.border} ${themeStyles.pageBg} p-0.5`}>
              {(["sm", "md", "lg", "xl"] as FontSize[]).map((size) => (
                <button
                  key={size}
                  onClick={() => setFontSize(size)}
                  className={`rounded-lg px-2 py-1 text-xs font-medium uppercase transition-colors ${
                    fontSize === size ? themeStyles.activePill : themeStyles.mutedText
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>

            {/* Reading Theme Selector */}
            <div className={`flex items-center rounded-xl border ${themeStyles.border} ${themeStyles.pageBg} p-0.5`}>
              <button
                type="button"
                onClick={() => setTheme("light")}
                title="Light Theme"
                className={`rounded-lg p-1.5 transition-colors ${theme === "light" ? themeStyles.activePill : themeStyles.mutedText}`}
              >
                <Sun className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setTheme("sepia")}
                title="Sepia Theme"
                className={`rounded-lg p-1.5 transition-colors ${theme === "sepia" ? themeStyles.activePill : themeStyles.mutedText}`}
              >
                <Coffee className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                title="Dark Theme"
                className={`rounded-lg p-1.5 transition-colors ${theme === "dark" ? themeStyles.activePill : themeStyles.mutedText}`}
              >
                <Moon className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Export Menu Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowExportMenu(!showExportMenu)}
                className={`flex items-center gap-1 rounded-xl border ${themeStyles.border} ${themeStyles.buttonBg} p-2 text-xs font-medium ${themeStyles.text} transition-colors`}
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Export</span>
              </button>

              {showExportMenu && (
                <div className={`absolute right-0 mt-2 w-44 rounded-2xl border ${themeStyles.border} ${themeStyles.cardBg} p-2 shadow-xl z-50`}>
                  <a
                    href={getBookPdfUrl(book.id)}
                    download
                    onClick={() => setShowExportMenu(false)}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium ${themeStyles.text} hover:bg-[#F8DDE8]/40 transition-colors`}
                  >
                    <FileDown className="h-4 w-4 text-[#E9A9C3]" />
                    <span>Download PDF</span>
                  </a>
                  <a
                    href={getBookExportUrl(book.id, "txt")}
                    download
                    onClick={() => setShowExportMenu(false)}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium ${themeStyles.text} hover:bg-[#F8DDE8]/40 transition-colors`}
                  >
                    <FileText className="h-4 w-4" />
                    <span>Plain Text (TXT)</span>
                  </a>
                  <a
                    href={getBookExportUrl(book.id, "srt")}
                    download
                    onClick={() => setShowExportMenu(false)}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium ${themeStyles.text} hover:bg-[#F8DDE8]/40 transition-colors`}
                  >
                    <FileText className="h-4 w-4" />
                    <span>Subtitles (SRT)</span>
                  </a>
                  <a
                    href={getBookExportUrl(book.id, "json")}
                    download
                    onClick={() => setShowExportMenu(false)}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium ${themeStyles.text} hover:bg-[#F8DDE8]/40 transition-colors`}
                  >
                    <FileText className="h-4 w-4" />
                    <span>Structured JSON</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Book Reader Area */}
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {/* Book Jacket / Title Card on Page 1 */}
        {currentPage === 1 && !isContinuous && (
          <div className="mb-8 pb-6 border-b border-[#F0E8E2]/60 text-center">
            {book.channel_title && (
              <p className={`text-xs font-semibold uppercase tracking-wider ${themeStyles.mutedText} mb-2`}>
                {book.channel_title}
              </p>
            )}
            <h1 className={`text-2xl sm:text-3xl font-extrabold ${themeStyles.text} tracking-tight leading-snug max-w-xl mx-auto`}>
              {book.title}
            </h1>
            <div className={`mt-3 flex items-center justify-center gap-3 text-xs ${themeStyles.mutedText}`}>
              <a
                href={book.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:underline text-[#E9A9C3]"
              >
                <span>Original YouTube Video</span>
                <ExternalLink className="h-3 w-3" />
              </a>
              <span>•</span>
              <span>{book.language_name}</span>
            </div>
          </div>
        )}

        {/* Reader Book Surface */}
        <div
          dir={isRtl ? "rtl" : "ltr"}
          className={`rounded-3xl border ${themeStyles.border} ${themeStyles.cardBg} p-6 sm:p-12 shadow-sm transition-colors duration-150 min-h-[500px]`}
        >
          {isContinuous ? (
            /* Continuous Scrolling Mode */
            <div className="space-y-6">
              {book.paragraphs.map((para, idx) => {
                const matches = searchQuery && para.toLowerCase().includes(searchQuery.toLowerCase());
                return (
                  <p
                    key={idx}
                    className={`${fontSizeClasses[fontSize]} ${themeStyles.text} text-justify font-serif tracking-normal ${
                      matches ? "bg-yellow-200/40 rounded-sm" : ""
                    }`}
                  >
                    {para}
                  </p>
                );
              })}
            </div>
          ) : (
            /* Page by Page Reading Mode */
            <div className="space-y-6">
              {activePageObj.paragraphs.map((para, idx) => {
                const matches = searchQuery && para.toLowerCase().includes(searchQuery.toLowerCase());
                return (
                  <p
                    key={idx}
                    className={`${fontSizeClasses[fontSize]} ${themeStyles.text} text-justify font-serif tracking-normal ${
                      matches ? "bg-yellow-200/50 rounded-sm" : ""
                    }`}
                  >
                    {para}
                  </p>
                );
              })}
            </div>
          )}
        </div>

        {/* Page by Page Bottom Navigation */}
        {!isContinuous && (
          <div className="mt-8 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              className={`flex items-center gap-1.5 rounded-2xl border ${themeStyles.border} ${themeStyles.cardBg} px-4 py-2.5 text-xs font-semibold ${themeStyles.text} hover:bg-[#F8DDE8]/40 transition-colors shadow-xs disabled:opacity-40 cursor-pointer`}
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous Page</span>
            </button>

            {/* Page number & Progress */}
            <div className="text-center">
              <span className={`text-xs font-bold ${themeStyles.text}`}>
                Page {currentPage} of {totalPages}
              </span>
              <p className={`text-[10px] ${themeStyles.mutedText}`}>
                {Math.round((currentPage / totalPages) * 100)}% completed
              </p>
            </div>

            <button
              type="button"
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
              className={`flex items-center gap-1.5 rounded-2xl border ${themeStyles.border} ${themeStyles.cardBg} px-4 py-2.5 text-xs font-semibold ${themeStyles.text} hover:bg-[#F8DDE8]/40 transition-colors shadow-xs disabled:opacity-40 cursor-pointer`}
            >
              <span>Next Page</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
