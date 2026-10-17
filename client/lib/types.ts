export interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

export interface TranscriptLanguage {
  code: string;
  name: string;
  is_generated: boolean;
  is_translatable: boolean;
}

export interface VideoInfo {
  video_id: string;
  title: string | null;
  author: string | null;
  thumbnail_url: string | null;
}

export interface TranscriptResponse {
  video_id: string;
  video_info: VideoInfo | null;
  language: string;
  language_name: string;
  detected_language: string;
  detected_language_name: string;
  is_generated: boolean;
  transcription_method: "youtube_captions" | "speech_recognition" | "browser_import" | "manual_import" | string;
  language_mode: "original" | "translate";
  target_language: string | null;
  target_language_name: string | null;
  is_translated: boolean;
  translation_provider: string | null;
  available_languages: TranscriptLanguage[];
  
  // Active output
  paragraphs: string[];
  segments: TranscriptSegment[];
  srt: string;

  // Preserved original transcript
  original_paragraphs: string[];
  original_segments: TranscriptSegment[];
  original_srt: string;

  // Translated transcript (when in translate mode)
  translated_paragraphs: string[] | null;
  translated_segments: TranscriptSegment[] | null;
  translated_srt: string | null;

  word_count: number;
  character_count: number;
  warnings: string[];
}

export interface ApiErrorDetail {
  detail: string;
  code: string;
}

export type ParagraphLengthMode = "short" | "medium" | "long";
export type LanguageMode = "original" | "translate";

// --- Authentication Types ---
export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active?: boolean;
  role?: string;
  is_admin?: boolean;
  last_login_at?: string | null;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  message: string;
}

// --- Digital Book & Library Types ---
export interface BookSummary {
  id: string;
  title: string;
  video_id: string;
  video_url: string;
  channel_title: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  language: string;
  language_name: string;
  detected_language: string;
  is_translated: boolean;
  target_language: string | null;
  translation_provider: string | null;
  word_count: number;
  character_count: number;
  reading_progress: number;
  last_page_read: number;
  total_pages: number;
  reading_theme: "light" | "sepia" | "dark" | string;
  font_size: "sm" | "md" | "lg" | "xl" | string;
  created_at: string;
  updated_at: string;
}

export interface BookDetail extends BookSummary {
  paragraphs: string[];
  segments: TranscriptSegment[];
  srt: string;
  original_paragraphs?: string[] | null;
  original_segments?: TranscriptSegment[] | null;
  original_srt?: string | null;
  translated_paragraphs?: string[] | null;
  translated_segments?: TranscriptSegment[] | null;
}

export interface BookListResponse {
  books: BookSummary[];
  total_count: number;
}

export interface SaveBookPayload {
  title: string;
  video_id: string;
  video_url: string;
  channel_title?: string | null;
  thumbnail_url?: string | null;
  duration_seconds?: number | null;
  language: string;
  language_name: string;
  detected_language: string;
  is_translated: boolean;
  target_language?: string | null;
  translation_provider?: string | null;
  paragraphs: string[];
  segments: TranscriptSegment[];
  srt: string;
  original_paragraphs?: string[] | null;
  original_segments?: TranscriptSegment[] | null;
  original_srt?: string | null;
  translated_paragraphs?: string[] | null;
  translated_segments?: TranscriptSegment[] | null;
}

export interface StageImportSegment {
  start: number;
  text: string;
  duration?: number;
}

export interface StageImportPayload {
  video_url: string;
  title?: string;
  channel_title?: string;
  thumbnail_url?: string;
  language?: string;
  segments?: StageImportSegment[];
  raw_text?: string;
  paragraph_length?: ParagraphLengthMode;
}

export interface StageImportResponse {
  import_token: string;
  expires_in: number;
  video_id: string;
  title: string;
  word_count: number;
  segment_count: number;
  detected_language: string;
  detected_language_name: string;
}

// --- Admin & Analytics Types ---
export interface KpiMetric {
  value: number;
  previous?: number;
  delta_pct?: number;
  label: string;
  description: string;
}

