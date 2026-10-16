# Transcriptly — Multilingual YouTube Transcript Extractor & Translator

**Transcriptly** is a minimal, elegant, production-quality web application that extracts accessible captions, generates speech recognition transcripts using local `faster-whisper`, and performs multilingual translation.

Built to run locally on Linux Mint without requiring paid API keys.

---

## Table of Contents

1. [Key Features](#key-features)
2. [Design System & Palette](#design-system--palette)
3. [Architecture & Tech Stack](#architecture--tech-stack)
4. [Project Structure](#project-structure)
5. [Prerequisites & System Setup](#prerequisites--system-setup)
6. [Local Installation & Setup](#local-installation--setup)
   - [Backend Setup (FastAPI & Whisper)](#1-backend-setup-fastapi)
   - [Frontend Setup (Next.js)](#2-frontend-setup-nextjs)
7. [Running the Application](#running-the-application)
8. [Language & Translation Architecture](#language--translation-architecture)
   - [Automatic Original-Language Mode](#automatic-original-language-mode)
   - [Translation Mode & Alignment](#translation-mode--alignment)
   - [Local Speech-to-Text Fallback (faster-whisper)](#local-speech-to-text-fallback-faster-whisper)
9. [API Documentation](#api-documentation)
10. [Testing & Verification](#testing--verification)
11. [Privacy, Security & Clean-up](#privacy-security--clean-up)
12. [Troubleshooting & Hardware Considerations](#troubleshooting--hardware-considerations)

---

## Key Features

- **Automatic Original-Language Mode (Default)**: Automatically detects the video's original spoken language (e.g. Bangla, English, Hindi, Arabic, Urdu, Spanish, French). Preserves the original script and phrasing without unintended automated translation.
- **Multilingual Translation Mode**: Translate transcripts into Bangla (`bn`), English (`en`), Hindi (`hi`), Arabic (`ar`), Urdu (`ur`), Spanish (`es`), French (`fr`), and more.
- **Side-by-Side & Aligned Views**: View original text and translated text aligned by timestamp or read as cohesive paragraphs.
- **Local Speech-to-Text Fallback (`faster-whisper`)**: When captions are disabled or unavailable, optionally transcribe audio directly on CPU using local Whisper inference without sending data to paid APIs.
- **Clean Paragraph Merging**: Sentence boundary detection across Latin, Bengali (dari `।`), Devanagari (`।`), and Arabic/Urdu (`؟`, `۔`) scripts groups fragmented captions into flowing paragraphs.
- **Configurable Paragraph Length**: Switch between Short (~50 words), Medium (~100 words), and Long (~180 words) layouts dynamically.
- **Dual Formats & In-Transcript Search**: Toggle between Paragraphs and Timestamped Segments, with real-time keyword search.
- **Comprehensive Exports**:
  - **Copy All**: Copies active view or side-by-side comparison to clipboard.
  - **TXT**: Plain-text export with metadata headers.
  - **JSON**: Full structured data including original segments, translated segments, timecodes, and metadata.
  - **SRT**: SubRip format with millisecond timecodes (`00:00:01,360 --> 00:00:03,040`).
- **Zero Database / Zero Storage**: Ephemeral processing. Transcripts are maintained in client state; temporary audio files from speech recognition are purged immediately after processing.

---

## Design System & Palette

Designed around an editorial, calm, and uncluttered aesthetic:

| Element | Hex Code | Purpose |
| :--- | :--- | :--- |
| **Background** | `#FFFDF8` | Warm cream off-white page background |
| **White Surface** | `#FFFFFF` | Card surfaces with subtle borders |
| **Primary Text** | `#292522` | Deep charcoal for readability |
| **Secondary Text** | `#77716D` | Warm stone gray for metadata and hints |
| **Borders** | `#F0E8E2` | Hairline separators and card borders |
| **Soft Pink** | `#F8DDE8` | Subtle badges, active nav pills, selections |
| **Primary Button** | `#E9A9C3` | Primary action button |
| **Button Hover** | `#DE91B1` | Interactive hover state |
| **Light Yellow** | `#FFF1B8` | Highlights, status tags, eyebrow badges |

- **Typography**: Inter (clean, geometric sans-serif).
- **Geometry**: Rounded corners (12–18px), soft cards, generous whitespace.
- **No Emojis**: All UI indicators use clean Lucide icons.

---

## Architecture & Tech Stack

```
[ Browser / Next.js Client ]
      App Router (React 19)
      Tailwind CSS + Lucide Icons
      Original / Translate / Side-by-Side Views
             │
             │ JSON / HTTP (REST)
             ▼
[ FastAPI Backend (Python 3.12) ]
  ├── YouTube Service (youtube-transcript-api, oEmbed)
  ├── Speech Service (faster-whisper, yt-dlp, FFmpeg)
  ├── Translation Service (YouTube captions, MyMemory)
  └── Formatter Service (multilingual sentence grouping & SRT)
```

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS, Lucide React, Zod.
- **Backend**: FastAPI, Uvicorn, Python 3.12, `youtube-transcript-api`, `faster-whisper`, `yt-dlp`, `imageio-ffmpeg`, `deep-translator`, `httpx`, Pydantic v2.
- **Storage**: Client-side React state.

---

## Project Structure

```
video-link-to-transcript/
├── client/                      # Next.js frontend application
│   ├── app/
│   │   ├── layout.tsx           # Root layout with Inter font, Navbar & Footer
│   │   ├── page.tsx             # Home: URL card, language selector, side-by-side view
│   │   ├── how-it-works/
│   │   │   └── page.tsx         # Educational guide & speech-to-text details
│   │   ├── about/
│   │   │   └── page.tsx         # Mission, privacy policy, and limitations
│   │   └── globals.css          # Tailwind theme & design system colors
│   ├── components/
│   │   ├── Navbar.tsx           # Text logo, navigation links, GitHub link
│   │   ├── Footer.tsx           # Minimal footer with privacy statement
│   │   └── GithubIcon.tsx       # Crisp SVG GitHub icon component
│   ├── lib/
│   │   ├── api.ts               # Backend API client with structured error handling
│   │   ├── types.ts             # TypeScript interfaces for API contracts
│   │   └── validation.ts        # Zod URL schema and regex validators
│   ├── .env.example             # Frontend environment variables template
│   └── package.json
├── server/                      # FastAPI Python backend application
│   ├── app/
│   │   ├── api/
│   │   │   └── routes.py        # /api/health, /api/transcript, /api/video-info, /api/transcript/languages
│   │   ├── schemas/
│   │   │   └── transcript.py    # Pydantic models for request and response validation
│   │   ├── services/
│   │   │   ├── youtube_service.py     # Caption discovery, track translation, original detection
│   │   │   ├── speech_service.py      # faster-whisper local speech recognition & audio stream
│   │   │   ├── translation_service.py # Modular translation provider & segment alignment
│   │   │   └── formatter_service.py   # Paragraph grouping, deduplication, SRT generator
│   │   ├── config.py            # CORS origins, host, port, whisper settings
│   │   └── main.py              # FastAPI application, rate limiter, global error handler
│   ├── tests/
│   │   ├── test_url_extraction.py               # URL & Video ID regex tests
│   │   ├── test_formatter.py                    # Paragraph merging and SRT generator tests
│   │   ├── test_multilingual_and_translation.py # Bangla, translation, alignment, fallback tests
│   │   └── test_api.py                          # FastAPI endpoint tests
│   ├── requirements.txt         # Pinned Python package dependencies
│   ├── .env.example             # Backend environment variables template
│   └── venv/                    # Isolated Python virtual environment
└── README.md
```

---

## Prerequisites & System Setup

- **OS**: Linux Mint (or Ubuntu / Debian / macOS / modern Linux)
- **Node.js**: v20+ (`node -v`)
- **npm**: v10+ (`npm -v`)
- **Python**: 3.10+ with `python3-venv` (`python3 --version`)
- **FFmpeg**: Bundled automatically via `imageio-ffmpeg` in the virtual environment. Alternatively, standard system FFmpeg (`sudo apt install ffmpeg`) can be used if available.

---

## Local Installation & Setup

### 1. Backend Setup (FastAPI)

1. Navigate to the project root:
   ```bash
   cd /home/abdullah/project/video-link-to-transcript
   ```
2. Activate or create the Python virtual environment:
   ```bash
   python3 -m venv server/venv
   source server/venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install --upgrade pip
   pip install -r server/requirements.txt
   ```
4. Copy the environment configuration:
   ```bash
   cp server/.env.example server/.env
   ```
   Key environment variables in `server/.env`:
   - `WHISPER_MODEL_SIZE`: Model size for speech recognition (`tiny`, `base`, `small`, `medium`). Default: `tiny`.
   - `WHISPER_DEVICE`: Inference device (`cpu` or `cuda`). Default: `cpu`.
   - `WHISPER_COMPUTE_TYPE`: Precision (`int8` or `float32`). Default: `int8`.
   - `ENABLE_SPEECH_RECOGNITION`: Set `true` to permit faster-whisper fallback. Default: `true`.
   - `SPEECH_MAX_VIDEO_DURATION_SECONDS`: Maximum video duration for local transcription (default: `1800` = 30 minutes).
   - `AUDIO_TEMP_DIR`: Directory for temporary audio files (default: `/tmp/transcriptly_audio`).

### 2. Frontend Setup (Next.js)

1. Open a terminal in the `client` directory:
   ```bash
   cd /home/abdullah/project/video-link-to-transcript/client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Default contents:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_GITHUB_URL=https://github.com/zubaerisla-create
   ```

---

## Running the Application

### 1. Start the Backend Server

```bash
cd /home/abdullah/project/video-link-to-transcript
source server/venv/bin/activate
uvicorn server.app.main:app --host 0.0.0.0 --port 8000 --reload
```
- API Base: `http://localhost:8000`
- Interactive OpenAPI Docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/api/health`

### 2. Start the Frontend Server

```bash
cd /home/abdullah/project/video-link-to-transcript/client
npm run dev
```
Open your browser at `http://localhost:3000` (or `http://localhost:3001` if port 3000 is occupied).

---

## Language & Translation Architecture

### Automatic Original-Language Mode
- **Zero Alteration**: When "Original Language" is selected (default), Transcriptly retrieves the video's original spoken caption track.
- **Accurate Detection**: If auto-generated captions exist (`is_generated=True`), its language code indicates the true spoken language of the video. If the creator uploaded a manual transcript in that same language, Transcriptly selects that manual track for superior punctuation.
- **Preserved Scripts**: Bangla remains in Bengali script (`বাংলা`), Hindi in Devanagari (`हिन्दी`), Arabic in Arabic script (`العربية`), Urdu in Nastaliq/Urdu script (`اردو`).

### Translation Mode & Alignment
- **Target Selection**: Users can translate transcripts to Bangla, English, Hindi, Arabic, Urdu, Spanish, French, and more.
- **Segment-Level Alignment**: Segments are translated while preserving original `start` and `duration` timestamps.
- **Side-by-Side View**: Users can view the original text alongside the translated text simultaneously in both Paragraph and Timestamped modes.
- **Modular Providers**:
  1. *YouTube Caption Track Translation*: Used when the video track natively supports translation to the target language.
  2. *Modular Provider (MyMemory)*: Fast batched newline translation supporting 100+ languages without paid API tokens.

### Local Speech-to-Text Fallback (faster-whisper)
- **Automatic Fallback**: If a public video has no captions available and the user enables the speech-to-text fallback checkbox, Transcriptly downloads the audio stream using `yt-dlp` and processes it locally using `faster-whisper`.
- **CPU-Friendly**: Defaults to the lightweight `tiny` model with `int8` quantization. Runs smoothly on standard CPU hardware without GPU requirements.
- **Automatic Cleanup**: Temporary audio files are strictly deleted in a `finally` block immediately after transcription completes.

---

## API Documentation

### 1. `GET /api/health`
Returns API health, version, and feature capabilities.

### 2. `POST /api/transcript`
Extracts, formats, and optionally translates transcripts.
- **Request Body**:
  ```json
  {
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "language_mode": "translate",
    "target_language": "bn",
    "paragraph_length": "medium",
    "enable_speech_fallback": true
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "video_id": "dQw4w9WgXcQ",
    "video_info": {
      "video_id": "dQw4w9WgXcQ",
      "title": "Rick Astley - Never Gonna Give You Up",
      "author": "Rick Astley",
      "thumbnail_url": "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"
    },
    "language": "bn",
    "language_name": "Bangla",
    "detected_language": "en",
    "detected_language_name": "English",
    "is_generated": false,
    "transcription_method": "youtube_captions",
    "language_mode": "translate",
    "target_language": "bn",
    "target_language_name": "Bangla",
    "is_translated": true,
    "translation_provider": "mymemory",
    "paragraphs": [
      "আমরা প্রেমের অপরিচিত নই। আপনি নিয়ম জানেন এবং আমিও..."
    ],
    "segments": [
      {"text": "আমরা প্রেমের অপরিচিত নই।", "start": 18.64, "duration": 3.24}
    ],
    "original_paragraphs": [
      "We're no strangers to love. You know the rules and so do I..."
    ],
    "original_segments": [
      {"text": "We're no strangers to love.", "start": 18.64, "duration": 3.24}
    ],
    "srt": "1\n00:00:18,640 --> 00:00:21,880\nআমরা প্রেমের অপরিচিত নই।\n",
    "original_srt": "1\n00:00:18,640 --> 00:00:21,880\nWe're no strangers to love.\n",
    "word_count": 420,
    "character_count": 1890,
    "warnings": []
  }
  ```

---

## Testing & Verification

Run the comprehensive pytest suite:
```bash
cd /home/abdullah/project/video-link-to-transcript
server/venv/bin/pytest server/tests -v
```

All 23 unit and integration tests verify:
- Original spoken language preservation for Bangla, English, Hindi, Arabic, Urdu.
- Formatting of Indic dari (`।`) and Arabic/Urdu (`؟`, `۔`) terminal punctuation.
- Translation to Bangla, Hindi, and English targets with segment alignment.
- Local speech recognition fallback invocation when captions are absent.
- Graceful 404 error responses with actionable guidance when captions are absent and fallback is disabled.
- URL extraction for all YouTube formats (watch, `youtu.be`, Shorts, embeds).

---

## Privacy, Security & Clean-up

- **Zero Database / Zero User Storage**: Transcripts and video URLs are never persisted to a database.
- **Local Audio Clean-up**: Audio files downloaded during speech recognition fallback are stored in `/tmp/transcriptly_audio/` and unlinked immediately in a `finally` block.
- **Server-Side Validation**: All URLs are validated before processing. Arbitrary URLs and SSRF attempts are rejected.
- **Safe Error Responses**: Unhandled exceptions return structured JSON errors without exposing Python stack traces.

---

## Troubleshooting & Hardware Considerations

- **CPU vs GPU**: `faster-whisper` defaults to `device="cpu"` and `compute_type="int8"` for zero-configuration compatibility on Linux Mint laptops and desktops without dedicated GPUs. If a CUDA GPU is available, set `WHISPER_DEVICE=cuda` and `WHISPER_COMPUTE_TYPE=float16` in `server/.env`.
- **Model Size**: The `tiny` model (~75MB) loads within 2 seconds. For higher transcription accuracy on complex audio, you can set `WHISPER_MODEL_SIZE=base` or `WHISPER_MODEL_SIZE=small` in `server/.env`.
- **FFmpeg**: Bundled static binary from `imageio-ffmpeg` is automatically detected and added to PATH at startup.
