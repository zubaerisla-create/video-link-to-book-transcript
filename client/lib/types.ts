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
  is_generated: boolean;
  available_languages: TranscriptLanguage[];
  paragraphs: string[];
  segments: TranscriptSegment[];
  srt: string;
  word_count: number;
  character_count: number;
}

export interface ApiErrorDetail {
  detail: string;
  code: string;
}

export type ParagraphLengthMode = "short" | "medium" | "long";