export interface DashboardTimeSeriesPoint {
  date: string;
  unique_visitors: number;
  sessions: number;
  page_views: number;
  new_users: number;
  books_created: number;
  imports_success: number;
  imports_failed: number;
  reading_seconds?: number;
  reading_sessions?: number;
  vocab_saved?: number;
}

export interface TopReadBook {
  book_id: string;
  title: string;
  channel_title: string;
  total_seconds: number;
  sessions_count: number;
  unique_readers: number;
}

export interface TopReader {
  user_id: string;
  full_name: string;
  email: string;
  total_seconds: number;
  sessions_count: number;
}

export interface TopVocabLearner {
  user_id: string;
  full_name: string;
  email: string;
  vocab_count: number;
}

export interface AdminOverviewResponse {
  range: string;
  start_date: string;
  end_date: string;
  kpis: {
    unique_visitors: KpiMetric;
    sessions: KpiMetric;
    page_views: KpiMetric;
    new_users: KpiMetric;
    total_users: KpiMetric;
    active_users: KpiMetric;
    books_created: KpiMetric;
    imports_success: KpiMetric;
    import_success_rate: KpiMetric;
    reading_time_seconds?: KpiMetric;
    reading_sessions?: KpiMetric;
    active_readers?: KpiMetric;
    avg_reading_time_seconds?: KpiMetric;
    total_vocab_saved?: KpiMetric;
    vocab_saved_in_range?: KpiMetric;
  };
  user_engagement?: {
    dau_users: number;
    wau_users: number;
    mau_users: number;
    dau_visitors: number;
    wau_visitors: number;
    mau_visitors: number;
    stickiness_ratio: number;
  };
  vocabulary_metrics?: {
    total_saved: number;
    added_in_range: number;
    by_status: {
      new: number;
      learning: number;
      learned: number;
    };
  };
  top_books?: TopReadBook[];
  top_readers?: TopReader[];
  top_learners?: TopVocabLearner[];
  time_series: DashboardTimeSeriesPoint[];
  top_pages: { path: string; views: number }[];
  top_referrers: { domain: string; count: number }[];
  device_breakdown: { type: string; count: number }[];
  browser_breakdown: { browser: string; count: number }[];
}

export interface AdminUserItem {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  role: string;
  is_admin: boolean;
  created_at: string;
  last_login_at: string | null;
  books_count: number;
  reading_time_seconds?: number;
  reading_time_today_seconds?: number;
  reading_time_7d_seconds?: number;
  reading_time_30d_seconds?: number;
  reading_sessions_count?: number;
  distinct_books_read?: number;
  vocab_saved_total?: number;
  vocab_saved_today?: number;
  vocab_saved_30d?: number;
  vocab_learned?: number;
  last_read_book_title?: string;
}

