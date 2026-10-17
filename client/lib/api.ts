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
  StageImportPayload,
  StageImportResponse,
  AdminOverviewResponse,
  AdminUsersResponse,
  AdminFeatureUsageResponse,
  AdminSystemHealthResponse,
  AdminAuditLogsResponse,
  DictionaryLookupResult,
  SavedWord,
  SavedWordListResponse,
  SaveWordPayload,
  UpdateWordPayload,
  ReviewWord,
  ReadingSessionStartPayload,
  ReadingSessionHeartbeatPayload,
  ReadingSessionEndPayload,
  ReadingSessionResponse,
  UserActivityDetailResponse,
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

export async function forgotPasswordApi(email: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return handleResponse<{ message: string }>(res);
}

export async function resetPasswordApi(payload: {
  token: string;
  new_password: string;
  confirm_password: string;
}): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<{ message: string }>(res);
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

// ==========================================
// Browser Extension Transcript Import APIs
// ==========================================

export async function stageTranscriptImportApi(
  payload: StageImportPayload
): Promise<StageImportResponse> {
  const res = await fetch(`${API_BASE_URL}/api/transcript/stage-import`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<StageImportResponse>(res);
}

export async function getStagedTranscriptApi(token: string): Promise<TranscriptResponse> {
  const res = await fetch(`${API_BASE_URL}/api/transcript/staged/${encodeURIComponent(token)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  return handleResponse<TranscriptResponse>(res);
}

// ==========================================
// Admin & Analytics APIs
// ==========================================

export async function getAdminOverviewApi(
  range: string = "7d",
  fromDate?: string,
  toDate?: string
): Promise<AdminOverviewResponse> {
  const params = new URLSearchParams({ range });
  if (fromDate) params.append("from_date", fromDate);
  if (toDate) params.append("to_date", toDate);

  const res = await fetch(`${API_BASE_URL}/api/admin/overview?${params.toString()}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  return handleResponse<AdminOverviewResponse>(res);
}

export async function getAdminUsersApi(
  page: number = 1,
  limit: number = 20,
  search?: string,
  status?: string,
  role?: string
): Promise<AdminUsersResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search && search.trim()) params.append("search", search.trim());
  if (status && status !== "all") params.append("status", status);
  if (role && role !== "all") params.append("role", role);

  const res = await fetch(`${API_BASE_URL}/api/admin/users?${params.toString()}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  return handleResponse<AdminUsersResponse>(res);
}

export async function updateAdminUserStatusApi(
  userId: string,
  isActive: boolean
): Promise<{ message: string; is_active: boolean }> {
  const res = await fetch(`${API_BASE_URL}/api/admin/users/${encodeURIComponent(userId)}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ is_active: isActive }),
  });
  return handleResponse<{ message: string; is_active: boolean }>(res);
}

export async function updateAdminUserRoleApi(
  userId: string,
  role: string
): Promise<{ message: string; role: string; is_admin: boolean }> {
  const res = await fetch(`${API_BASE_URL}/api/admin/users/${encodeURIComponent(userId)}/role`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ role }),
  });
  return handleResponse<{ message: string; role: string; is_admin: boolean }>(res);
}

export async function getAdminFeatureUsageApi(
  range: string = "7d",
  fromDate?: string,
  toDate?: string
): Promise<AdminFeatureUsageResponse> {
  const params = new URLSearchParams({ range });
  if (fromDate) params.append("from_date", fromDate);
  if (toDate) params.append("to_date", toDate);

  const res = await fetch(`${API_BASE_URL}/api/admin/feature-usage?${params.toString()}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  return handleResponse<AdminFeatureUsageResponse>(res);
}

export async function getAdminSystemHealthApi(): Promise<AdminSystemHealthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/admin/system-health`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  return handleResponse<AdminSystemHealthResponse>(res);
}

export async function getAdminAuditLogsApi(
  page: number = 1,
  limit: number = 20
): Promise<AdminAuditLogsResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  const res = await fetch(`${API_BASE_URL}/api/admin/audit-logs?${params.toString()}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  return handleResponse<AdminAuditLogsResponse>(res);
}

export async function collectAnalyticsEventApi(payload: {
  visitor_id: string;
  session_id: string;
  event_type: string;
  page_path?: string;
  referrer?: string;
  device_type?: string;
  browser?: string;
  os?: string;
  duration_ms?: number;
  metadata?: Record<string, any>;
}): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE_URL}/api/analytics/collect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    keepalive: true,
    body: JSON.stringify(payload),
  });
  return handleResponse<{ status: string }>(res);
}

// ==================== Dictionary & Vocabulary APIs ====================

export async function lookupWordApi(
  word: string,
  signal?: AbortSignal
): Promise<DictionaryLookupResult> {
  const cleanWord = word.trim();
  const res = await fetch(`${API_BASE_URL}/api/dictionary/lookup?word=${encodeURIComponent(cleanWord)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    signal,
  });
  return handleResponse<DictionaryLookupResult>(res);
}

