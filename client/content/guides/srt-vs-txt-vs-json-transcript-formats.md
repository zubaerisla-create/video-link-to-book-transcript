When you export a transcript from Transcriptly you're offered three file formats: **SRT**, **TXT** and **JSON**. They contain the same words but are built for different jobs. Picking the wrong one is rarely a disaster, but picking the right one saves conversion work later. This guide shows what's inside each file, which programs read it, and when to use which.

## The short answer

| If you want to… | Use |
| --- | --- |
| Read, print, or paste into a document | **TXT** |
| Add subtitles to a video, or cite exact timestamps | **SRT** |
| Process transcripts with code, or keep every detail | **JSON** |
| Read on your phone as a book | Save to your library (and export **PDF** if you need a file) |

If you're archiving something important, export **TXT and JSON** together: one is human-friendly, the other keeps everything.

## TXT: plain text for people

A TXT file is just characters — no formatting, no hidden structure. Transcriptly's TXT export starts with a small header and then the paragraphs, separated by blank lines:

```
How Memory Works — Lecture 3
URL: https://www.youtube.com/watch?v=XXXXXXXXXXX
Language: English (en)
Method: captions

Today we're going to look at how memory actually works in the brain and why cramming tends to fail...

The first thing to understand is that recall is reconstruction...
```

**Strengths**

- Opens in every text editor, word processor and phone.
- Will still be readable in thirty years; there's nothing to become obsolete.
- Easy to search with your operating system's file search or command-line tools.
- Small: an hour of speech is typically a few dozen kilobytes.

**Limitations**

- No timestamps. Once you're in paragraph form, you can't tell where in the video a sentence was said.
- No structure beyond paragraphs, so software can't easily tell the header from the body.

If you translated the transcript, the TXT header says which language it was translated into and by which provider, and the side-by-side export labels each block `[ORIGINAL]` and `[TRANSLATED]`. Keep those labels: they're the only record of which text is the speaker's own.

## SRT: timed subtitles

SubRip (SRT) is the most widely supported subtitle format. Each caption cue is a numbered block with a start time, an end time, and the text:

```
1
00:00:04,120 --> 00:00:06,480
so today we're going to look at

2
00:00:06,480 --> 00:00:08,900
how memory actually works in the
```

Times are `hours:minutes:seconds,milliseconds` — note the **comma** before the milliseconds, which is part of the SRT standard (WebVTT, a similar format, uses a full stop).

**Strengths**

- Understood by video players (VLC, mpv), video editors (Premiere Pro, DaVinci Resolve, Final Cut Pro via import), and YouTube Studio's subtitle upload.
- Every line can be traced back to a moment in the video, which makes SRT ideal for **citing** a quote: "at 12:41".
- Still human-readable in a text editor.

**Limitations**

- Text is split into short display-length cues, so it's uncomfortable to read as prose.
- No metadata such as title, language or source URL.
- Styling support is limited and inconsistent between players.

Transcriptly's SRT keeps the original cue boundaries rather than the merged paragraphs — that's what subtitle software expects. When you extract a transcript in translation mode, the SRT export matches the view you're in (original or translated).

## JSON: structured data for software

JSON stores the transcript as nested fields that programs can read directly. Transcriptly's JSON export is the complete result of the extraction, including:

- `video_id`, `video_info` (title, channel and so on)
- `detected_language`, `language`, `is_generated` (whether the captions were auto-generated), and `transcription_method`
- `segments` — each with `text`, `start` and `duration` in seconds
- `paragraphs` — the merged readable text
- `original_*` and `translated_*` versions when you used translation
- `available_languages` — every caption track YouTube offered
- `word_count` and `character_count`

A trimmed example:

```json
{
  "video_id": "XXXXXXXXXXX",
  "detected_language": "en",
  "is_generated": true,
  "segments": [
    { "text": "so today we're going to look at", "start": 4.12, "duration": 2.36 }
  ],
  "paragraphs": ["Today we're going to look at how memory actually works..."]
}
```

**Strengths**

- Keeps everything: timings, paragraphs, translation and provenance in one file.
- Trivial to load in Python, JavaScript, R or a spreadsheet tool with a JSON importer.
- Ideal for research datasets — you can record whether each transcript came from auto-generated or creator captions, which matters when you judge accuracy.

**Limitations**

- Not pleasant to read directly.
- Less universally supported by non-technical tools.

Here's how little code it takes to turn a JSON export into a timestamped quote list in Python:

```python
import json

with open("lecture-transcript.json", encoding="utf-8") as f:
    data = json.load(f)

for seg in data["segments"]:
    minutes, seconds = divmod(int(seg["start"]), 60)
    if "memory" in seg["text"].lower():
        print(f"{minutes:02d}:{seconds:02d}  {seg['text']}")
```

## What about PDF?

PDF isn't offered at extraction time; it's available once you've saved a transcript to your library. Transcriptly's PDF export lays the text out as a book with a title page and page numbers, and embeds fonts that render Bangla correctly. Use it for printing or sharing a read-only copy. Don't use it as your archive format — text is harder to extract from a PDF than from TXT or JSON.

## Character encoding: why Bangla sometimes turns into "????"

All Transcriptly exports are saved as **UTF-8**, which can represent every script. If you open a file and see question marks or garbled characters, the program opening it has assumed a different encoding. In most editors you can reopen the file with encoding set to UTF-8. Spreadsheet programs are the most common culprit when importing; use the import dialogue rather than double-clicking the file.

## Choosing for common workflows

- **Studying a lecture:** save to library for reading; export TXT for your notes app. See [How to Turn YouTube Lectures into Structured Study Notes](/guides/how-to-turn-youtube-lectures-into-study-notes).
- **Quoting in an essay or article:** TXT to find the passage, SRT to get its timestamp. See [How to Research More Efficiently with Video Transcripts](/guides/how-to-research-efficiently-with-video-transcripts).
- **Subtitling your own video:** SRT, then correct it in a subtitle editor. See [How to Fix Incorrect YouTube Captions](/guides/how-to-fix-incorrect-youtube-captions).
- **Building a research corpus:** JSON for everything, plus a spreadsheet index. See [How to Organize and Manage Video Transcripts for Research](/guides/how-to-organize-video-transcripts-for-research).

## Frequently asked questions

### Can I convert SRT to TXT myself?

Yes — delete the number and time lines and join the remaining text. But you'll still have the line fragments and duplicates; exporting TXT from Transcriptly gives you merged paragraphs directly.

### Why does my SRT have more lines than my TXT has sentences?

SRT cues follow the original caption timing, which splits sentences across several cues. TXT contains merged paragraphs.

### Is WebVTT (.vtt) supported?

Transcriptly exports SRT rather than VTT. Most tools that accept VTT also accept SRT, and the formats differ mainly in the header and the millisecond separator. You can *upload* `.srt`, `.vtt` or `.txt` files on the home page to read them as books.

### Which format is best for long-term storage?

Plain TXT for readability, plus JSON if you need timings and metadata. Both are open, text-based and UTF-8.
