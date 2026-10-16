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
