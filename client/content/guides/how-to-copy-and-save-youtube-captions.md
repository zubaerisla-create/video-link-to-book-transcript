Copying captions from YouTube sounds trivial until you paste them somewhere. What arrives is usually hundreds of short lines with timestamps wedged between them, repeated words where auto-captions scrolled, and no paragraph breaks at all. This guide explains why that happens, how to get clean text instead, and how to save captions in a format you'll still be able to use in a year.

## Why copied captions look so messy

Captions are designed to be *displayed*, not *read*. Each caption cue is sized to fit on screen for two or three seconds, so a single sentence might be split across four cues. Three things make the raw text especially awkward:

1. **Timestamps between every cue.** YouTube's transcript panel shows the start time of each cue, and copying the panel copies those too.
2. **Rolling duplicates in auto-captions.** Auto-generated captions are produced live as the words are recognised, so consecutive cues often overlap — the end of one line is repeated at the start of the next.
3. **Missing punctuation.** Auto-captions on many videos have few full stops and no paragraph structure, so even with timestamps removed you get one enormous block of text.

Here's a short, realistic fragment of what a copy-paste from the panel looks like:

```
1:12
and the reason this matters is that
1:14
that is that most people never
1:16
never actually test their backups
```

Read aloud, the speaker said one sentence: *"And the reason this matters is that most people never actually test their backups."*

## Getting clean text with Transcriptly

1. Paste the video link into the [Transcriptly home page](/) and click **Get Transcript** (or use the [Chrome extension](/guides/how-to-use-chrome-extension) if the website reports a YouTube block).
2. Switch to **Paragraphs**. Transcriptly strips timestamps, removes the rolling overlaps (it compares the last few words of each cue with the start of the next), joins the fragments into continuous text, and starts new paragraphs at sentence ends after natural pauses or once a target length is reached.
3. Choose **short**, **medium** or **long** paragraphs. Short paragraphs (around 50 words) are easier to skim on a phone; long ones (around 180 words) read more like a book.
4. Click **Copy All** to copy the current view to your clipboard.

Nothing is paraphrased or summarised. If the speaker said "um, so, basically," that's still there — the cleaning only deals with caption mechanics, not speech style. If you want a tidier reading text, see [How to Transform Long Video Lectures into Reading Materials](/guides/how-to-transform-video-lectures-into-reading-materials).

## Choosing how to save it

Copying to the clipboard is fine for a quick paste into notes. For anything you want to keep, download a file or save it to your library.

| Option | What you get | Good for |
| --- | --- | --- |
| **Copy All** | The current view as plain text on your clipboard | Pasting into notes, documents or messages |
| **TXT** | A plain-text file with a short header (title, URL, language) and the paragraphs | Long-term archiving, any text editor, searching with your computer |
| **SRT** | Numbered subtitle cues with start and end times | Video editors, media players, citing exact timestamps |
| **JSON** | Structured data: segments, timings, paragraphs and metadata | Scripts, research datasets, importing into other tools |
| **Save to My Library** | A book in your Transcriptly account | Reading on any device, PDF export, word lookup while reading |

For a deeper comparison of the three file formats, read [SRT vs TXT vs JSON](/guides/srt-vs-txt-vs-json-transcript-formats).

## Saving to your library

**Save to My Library** turns the transcript into a book in your account (a free account is required). Saved books:

- Open in a reader with page-by-page or continuous scrolling.
- Offer light, sepia and dark themes and adjustable text size.
- Remember your reading progress.
- Can be exported later as TXT, SRT, JSON or a formatted **PDF** with a title page and page numbers. The PDF uses fonts that render Bangla correctly, which many generic PDF converters get wrong.
- Let you tap an English word to see its meaning and save it to your [personal vocabulary list](/guides/how-to-build-a-vocabulary-dictionary-from-video-transcripts).

Only transcripts you explicitly save are stored. If you just extract and download, nothing is kept in your account.

## Naming files so you can find them later

Transcriptly names downloads after the video title. If you collect many transcripts, consider renaming them consistently, for example:

```
2026-10-28_channel-name_short-video-title.txt
```

Putting the date first sorts files chronologically; the channel name groups a series together. [How to Extract and Organize YouTube Video Transcripts](/guides/how-to-extract-and-organize-youtube-transcripts) covers a complete folder and tagging system.

## Common mistakes

- **Keeping only the paragraphs.** Paragraph text has no timestamps. If you might need to cite or revisit a specific moment, also keep the SRT or JSON export.
- **Saving a translated version as if it were original.** If you used translation, label the file clearly. A translation is useful for understanding but shouldn't be quoted as the speaker's words.
- **Editing the only copy.** If you correct errors, keep the original export too so you can see what changed.
- **Ignoring copyright.** Saving transcripts for personal study is reasonable; republishing them in full is a different matter. See our [copyright page](/copyright).

## Frequently asked questions

### Can I copy captions without timestamps directly from YouTube?

In some layouts, YouTube's transcript panel menu lets you hide timestamps, but you still get one fragment per line and the rolling duplicates remain. You'd need to join lines by hand.

### Which format opens in Word or Google Docs?

TXT. Open it directly, or copy from the Paragraphs view and paste.

### Does the SRT include my paragraph formatting?

No. SRT is a subtitle format, so it keeps the original timed cues rather than paragraphs. That's intentional: it's what video players and editors expect.

### Is there a limit to how many transcripts I can save?

There's no published limit for normal personal use. If that changes, it will be stated in the [Terms of Service](/terms).
