Reading is usually faster than watching, and text can be searched, quoted and annotated in ways a video can't. If you need the words from a YouTube video — to review a lecture, cite an interview or study a language — there are three reliable ways to get them. This guide walks through each one, explains what you get back, and helps you pick the right one for the job.

## Before you start: does the video have captions?

Every method below depends on a caption track existing. A YouTube video can have:

- **Creator-uploaded captions** — written or corrected by the channel. These are usually the most accurate.
- **Auto-generated captions** — produced by YouTube's speech recognition. Common on English videos and increasingly on other languages, but with no punctuation guarantees and frequent errors on names and technical terms.
- **Auto-translated captions** — a machine translation of another track, generated on the fly.
- **No captions at all** — the uploader disabled them, the audio is mostly music, or YouTube hasn't processed the video yet.

The quickest check is the **CC** button in the video player. If it's missing or greyed out, none of the caption-based methods will work, and you should go straight to [How to Fix Missing or Unavailable YouTube Captions](/guides/how-to-fix-missing-unavailable-captions). For the difference between the track types, see [Understanding Transcript Languages, Tracks and Timestamps](/guides/understanding-transcript-languages-and-timestamps).

## Method 1: YouTube's built-in transcript panel

YouTube can show a transcript next to the video on desktop.

1. Open the video in a desktop browser.
2. Click **...more** under the video title to expand the description.
3. Scroll to the bottom of the description and click **Show transcript**.
4. A panel opens with each caption line and its timestamp. Clicking a line jumps the video to that moment.
5. To switch language, use the menu at the bottom of the panel.

**What you get:** a scrollable, clickable list of short lines — good for finding a moment in the video, awkward for anything else. If you select and copy the panel, you get every timestamp mixed in with the text:

```
0:04
so today we're going to look at
0:06
how memory actually works in the
0:08
brain and why cramming fails
```

You can switch timestamps off from the panel's three-dot menu in some layouts, but you still end up with one fragment per line and no paragraph structure. Turning that into readable text by hand takes a while for anything longer than a few minutes.

**Use it when:** you need one quote or one timestamp and don't need to keep the text.

## Method 2: Paste the link into Transcriptly

1. Copy the video URL from the address bar or YouTube's **Share** button. Standard links (`youtube.com/watch?v=…`), short links (`youtu.be/…`) and Shorts links all work.
2. Paste it into the box on the [Transcriptly home page](/) and click **Get Transcript**.
3. By default Transcriptly picks the video's **original-language** track, preferring creator-uploaded captions over auto-generated ones. You can instead choose a target language to translate into.
4. Read the result in one of three views: **Paragraphs** (caption fragments merged into readable prose), **Timestamped** (each segment with its start time), or **Side-by-Side** when you've translated.
5. Pick a paragraph length — short, medium or long — to suit skimming or close reading.
6. Use **Copy All**, download **TXT**, **SRT** or **JSON**, or **Save to My Library** to keep it as a book (requires a free account).

**What you get:** the same caption text as the YouTube panel, but cleaned up. Transcriptly removes the repeated words that appear when auto-captions "roll" from one line to the next, joins the fragments into continuous text, and breaks it into paragraphs at sentence-ending punctuation and pauses. It doesn't rewrite or summarise what the speaker said. [How Sentence Splitting Works in Multilingual Transcription](/guides/how-sentence-splitting-works-in-multilingual-transcription) explains the process.

**Use it when:** you want to read, keep or export the whole transcript.

> [!warning] YouTube sometimes limits requests that come from servers rather than from people's browsers. If the website reports that YouTube blocked or rate-limited the request, the video may still have captions — use Method 3 instead.

## Method 3: The Transcriptly Chrome extension

The extension reads the transcript panel that YouTube shows in *your* browser and hands it to Transcriptly. Because the request comes from your own viewing session, it isn't affected by server-side blocking.

1. Install the extension once (about a minute) by following [How to Install and Use the Transcriptly Chrome Extension](/guides/how-to-use-chrome-extension).
2. Open the video on YouTube and open **Show transcript** (or let the extension open it for you).
3. Click the Transcriptly icon, check the preview, and click **Import to Transcriptly**.
4. The transcript opens in a new Transcriptly tab, where you can read it in paragraphs, save it or export it.

**Use it when:** Method 2 fails with a blocking or rate-limit error, or you're collecting many transcripts and want to work straight from YouTube.

## Which method should you use?

| Situation | Best method |
| --- | --- |
| You need one quote or one timestamp | YouTube's transcript panel |
| You want a readable, complete transcript | Paste the link into Transcriptly |
| You want to translate the transcript | Paste the link and choose a target language |
| The website reports a YouTube block or rate limit | Chrome extension |
| You want to keep and reread it | Either Transcriptly method, then save to your library |
| The video has no captions | See the missing-captions guide |

## A worked example

Suppose you're taking an online course and want a 40-minute lecture as text.

1. Paste the lecture URL into Transcriptly. The original English track is detected — say it's auto-generated.
2. Switch to **Paragraphs** with **medium** length. Instead of roughly a thousand short caption lines, you get a few dozen paragraphs you can actually read.
3. Because the track is auto-generated, skim for obviously wrong words — technical terms are the usual casualties ("Bayesian" might come out as "basian"). [How to Fix Incorrect YouTube Captions](/guides/how-to-fix-incorrect-youtube-captions) has an efficient correction method.
4. Download **SRT** as well if you might want to cite exact timestamps later, and save the paragraphs to your library so you can reread on your phone.

From there, [How to Turn YouTube Lectures into Structured Study Notes](/guides/how-to-turn-youtube-lectures-into-study-notes) picks up where this guide ends.

## Common mistakes

- **Assuming auto-captions are accurate.** They're a draft. Check names, numbers and terminology before quoting.
- **Accidentally using a translated track.** If you pick a translated language in YouTube's panel, you get machine translation, not the speaker's words. Transcriptly's default original-language mode avoids this.
- **Copying from the YouTube panel for long videos.** It works, but you'll spend more time cleaning timestamps than reading.
- **Forgetting the source.** Note the URL and date when you save a transcript. Videos get edited, re-uploaded and deleted.

## Respecting creators

A transcript is still the creator's work. Using it for personal study, accessibility, or quoting short passages with attribution is very different from republishing someone's full transcript as your own content. Check the video's licence and YouTube's terms before reusing text publicly, and see our [copyright page](/copyright) for how we handle concerns.

## Frequently asked questions

### Do I need an account?

No. Extracting, reading, copying and downloading transcripts works without signing in. An account is only needed to save transcripts to a personal library and use the vocabulary features.

### Can I get a transcript from a private or members-only video?

No. Transcriptly only works with captions on publicly viewable videos.

### How long can the video be?

Caption-based extraction isn't limited by video length in normal use, though very long videos take a little longer to process.

### Does it work for YouTube Shorts?

Yes, if the Short has captions. Many Shorts don't, because they're mostly music or on-screen text.
