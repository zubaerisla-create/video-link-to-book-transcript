import {
  TranscriptResponse,
  TranscriptLanguage,
  VideoInfo,
  ParagraphLengthMode,
  LanguageMode,
  User,
  AuthResponse,
  BookSummary,
  BookDetail,
  BookListResponse,
  SaveBookPayload,
} from "./types";

const getApiBaseUrl = (): string => {
  if (typeof window !== "undefined") {
    const custom = process.env.NEXT_PUBLIC_API_URL;
    if (custom && custom.startsWith("https://") && !custom.includes("localhost")) {
      return custom.replace(/\/$/, "");
    }
    return "";
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001";
};

const API_BASE_URL = getApiBaseUrl();

export class ApiError extends Error {
  code: string;
  statusCode: number;
  retryAfter?: number;

  constructor(
    message: string,
    code: string = "UNKNOWN_ERROR",
    statusCode: number = 500,
    retryAfter?: number
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.statusCode = statusCode;
    this.retryAfter = retryAfter;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMessage = `Request failed with status ${res.status}`;
    let errorCode = "HTTP_ERROR";
    let retryAfter: number | undefined = undefined;

    // 1. Inspect HTTP standard Retry-After header
    const headerRetryAfter = res.headers.get("Retry-After");
    if (headerRetryAfter) {
      const parsedSeconds = parseInt(headerRetryAfter, 10);
      if (!isNaN(parsedSeconds) && parsedSeconds > 0) {
        retryAfter = parsedSeconds;
      }
    }

    try {
      const errorData = await res.json();
      if (errorData?.detail) {
        if (typeof errorData.detail === "string") {
          errorMessage = errorData.detail;
        } else if (typeof errorData.detail === "object") {
          errorMessage = errorData.detail.detail || errorData.detail.message || errorMessage;
          errorCode = errorData.detail.code || errorCode;
          if (typeof errorData.detail.retry_after === "number" && errorData.detail.retry_after > 0) {
            retryAfter = errorData.detail.retry_after;
          }
        }
      }
      if (typeof errorData?.retry_after === "number" && errorData.retry_after > 0) {
        retryAfter = errorData.retry_after;
      }
      if (typeof errorData?.code === "string") {
        errorCode = errorData.code;
      }
      if (typeof errorData?.message === "string" && !errorData?.detail) {
        errorMessage = errorData.message;
      }
    } catch {
      // response wasn't JSON
    }

    throw new ApiError(errorMessage, errorCode, res.status, retryAfter);
  }

  return res.json();
}

export async function checkApiHealth(): Promise<{ status: string; version: string }> {
  const res = await fetch(`${API_BASE_URL}/api/health`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  return handleResponse(res);
}

export interface FetchTranscriptOptions {
  url: string;
  language?: string;
  paragraphLength?: ParagraphLengthMode;
  languageMode?: LanguageMode;
  targetLanguage?: string;
  enableSpeechFallback?: boolean;
}

export async function fetchTranscript({
  url,
  language,
  paragraphLength = "medium",
  languageMode = "original",
  targetLanguage,
  enableSpeechFallback = false,
}: FetchTranscriptOptions): Promise<TranscriptResponse> {
  const res = await fetch(`${API_BASE_URL}/api/transcript`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: url.trim(),
      language: language || undefined,
      paragraph_length: paragraphLength,
      language_mode: languageMode,
      target_language: targetLanguage || undefined,
      enable_speech_fallback: enableSpeechFallback,
    }),
  });

  return handleResponse<TranscriptResponse>(res);
}

export async function fetchTranscriptLanguages(
  videoId: string
): Promise<{ video_id: string; languages: TranscriptLanguage[] }> {
  const res = await fetch(
    `${API_BASE_URL}/api/transcript/languages?video_id=${encodeURIComponent(videoId)}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }
  );

  return handleResponse(res);
}

export async function fetchVideoInfo(videoId: string): Promise<VideoInfo> {
  const res = await fetch(
    `${API_BASE_URL}/api/video-info?video_id=${encodeURIComponent(videoId)}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }
  );

  return handleResponse<VideoInfo>(res);
}

// ==========================================
// Authentication APIs (HttpOnly Cookie Auth)
// ==========================================

export async function signupApi(payload: {
  full_name: string;
  email: string;
  password: string;
  confirm_password: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return handleResponse<AuthResponse>(res);
}

export async function loginApi(payload: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return handleResponse<AuthResponse>(res);
}

export async function logoutApi(): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  return handleResponse<{ message: string }>(res);
}

export async function getMeApi(): Promise<User> {
  const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  return handleResponse<User>(res);
}

// ==========================================
// Digital Book & Personal Library APIs
// ==========================================

export async function saveBookApi(payload: SaveBookPayload): Promise<BookDetail> {
  const res = await fetch(`${API_BASE_URL}/api/books`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return handleResponse<BookDetail>(res);
}

export async function listBooksApi(query?: string, sort: string = "date_desc"): Promise<BookListResponse> {
  const params = new URLSearchParams();
  if (query && query.trim()) params.append("query", query.trim());
  if (sort) params.append("sort", sort);

  const res = await fetch(`${API_BASE_URL}/api/books?${params.toString()}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  return handleResponse<BookListResponse>(res);
}

export async function getBookApi(bookId: string): Promise<BookDetail> {
  const res = await fetch(`${API_BASE_URL}/api/books/${encodeURIComponent(bookId)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  return handleResponse<BookDetail>(res);
}

export async function updateBookApi(
  bookId: string,
  payload: { title?: string; reading_theme?: string; font_size?: string }
): Promise<BookSummary> {
  const res = await fetch(`${API_BASE_URL}/api/books/${encodeURIComponent(bookId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return handleResponse<BookSummary>(res);
}

export async function updateProgressApi(
  bookId: string,
  payload: { last_page_read: number; reading_progress: number }
): Promise<{ book_id: string; last_page_read: number; reading_progress: number }> {
  const res = await fetch(`${API_BASE_URL}/api/books/${encodeURIComponent(bookId)}/progress`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return handleResponse<{ book_id: string; last_page_read: number; reading_progress: number }>(res);
}

export async function deleteBookApi(bookId: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE_URL}/api/books/${encodeURIComponent(bookId)}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  return handleResponse<{ message: string }>(res);
}

export function getBookPdfUrl(bookId: string): string {
  return `${API_BASE_URL}/api/books/${encodeURIComponent(bookId)}/pdf`;
}

export function getBookExportUrl(bookId: string, format: "txt" | "json" | "srt"): string {
  return `${API_BASE_URL}/api/books/${encodeURIComponent(bookId)}/export/${format}`;
}