export interface AdminUsersResponse {
  items: AdminUserItem[];
  total_count: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface AdminFeatureUsageResponse {
  range: string;
  attempts: number;
  successes: number;
  failures: number;
  books_created: number;
  success_rate: number;
  languages: { language: string; count: number }[];
  translation_ratio: {
    original: number;
    translated: number;
  };
  common_errors: { category: string; count: number }[];
}

export interface AdminSystemHealthResponse {
  status: string;
  timestamp: string;
  database: {
    status: string;
    latency_ms: number;
    total_users: number;
    total_books: number;
    total_analytics_events: number;
  };
  runtime: {
    python_version: string;
    os: string;
  };
  recent_import_failures: {
    timestamp: string;
    reason: string;
    page_path: string | null;
  }[];
}

export interface AdminAuditLogItem {
  id: string;
  admin_id: string;
  admin_email: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface AdminAuditLogsResponse {
  items: AdminAuditLogItem[];
  total_count: number;
  page: number;
  limit: number;
  total_pages: number;
}

// ==================== Dictionary & Vocabulary Learning Types ====================

export type LearningStatus = "new" | "learning" | "learned";

export interface DictionaryLookupResult {
  word: string;
  normalized_word: string;
  bangla_meaning: string;
  english_definition?: string | null;
  pronunciation?: string | null;
  example_sentence?: string | null;
  part_of_speech?: string | null;
  is_saved: boolean;
  saved_id?: string | null;
  source?: string;
}

export interface SavedWord {
  id: string;
  user_id: string;
  original_word: string;
  normalized_word: string;
  bangla_meaning: string;
  english_definition?: string | null;
  pronunciation?: string | null;
  example_sentence?: string | null;
  part_of_speech?: string | null;
  source_book_id?: string | null;
  source_book_title?: string | null;
  notes?: string | null;
  learning_status: LearningStatus;
  created_at: string;
  updated_at: string;
}

export interface WordStatusCounts {
  total: number;
  new: number;
  learning: number;
  learned: number;
}

export interface SavedWordListResponse {
  items: SavedWord[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  counts: WordStatusCounts;
}

export interface SaveWordPayload {
  original_word: string;
  bangla_meaning: string;
  english_definition?: string | null;
  pronunciation?: string | null;
  example_sentence?: string | null;
  part_of_speech?: string | null;
  source_book_id?: string | null;
  source_book_title?: string | null;
  notes?: string | null;
  learning_status?: LearningStatus;
}

export interface UpdateWordPayload {
  notes?: string | null;
  learning_status?: LearningStatus;
  bangla_meaning?: string;
  english_definition?: string | null;
  example_sentence?: string | null;
}

export interface ReviewWord {
  id: string;
  original_word: string;
  bangla_meaning: string;
  english_definition?: string | null;
  pronunciation?: string | null;
  example_sentence?: string | null;
  learning_status: LearningStatus;
  notes?: string | null;
}

// ==================== Reading Session & Activity Tracking Types ====================

export interface ReadingSessionStartPayload {
  session_id: string;
  last_page_read?: number;
  reading_progress?: number;
  device_type?: string;
}

export interface ReadingSessionHeartbeatPayload {
  session_id: string;
  active_seconds: number;
  last_page_read?: number;
  reading_progress?: number;
}

export interface ReadingSessionEndPayload {
  session_id: string;
  final_active_seconds?: number;
  last_page_read?: number;
  reading_progress?: number;
}

export interface ReadingSessionResponse {
  session_id: string;
  status: string;
  duration_seconds?: number;
  total_active_seconds?: number;
  last_page_read?: number;
  reading_progress?: number;
}

export interface UserActivityDetailSession {
  id: string;
  session_id: string;
  book_id: string;
  book_title: string;
  start_time: string | null;
  end_time: string | null;
  duration_seconds: number;
  reading_progress: number;
  last_page_read: number;
  device_type: string;
}

export interface UserActivityDetailResponse {
  user: {
    id: string;
    email: string;
    full_name: string;
    role: string;
    is_admin: boolean;
    is_active: boolean;
    created_at: string | null;
    last_login_at: string | null;
  };
  reading_summary: {
    total_reading_seconds: number;
    today_reading_seconds: number;
    d7_reading_seconds: number;
    d30_reading_seconds: number;
    total_reading_sessions: number;
    distinct_books_read: number;
    avg_session_seconds: number;
  };
  recent_sessions: UserActivityDetailSession[];
  vocabulary_summary: {
    total_words: number;
    new_count: number;
    learning_count: number;
    learned_count: number;
  };
  recent_words: {
    id: string;
    original_word: string;
    normalized_word: string;
    bangla_meaning: string;
    english_definition?: string | null;
    pronunciation?: string | null;
    learning_status: LearningStatus;
    source_book_title?: string | null;
    notes?: string | null;
    created_at: string | null;
  }[];
  books: {
    id: string;
    title: string;
    channel_title?: string | null;
    language_name: string;
    word_count: number;
    reading_progress: number;
    last_page_read: number;
    total_pages: number;
    created_at: string | null;
  }[];
}

