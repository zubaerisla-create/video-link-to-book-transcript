import fs from "node:fs";
import path from "node:path";
import { countWords, extractHeadings, type Heading } from "./markdown";
import { GUIDES, type GuideMeta } from "./registry";

const CONTENT_DIR = path.join(process.cwd(), "content", "guides");
const WORDS_PER_MINUTE = 225;

export type LoadedGuide = GuideMeta & {
  body: string;
  headings: Heading[];
  wordCount: number;
  readingMinutes: number;
};

const cache = new Map<string, LoadedGuide>();

export function loadGuide(meta: GuideMeta): LoadedGuide {
  const hit = cache.get(meta.slug);
  if (hit) return hit;
  const body = fs.readFileSync(path.join(CONTENT_DIR, `${meta.slug}.md`), "utf8");
  const wordCount = countWords(body);
  const loaded: LoadedGuide = {
    ...meta,
    body,
    headings: extractHeadings(body),
    wordCount,
    readingMinutes: Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE)),
  };
  cache.set(meta.slug, loaded);
  return loaded;
}

export function loadAllGuides(): LoadedGuide[] {
  return GUIDES.map(loadGuide);
}
