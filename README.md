# Transcriptly — YouTube Transcript Extractor

**Transcriptly** is a minimal, elegant, production-quality web application that extracts accessible captions and subtitles from YouTube video links and organizes them into readable, human-friendly paragraphs.

Built to run locally on Linux Mint without requiring any paid API keys.

---

## Table of Contents

1. [Features](#features)
2. [Design System & Palette](#design-system--palette)
3. [Architecture & Tech Stack](#architecture--tech-stack)
4. [Project Structure](#project-structure)
5. [Prerequisites](#prerequisites)
6. [Local Installation & Setup](#local-installation--setup)
   - [Backend Setup (FastAPI)](#1-backend-setup-fastapi)
   - [Frontend Setup (Next.js)](#2-frontend-setup-nextjs)
7. [Running the Application](#running-the-application)
8. [API Documentation](#api-documentation)
9. [Transcript Formatting Engine](#transcript-formatting-engine)
10. [Testing & Verification](#testing--verification)
11. [Privacy & Security](#privacy--security)
12. [Troubleshooting](#troubleshooting)

---

## Features

- **Universal Link Support**: Accepts standard watch links (`youtube.com/watch?v=...`), shortened links (`youtu.be/...`), YouTube Shorts (`youtube.com/shorts/...`), and embed URLs (`youtube.com/embed/...`).
- **Clean Paragraph Merging**: Intelligent sentence boundary and pause-gap grouping transforms fragmented rolling captions into smooth, natural paragraphs while strictly preserving 100% of the speaker's original words.
- **Configurable Paragraph Length**: Switch between Short (~50 words), Medium (~100 words), and Long (~180 words) paragraph layouts on the fly.
- **Dual View Modes**:
  - **Paragraphs**: Formatted for reading, note-taking, and studying.
  - **Timestamped Segments**: Reversible view displaying every segment with timestamp tags.
- **In-Transcript Search**: Quickly find terms and phrases in extracted transcripts with live keyword filtering.
- **Instant Exports**:
  - **Copy All**: One-click clipboard copy with feedback.
  - **TXT**: Clean plain-text download with title, URL, and metadata header.
  - **JSON**: Full structured export with raw segments, start offsets, and durations.
  - **SRT**: SubRip subtitle format with millisecond timecodes (`00:00:01,360 --> 00:00:03,040`).
- **Multi-Language Tracks**: Detects all available creator-uploaded and auto-generated subtitle languages with in-app track switching.
- **Zero Database / Zero Storage**: Ephemeral client-side session state. No video URLs or transcripts are logged to databases.
- **No Paid API Keys**: Uses YouTube's official caption streams and oEmbed endpoints directly.

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
[ Browser / Next.js Client ]  <--- JSON / HTTP --->  [ FastAPI Backend ]
      App Router (React 19)                             Python 3.12
      Tailwind CSS                                      youtube-transcript-api
      Lucide Icons                                      YouTube oEmbed
      Zod Validation                                    Paragraph Formatter
```

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS, Lucide React, Zod.
- **Backend**: FastAPI, Uvicorn, Python 3.12, `youtube-transcript-api`, `httpx`, Pydantic v2.
- **Storage**: Client-side React state.

---

## Project Structure

```
video-link-to-transcript/
├── client/                      # Next.js frontend application
│   ├── app/
│   │   ├── layout.tsx           # Root layout with Inter font, Navbar & Footer
│   │   ├── page.tsx             # Home: Hero, URL card, metrics, and transcript view
│   │   ├── how-it-works/
│   │   │   └── page.tsx         # Educational overview & caption comparisons
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
│   │   │   ├── youtube_service.py   # URL parsing, oEmbed metadata, caption extraction
│   │   │   └── formatter_service.py # Paragraph grouping, deduplication, SRT generator
│   │   ├── config.py            # CORS origins, host, port, rate limiting
│   │   └── main.py              # FastAPI application, rate limiter, global error handler
│   ├── tests/
│   │   ├── test_url_extraction.py   # URL & Video ID regex tests
│   │   ├── test_formatter.py        # Paragraph merging and SRT generator tests
│   │   └── test_api.py              # FastAPI endpoint tests
│   ├── requirements.txt         # Pinned Python package dependencies
│   ├── .env.example             # Backend environment variables template
│   └── venv/                    # Isolated Python virtual environment
└── README.md
```

---

## Prerequisites

- **OS**: Linux Mint (or any modern Linux distribution / macOS)
- **Node.js**: v20+ (`node -v`)
- **npm**: v10+ (`npm -v`)
- **Python**: 3.10+ with `python3-venv` (`python3 --version`)

---

## Local Installation & Setup

### 1. Backend Setup (FastAPI)

1. Open a terminal in the project directory:
   ```bash
   cd /home/abdullah/project/video-link-to-transcript/server
   ```
2. Create and activate a dedicated virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```
4. Configure environment variables (optional, sensible defaults included):
   ```bash
   cp .env.example .env
   ```

### 2. Frontend Setup (Next.js)

1. Open another terminal in the `client` directory:
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
   NEXT_PUBLIC_GITHUB_URL=https://github.com/your-username/transcriptly
   ```

---

## Running the Application

### 1. Start the Backend Server

```bash
cd /home/abdullah/project/video-link-to-transcript
source server/venv/bin/activate
uvicorn server.app.main:app --host 0.0.0.0 --port 8000 --reload
```
The FastAPI backend will start at `http://localhost:8000`.
- API documentation (Swagger UI): `http://localhost:8000/docs`
- Health check: `http://localhost:8000/api/health`

### 2. Start the Frontend Server

```bash
cd /home/abdullah/project/video-link-to-transcript/client
npm run dev
```
Open your browser at `http://localhost:3000` (or `http://localhost:3001` if port 3000 is occupied).

---

## API Documentation

### 1. `GET /api/health`
Checks backend service availability.
- **Response `200 OK`**:
  ```json
  {
    "status": "healthy",
    "service": "Transcriptly API",
    "version": "1.0.0"
  }
  ```

### 2. `POST /api/transcript`
Extracts captions and groups them into readable paragraphs.
- **Request Body**:
  ```json
  {
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "language": "en",
    "paragraph_length": "medium"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "video_id": "dQw4w9WgXcQ",
    "video_info": {
      "video_id": "dQw4w9WgXcQ",
      "title": "Rick Astley - Never Gonna Give You Up (Official Video) (4K Remaster)",
      "author": "Rick Astley",
      "thumbnail_url": "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"
    },
    "language": "en",
    "language_name": "English",
    "is_generated": false,
    "available_languages": [
      {
        "code": "en",
        "name": "English",
        "is_generated": false,
        "is_translatable": true
      }
    ],
    "paragraphs": [
      "We're no strangers to love. You know the rules and so do I...",
      "A full commitment's what I'm thinking of..."
    ],
    "segments": [
      {"text": "We're no strangers to love.", "start": 18.64, "duration": 3.24}
    ],
    "srt": "1\n00:00:18,640 --> 00:00:21,880\nWe're no strangers to love.\n",
    "word_count": 428,
    "character_count": 1971
  }
  ```

### 3. `GET /api/transcript/languages?video_id=VIDEO_ID`
Lists all available manual and auto-generated subtitle tracks for a given video ID or link.

### 4. `GET /api/video-info?video_id=VIDEO_ID`
Returns verified video title, author channel, and thumbnail from YouTube oEmbed without requiring an API key.

---

## Transcript Formatting Engine

Raw subtitle streams are fragmented into incomplete 1–3 second pieces:
```
"Not because I doubted myself, but"
"because I was told that I wasn't good"
"enough. I was told that I didn't fit in."
```

Transcriptly's formatting engine:
1. **HTML entity unescaping & sanitization**: Resolves `&amp;`, `&#39;`, NBSP, and irregular linebreaks.
2. **Rolling duplicate suppression**: Strips repeated phrase overlaps between rolling caption segments.
3. **Punctuation & sentence boundary detection**: Identifies periods, exclamation marks, and question marks to preserve logical cadence.
4. **Speaker pause analysis**: Measures timing gaps between consecutive segments (`start - last_end_time >= pause_threshold`). Pauses exceeding 2 seconds indicate a natural break or topic transition.
5. **Configurable length constraints**:
   - `short`: Targets ~50 words per paragraph.
   - `medium`: Targets ~100 words per paragraph.
   - `long`: Targets ~180 words per paragraph.
6. **Zero hallucination guarantee**: No words are altered, omitted, or fabricated.

---

## Testing & Verification

### Running Backend Unit Tests
Run the comprehensive pytest suite:
```bash
cd /home/abdullah/project/video-link-to-transcript
server/venv/bin/pytest server/tests -v
```
All 16 unit tests test:
- YouTube URL formats (watch, youtu.be, shorts, embeds, direct IDs, invalid strings).
- Text sanitization, overlap removal, SRT timecode formatting, paragraph merging.
- FastAPI endpoints with mocked caption streams and error handlers.

### Running Client Build Verification
```bash
cd /home/abdullah/project/video-link-to-transcript/client
npm run build
```

---

## Privacy & Security

- **No Data Persistence**: Transcripts are processed in-memory and held in client-side state.
- **Server-Side Validation**: All URLs are validated and sanitized server-side; arbitrary URLs or SSRF attempts are rejected.
- **Rate Limiting**: In-memory sliding window rate limiter protects endpoints from abusive automated loops.
- **No Traceback Exposure**: Unhandled exceptions return safe structured JSON errors (`{ "detail": "...", "code": "..." }`) rather than Python stack traces.
- **Legitimate Access Only**: Accesses only publicly available captions using standard YouTube streams; private or restricted videos without captions are gracefully reported.

---

## Troubleshooting

- **"No accessible captions found"**: The video owner did not upload subtitles and YouTube did not generate automatic captions. Try another video with captions enabled.
- **"YouTube caption access is temporarily rate-limited"**: YouTube occasionally throttles high-frequency IP requests. Wait a short moment and retry.
- **"Port 3000 is in use"**: If port 3000 is occupied by another application, Next.js will automatically bind to port 3001. The backend CORS configuration permits both `http://localhost:3000` and `http://localhost:3001`.
