import { z } from "zod";

const YOUTUBE_URL_REGEX =
  /^(https?:\/\/)?(www\.|m\.)?(youtube\.com\/(watch\?v=|shorts\/|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})([?&].*)?$/;

const DIRECT_VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

export const youtubeUrlSchema = z
  .string()
  .trim()
  .min(1, "Please enter a YouTube video URL.")
  .refine(
    (val) => YOUTUBE_URL_REGEX.test(val) || DIRECT_VIDEO_ID_REGEX.test(val),
    {
      message:
        "Please enter a valid YouTube link (e.g., https://www.youtube.com/watch?v=... or https://youtu.be/...).",
    }
  );

export function isValidYouTubeUrl(input: string): boolean {
  const result = youtubeUrlSchema.safeParse(input);
  return result.success;
}

export function extractClientVideoId(urlOrId: string): string | null {
  const clean = urlOrId.trim();
  if (DIRECT_VIDEO_ID_REGEX.test(clean)) {
    return clean;
  }
  const match = clean.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/|v\/))([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}
