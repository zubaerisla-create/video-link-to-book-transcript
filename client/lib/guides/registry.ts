/**
 * Transcriptly knowledge base registry.
 *
 * Each guide's body lives in `content/guides/<slug>.md` and is rendered by
 * `lib/guides/markdown.tsx`. Everything else (title, SEO copy, dates,
 * category, related links) is declared here so the guides hub, category
 * pages, sitemap and structured data all read from one source.
 *
 * Dates: `published` is when the URL first went live. Only bump `updated`
 * when the article content genuinely changes.
 */

export type CategorySlug =
  | "language-learning"
  | "education-productivity"
  | "transcription-technology"
  | "transcript-workflows";

export type Category = {
  slug: CategorySlug;
  name: string;
  shortName: string;
  description: string;
  intro: string;
};

export type GuideMeta = {
  slug: string;
  title: string;
  /** <title> tag; falls back to `title` */
  seoTitle?: string;
  description: string;
  category: CategorySlug;
  published: string;
  updated?: string;
  featured?: boolean;
  related: string[];
};

export const CATEGORIES: Category[] = [
  {
    slug: "transcript-workflows",
    name: "Transcript Tools & Workflows",
    shortName: "Workflows",
    description: "Getting transcripts out of YouTube, choosing export formats, and keeping a tidy personal library.",
    intro:
      "Start here if you are new to Transcriptly. These guides cover the practical mechanics: extracting captions from a link or with the Chrome extension, copying and exporting them, picking between SRT, TXT and JSON, and organizing what you save.",
  },
  {
    slug: "education-productivity",
    name: "Education & Productivity",
    shortName: "Study",
    description: "Turning lectures and tutorials into notes, exam material and readable study texts.",
    intro:
      "Video is a good way to be taught and a poor way to revise. These guides show how students, self-learners and researchers can turn long recordings into notes, reading material and searchable archives they will actually come back to.",
  },
  {
    slug: "language-learning",
    name: "Language Learning",
    shortName: "Languages",
    description: "Using real video transcripts to build vocabulary, listening skills and reading fluency.",
    intro:
      "Native-speaker video is one of the richest free language resources there is, but it moves fast. These guides explain how to slow it down with transcripts, side-by-side translation and a personal word list.",
  },
  {
    slug: "transcription-technology",
    name: "Transcription Technology",
    shortName: "Technology",
    description: "How captions and speech recognition work, why they fail, and what you can do about it.",
    intro:
      "A transcript is only as good as the process that produced it. These explainers cover automatic speech recognition, Whisper versus YouTube auto-captions, multilingual sentence splitting, and how to deal with captions that are wrong or missing.",
  },
];

const P0 = "2026-10-16"; // original six guides
const P1 = "2026-11-02"; // knowledge base expansion

