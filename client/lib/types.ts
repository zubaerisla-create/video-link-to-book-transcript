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
  transcription_method: "youtube_captions" | "speech_recognition";
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
