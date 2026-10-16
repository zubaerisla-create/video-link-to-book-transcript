# 📚 Transcriptly — Chrome Extension User Guide

> **Free, Fast & Private YouTube Transcript Importer**  
> Capture clean transcripts directly from YouTube's native player into your Transcriptly digital reader library (`https://habd.tech`), completely bypassing datacenter IP rate limits.

---

## 🚀 1. How to Install (ইনস্টল করার নিয়ম)

You can install this extension on **Google Chrome**, **Brave**, **Microsoft Edge**, **Opera**, or any Chromium-based browser in under 1 minute.

### Step-by-Step Installation:

1. **Get the Extension Folder**:
   - Download or clone this repository to your computer.
   - Locate the `extension` folder (it contains `manifest.json`, `popup.html`, `content.js`, etc.).

2. **Open Extensions Page**:
   - In Google Chrome, open a new tab and paste this into the address bar:
     ```text
     chrome://extensions
     ```
   - (If using Brave: `brave://extensions` | Edge: `edge://extensions`)

3. **Enable Developer Mode**:
   - Turn **ON** the **"Developer mode"** toggle switch in the top-right corner.

4. **Load the Extension**:
   - Click the **"Load unpacked"** button in the top-left corner.
   - Select the `extension` folder from your file manager.

5. **Pin Extension for Easy Access**:
   - Click the puzzle piece icon (Extensions icon) on your Chrome toolbar.
   - Click the **Pin** icon next to **Transcriptly** so it appears on your browser bar.

---

## 🎬 2. How to Use on YouTube (ব্যবহার করার নিয়ম)

### Step 1: Open Any YouTube Video
- Go to [YouTube](https://www.youtube.com) and play any video that has captions or subtitles.

### Step 2: Open the Transcript on YouTube
- **Automatic Method**: Click the **Transcriptly** extension icon on your browser toolbar. If the transcript is closed, click the purple button: **"Try Open YouTube Transcript"**.
- **Manual Method**: In YouTube, click **"...more"** in the video description, scroll down and click **"Show transcript"**.

### Step 3: Preview Clean Transcript
- The Transcriptly extension will instantly scan the captions and display:
  - Video Title & Channel Name
  - Accurate segment count and word count
  - Language indicator (e.g., *Original* or *Bangla*)
  - A 4-line snippet preview of the transcript

### Step 4: Import to Transcriptly
- Click the purple **"Import to Transcriptly"** button.
- A new tab will immediately open on **[habd.tech](https://habd.tech/import)** with your imported book draft ready to read!

### Step 5: Read, Save & Export
- Review formatted book paragraphs or raw subtitle segments.
- Click **"Save to Library"** to keep it in your personal digital reader.
- Switch between **Light**, **Sepia**, or **Dark** themes, adjust font size (`sm, md, lg, xl`), and enjoy reading on your phone or desktop.
- Export anytime as **PDF**, **Plain Text (TXT)**, or **Subtitles (SRT)**.

---

## 📋 3. Additional Features

### 📝 Manual Paste Fallback
If a video does not have native captions or you already have text copied:
1. Click the **"Manual Paste"** tab in the extension.
2. Enter the YouTube URL and paste your text.
3. Choose your paragraph style (*Short, Medium, or Long*).
4. Click **"Stage & Review Pasted Transcript"**.

### ⚙️ Settings (Custom Host)
By default, the extension connects to the live production server at `https://habd.tech`. If you are developing locally, switch to `http://localhost:3000` under the **Settings** tab.

---

## 🔒 4. Privacy & Safety Guarantee

- **No Cookies or Logins Captured**: The extension only reads user-visible transcript text rendered on the open YouTube page.
- **No Ads, Tracking, or Analytics**: 100% open-source and private.
- **Direct Local Capture**: Does not trigger YouTube bot-detection or datacenter IP rate limits.