export async function saveWordApi(payload: SaveWordPayload): Promise<SavedWord> {
  const res = await fetch(`${API_BASE_URL}/api/dictionary/words`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return handleResponse<SavedWord>(res);
}

export async function listSavedWordsApi(params?: {
  search?: string;
  status?: string;
  sort?: string;
  book_id?: string;
  page?: number;
  page_size?: number;
}): Promise<SavedWordListResponse> {
  const query = new URLSearchParams();
  if (params?.search) query.append("search", params.search);
  if (params?.status && params.status !== "all") query.append("status", params.status);
  if (params?.sort) query.append("sort", params.sort);
  if (params?.book_id) query.append("book_id", params.book_id);
  if (params?.page) query.append("page", String(params.page));
  if (params?.page_size) query.append("page_size", String(params.page_size));

  const url = `${API_BASE_URL}/api/dictionary/words${query.toString() ? `?${query.toString()}` : ""}`;
  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  return handleResponse<SavedWordListResponse>(res);
}

export async function getSavedWordApi(id: string): Promise<SavedWord> {
  const res = await fetch(`${API_BASE_URL}/api/dictionary/words/${id}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  return handleResponse<SavedWord>(res);
}

export async function updateSavedWordApi(
  id: string,
  payload: UpdateWordPayload
): Promise<SavedWord> {
  const res = await fetch(`${API_BASE_URL}/api/dictionary/words/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return handleResponse<SavedWord>(res);
}

export async function deleteSavedWordApi(
  id: string
): Promise<{ success: boolean; message: string; id: string }> {
  const res = await fetch(`${API_BASE_URL}/api/dictionary/words/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  return handleResponse<{ success: boolean; message: string; id: string }>(res);
}

export async function getReviewWordsApi(
  status?: string,
  limit: number = 20
): Promise<ReviewWord[]> {
  const query = new URLSearchParams({ limit: String(limit) });
  if (status && status !== "all") query.append("status", status);

  const res = await fetch(`${API_BASE_URL}/api/dictionary/review?${query.toString()}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  return handleResponse<ReviewWord[]>(res);
}

// ==================== Reading Session & Activity Tracking APIs ====================

export async function startReadingSessionApi(
  bookId: string,
  payload: ReadingSessionStartPayload
): Promise<ReadingSessionResponse> {
  const res = await fetch(`${API_BASE_URL}/api/books/${bookId}/reading/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return handleResponse<ReadingSessionResponse>(res);
}

export async function heartbeatReadingSessionApi(
  bookId: string,
  payload: ReadingSessionHeartbeatPayload
): Promise<ReadingSessionResponse> {
  const res = await fetch(`${API_BASE_URL}/api/books/${bookId}/reading/heartbeat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return handleResponse<ReadingSessionResponse>(res);
}

export async function endReadingSessionApi(
  bookId: string,
  payload: ReadingSessionEndPayload,
  useKeepalive: boolean = false
): Promise<ReadingSessionResponse> {
  const res = await fetch(`${API_BASE_URL}/api/books/${bookId}/reading/end`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
    keepalive: useKeepalive,
  });
  return handleResponse<ReadingSessionResponse>(res);
}

export async function getAdminUserDetailApi(
  userId: string
): Promise<UserActivityDetailResponse> {
  const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/activity`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  return handleResponse<UserActivityDetailResponse>(res);
}


