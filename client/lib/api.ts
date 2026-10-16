import {
  TranscriptResponse,
  TranscriptLanguage,
  VideoInfo,
  ParagraphLengthMode,
  LanguageMode,
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  code: string;
  statusCode: number;

  constructor(message: string, code: string = "UNKNOWN_ERROR", statusCode: number = 500) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMessage = `Request failed with status ${res.status}`;
    let errorCode = "HTTP_ERROR";

    try {
      const errorData = await res.json();
      if (errorData?.detail) {
        if (typeof errorData.detail === "string") {
          errorMessage = errorData.detail;
        } else if (typeof errorData.detail === "object") {
          errorMessage = errorData.detail.detail || errorMessage;
          errorCode = errorData.detail.code || errorCode;
        }
      }
    } catch {
      // response wasn't JSON
    }

    throw new ApiError(errorMessage, errorCode, res.status);
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