export const GUIDES: GuideMeta[] = [
  /* ----------------------------- Workflows ----------------------------- */
  {
    slug: "how-to-use-chrome-extension",
    title: "How to Install and Use the Transcriptly Chrome Extension",
    seoTitle: "Transcriptly Chrome Extension: Install, Use & Troubleshoot",
    description:
      "A complete walkthrough of the free Transcriptly extension: what it does, how to install it in Chrome, Edge or Brave, how to import a YouTube transcript, and how to fix common problems.",
    category: "transcript-workflows",
    published: P0,
    updated: P1,
    featured: true,
    related: ["how-to-get-transcript-from-youtube", "how-to-fix-missing-unavailable-captions", "how-to-copy-and-save-youtube-captions", "how-to-extract-and-organize-youtube-transcripts"],
  },
  {
    slug: "how-to-get-transcript-from-youtube",
    title: "How to Get a Transcript from a YouTube Video",
    seoTitle: "How to Get a Transcript from a YouTube Video (3 Reliable Methods)",
    description:
      "Three dependable ways to get a full transcript from a YouTube video — YouTube's own panel, pasting the link into Transcriptly, and the Chrome extension — plus how to choose between them.",
    category: "transcript-workflows",
    published: P0,
    updated: P1,
    featured: true,
    related: ["how-to-use-chrome-extension", "how-to-copy-and-save-youtube-captions", "how-to-fix-missing-unavailable-captions", "srt-vs-txt-vs-json-transcript-formats"],
  },
  {
    slug: "how-to-copy-and-save-youtube-captions",
    title: "How to Copy, Format and Save YouTube Captions",
    seoTitle: "How to Copy and Save YouTube Captions Without Timestamps",
    description:
      "Why copying captions straight from YouTube produces a mess, how to get clean paragraphs instead, and how to save the result as TXT, SRT, JSON, PDF or a book in your library.",
    category: "transcript-workflows",
    published: P0,
    updated: P1,
    related: ["srt-vs-txt-vs-json-transcript-formats", "how-to-get-transcript-from-youtube", "how-to-build-a-personal-digital-library-from-video", "how-to-extract-and-organize-youtube-transcripts"],
  },
  {
    slug: "srt-vs-txt-vs-json-transcript-formats",
    title: "SRT vs TXT vs JSON: Understanding Transcript Export Formats",
    description:
      "What is actually inside an SRT, TXT and JSON transcript file, which tools read each one, and how to pick the right export for editing, studying, archiving or building software.",
    category: "transcript-workflows",
    published: P1,
    related: ["how-to-copy-and-save-youtube-captions", "understanding-transcript-languages-and-timestamps", "how-to-organize-video-transcripts-for-research", "how-to-build-a-personal-digital-library-from-video"],
  },
  {
    slug: "how-to-extract-and-organize-youtube-transcripts",
    title: "How to Extract and Organize YouTube Video Transcripts",
    description:
      "A repeatable workflow for collecting transcripts from many videos — naming, tagging, storing and finding them again — without ending up with a folder of untitled text files.",
    category: "transcript-workflows",
    published: P1,
    related: ["how-to-organize-video-transcripts-for-research", "how-to-build-a-personal-digital-library-from-video", "srt-vs-txt-vs-json-transcript-formats", "how-to-get-transcript-from-youtube"],
  },
  {
    slug: "how-to-summarize-educational-videos-using-transcripts",
    title: "How to Summarize Educational Videos Using Their Transcripts",
    description:
      "A practical method for writing accurate summaries of lectures and tutorials from their transcripts, including when AI summarizers help, where they go wrong, and how to check them.",
    category: "transcript-workflows",
    published: P1,
    related: ["how-to-turn-youtube-lectures-into-study-notes", "how-to-prepare-exam-notes-from-educational-videos", "how-to-research-efficiently-with-video-transcripts", "how-to-transform-video-lectures-into-reading-materials"],
  },
  {
    slug: "how-to-research-efficiently-with-video-transcripts",
    title: "How to Research More Efficiently with Video Transcripts",
    description:
      "How to use transcripts to screen videos quickly, find the exact passage you need, quote speakers accurately, and cite timestamps so others can verify your sources.",
    category: "transcript-workflows",
    published: P1,
    related: ["how-to-organize-video-transcripts-for-research", "how-to-use-transcripts-for-studying-research", "how-to-summarize-educational-videos-using-transcripts", "understanding-transcript-languages-and-timestamps"],
  },
  {
    slug: "how-to-build-a-personal-digital-library-from-video",
    title: "How to Build a Personal Digital Library from Video Content",
    description:
      "Turn the talks, lectures and interviews you value into a searchable shelf of readable books — what to save, how to structure it, and how to keep it useful over years.",
    category: "transcript-workflows",
    published: P1,
    related: ["how-to-transform-video-lectures-into-reading-materials", "how-to-extract-and-organize-youtube-transcripts", "how-to-copy-and-save-youtube-captions", "how-to-build-a-vocabulary-dictionary-from-video-transcripts"],
  },

  /* ---------------------- Education & productivity --------------------- */
  {
    slug: "how-to-use-transcripts-for-studying-research",
    title: "How to Use Video Transcripts for Studying",
    seoTitle: "How to Use Video Transcripts for Studying: A Student's Workflow",
    description:
      "A student-focused workflow for learning from recorded lectures with transcripts: preview, watch actively, review in text, and turn passages into questions you can test yourself on.",
    category: "education-productivity",
    published: P0,
    updated: P1,
    featured: true,
    related: ["how-to-turn-youtube-lectures-into-study-notes", "how-to-prepare-exam-notes-from-educational-videos", "how-to-research-efficiently-with-video-transcripts", "how-to-transform-video-lectures-into-reading-materials"],
  },
  {
    slug: "how-to-turn-youtube-lectures-into-study-notes",
    title: "How to Turn YouTube Lectures into Structured Study Notes",
    description:
      "A step-by-step method for converting a lecture transcript into organized notes — outlining, condensing, and linking back to timestamps — with a worked example.",
    category: "education-productivity",
    published: P1,
    featured: true,
    related: ["how-to-prepare-exam-notes-from-educational-videos", "how-to-summarize-educational-videos-using-transcripts", "how-to-use-transcripts-for-studying-research", "how-to-transform-video-lectures-into-reading-materials"],
  },
  {
    slug: "how-to-convert-programming-tutorials-into-learning-materials",
    title: "How to Convert Online Programming Tutorials into Learning Materials",
    description:
      "Coding videos are hard to search and harder to revise. Learn how to turn their transcripts into reference notes, exercise lists and a personal cookbook — and the traps specific to code.",
    category: "education-productivity",
    published: P1,
    related: ["how-to-turn-youtube-lectures-into-study-notes", "how-to-fix-incorrect-youtube-captions", "how-to-build-a-personal-digital-library-from-video", "srt-vs-txt-vs-json-transcript-formats"],
  },
  {
    slug: "how-to-prepare-exam-notes-from-educational-videos",
    title: "How to Prepare Exam Notes from Educational Videos",
    description:
      "Use lecture transcripts to build revision material that works: condensed summaries, question banks for active recall, and a review schedule that fits before an exam.",
    category: "education-productivity",
    published: P1,
    related: ["how-to-turn-youtube-lectures-into-study-notes", "how-to-use-transcripts-for-studying-research", "how-to-summarize-educational-videos-using-transcripts", "how-to-build-a-vocabulary-dictionary-from-video-transcripts"],
  },
  {
    slug: "how-to-transform-video-lectures-into-reading-materials",
    title: "How to Transform Long Video Lectures into Reading Materials",
    description:
      "How to turn a two-hour lecture into something you can comfortably read: cleaning the transcript, adding structure, and reading it as a book on your phone or as a PDF.",
    category: "education-productivity",
    published: P1,
    related: ["how-to-build-a-personal-digital-library-from-video", "how-to-turn-youtube-lectures-into-study-notes", "how-to-copy-and-save-youtube-captions", "how-sentence-splitting-works-in-multilingual-transcription"],
  },
  {
    slug: "how-to-organize-video-transcripts-for-research",
    title: "How to Organize and Manage Video Transcripts for Research",
    description:
      "A system for researchers who collect many video sources: file naming, source metadata, version control for corrected transcripts, and citing timestamps properly.",
    category: "education-productivity",
    published: P1,
    related: ["how-to-research-efficiently-with-video-transcripts", "how-to-extract-and-organize-youtube-transcripts", "srt-vs-txt-vs-json-transcript-formats", "how-to-fix-incorrect-youtube-captions"],
  },

  /* -------------------------- Language learning ------------------------ */
  {
    slug: "how-to-learn-english-using-youtube-transcripts",
    title: "How to Learn English Using YouTube Transcripts",
    description:
      "A practical routine for English learners: choosing videos at the right level, reading before and after listening, collecting words in context, and measuring progress.",
    category: "language-learning",
    published: P1,
    featured: true,
    related: ["how-to-improve-english-listening-with-video-transcripts", "how-to-build-a-vocabulary-dictionary-from-video-transcripts", "how-to-learn-bangla-vocabulary-through-video", "understanding-transcript-languages-and-timestamps"],
  },
  {
    slug: "how-to-build-a-vocabulary-dictionary-from-video-transcripts",
    title: "How to Build a Personal Vocabulary Dictionary from Video Transcripts",
    description:
      "Collect words from the videos you actually watch, keep the sentence they appeared in, and review them until they stick — using Transcriptly's word lookup and saved-word list.",
    category: "language-learning",
    published: P1,
    related: ["how-to-learn-english-using-youtube-transcripts", "how-to-improve-english-listening-with-video-transcripts", "how-to-prepare-exam-notes-from-educational-videos", "how-to-build-a-personal-digital-library-from-video"],
  },
  {
    slug: "how-to-improve-english-listening-with-video-transcripts",
    title: "How to Improve English Listening Skills with Video Transcripts",
    description:
      "Listening exercises built around transcripts — gap-listening, shadowing, and transcript-checked dictation — and how to use them without becoming dependent on subtitles.",
    category: "language-learning",
    published: P1,
    related: ["how-to-learn-english-using-youtube-transcripts", "how-to-build-a-vocabulary-dictionary-from-video-transcripts", "youtube-auto-captions-vs-whisper", "understanding-transcript-languages-and-timestamps"],
  },
  {
    slug: "how-to-learn-bangla-vocabulary-through-video",
    title: "How to Learn Bangla Vocabulary Through Video Content",
    description:
      "How learners — including heritage speakers — can use Bangla videos, original-script transcripts and side-by-side translation to build vocabulary and reading skill in বাংলা.",
    category: "language-learning",
    published: P1,
    related: ["how-to-study-hindi-and-arabic-through-video-transcripts", "how-sentence-splitting-works-in-multilingual-transcription", "how-to-transcribe-videos-in-different-languages", "how-to-build-a-vocabulary-dictionary-from-video-transcripts"],
  },
  {
    slug: "how-to-study-hindi-and-arabic-through-video-transcripts",
    title: "How to Study Hindi and Arabic Through Video Transcripts",
    description:
      "Script, direction and caption quality all differ between Hindi and Arabic. Here is how to choose videos, read transcripts in Devanagari and Arabic script, and use translation carefully.",
    category: "language-learning",
    published: P1,
    related: ["how-to-learn-bangla-vocabulary-through-video", "how-to-transcribe-videos-in-different-languages", "how-sentence-splitting-works-in-multilingual-transcription", "understanding-transcript-languages-and-timestamps"],
  },

  /* ----------------------- Transcription technology -------------------- */
  {
    slug: "youtube-auto-captions-vs-whisper",
    title: "YouTube Auto Captions vs Whisper: Accuracy, Differences and Limitations",
    seoTitle: "YouTube Auto Captions vs Whisper: Differences, Accuracy & Limits",
    description:
      "How YouTube's automatic captions and OpenAI's open-source Whisper model differ in design, punctuation, languages and failure modes — and a reproducible way to measure accuracy yourself.",
    category: "transcription-technology",
    published: P1,
    featured: true,
    related: ["how-automatic-speech-recognition-works", "how-to-fix-incorrect-youtube-captions", "how-to-transcribe-videos-in-different-languages", "how-to-fix-missing-unavailable-captions"],
  },
  {
    slug: "how-automatic-speech-recognition-works",
    title: "How Automatic Speech Recognition Works",
    description:
      "A plain-language explanation of how speech becomes text: audio features, acoustic and language modelling, end-to-end models like Whisper, decoding, and why errors happen.",
    category: "transcription-technology",
    published: P1,
    related: ["youtube-auto-captions-vs-whisper", "how-sentence-splitting-works-in-multilingual-transcription", "how-to-transcribe-videos-in-different-languages", "understanding-transcript-languages-and-timestamps"],
  },
  {
    slug: "how-to-transcribe-videos-in-different-languages",
    title: "How to Transcribe Videos in Different Languages",
    description:
      "How to get an accurate transcript when a video is not in English: finding the original caption track, avoiding accidental translation, handling mixed languages, and using speech recognition.",
    category: "transcription-technology",
    published: P1,
    related: ["understanding-transcript-languages-and-timestamps", "how-to-learn-bangla-vocabulary-through-video", "how-to-study-hindi-and-arabic-through-video-transcripts", "youtube-auto-captions-vs-whisper"],
  },
  {
    slug: "how-sentence-splitting-works-in-multilingual-transcription",
    title: "How Sentence Splitting Works in Multilingual Transcription",
    description:
      "Captions arrive as short timed fragments. This explainer shows how fragments are de-duplicated and merged into sentences and paragraphs across Latin, Bengali, Devanagari and Arabic scripts.",
    category: "transcription-technology",
    published: P1,
    related: ["how-automatic-speech-recognition-works", "how-to-copy-and-save-youtube-captions", "how-to-learn-bangla-vocabulary-through-video", "how-to-transform-video-lectures-into-reading-materials"],
  },
  {
    slug: "how-to-fix-incorrect-youtube-captions",
    title: "How to Fix Incorrect YouTube Captions",
    seoTitle: "How to Fix Incorrect or Missing YouTube Captions",
    description:
      "Why auto-captions mishear names, numbers and technical terms, how to correct a transcript efficiently, and what creators can do to fix captions at the source.",
    category: "transcription-technology",
    published: P1,
    related: ["how-to-fix-missing-unavailable-captions", "youtube-auto-captions-vs-whisper", "how-automatic-speech-recognition-works", "how-to-organize-video-transcripts-for-research"],
  },
  {
    slug: "how-to-fix-missing-unavailable-captions",
    title: "How to Fix Missing or Unavailable YouTube Captions",
    seoTitle: "YouTube Transcript Not Available? Causes and Fixes",
    description:
      "Every common reason a video shows no transcript — disabled captions, live streams, new uploads, regional limits, rate limiting — and what you can do in each case.",
    category: "transcription-technology",
    published: P0,
    updated: P1,
    related: ["how-to-fix-incorrect-youtube-captions", "how-to-use-chrome-extension", "youtube-auto-captions-vs-whisper", "how-to-get-transcript-from-youtube"],
  },
  {
    slug: "understanding-transcript-languages-and-timestamps",
    title: "Understanding Transcript Languages, Tracks and Timestamps",
    seoTitle: "YouTube Caption Tracks, Language Codes and Timestamps Explained",
    description:
      "Manual vs auto-generated tracks, auto-translated captions, language codes like en-GB and bn, and how caption timestamps are measured — the background you need to trust a transcript.",
    category: "transcription-technology",
    published: P0,
    updated: P1,
    related: ["srt-vs-txt-vs-json-transcript-formats", "how-to-transcribe-videos-in-different-languages", "how-sentence-splitting-works-in-multilingual-transcription", "how-to-research-efficiently-with-video-transcripts"],
  },
];

export const GUIDE_BY_SLUG = new Map(GUIDES.map((g) => [g.slug, g]));
export const CATEGORY_BY_SLUG = new Map(CATEGORIES.map((c) => [c.slug, c]));

export function guidesInCategory(slug: CategorySlug): GuideMeta[] {
  return GUIDES.filter((g) => g.category === slug);
}

export function lastModified(g: GuideMeta): string {
  return g.updated ?? g.published;
}

export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
