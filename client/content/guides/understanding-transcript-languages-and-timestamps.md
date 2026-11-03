When you look at a transcript, two questions decide how far you can trust it: *which caption track did this come from?* and *how do its timestamps relate to the video?* This guide explains the kinds of caption tracks YouTube offers, what language codes like `en`, `en-GB` and `bn` mean, how caption timestamps are measured and formatted, and what all of that means in practice.

## The kinds of caption tracks

A YouTube video can have any combination of these:

### Creator-uploaded captions

Captions the channel uploaded or edited. They're typically the most accurate, because a person wrote or reviewed them. They can be in the spoken language or in other languages (translations the creator commissioned or wrote).

In YouTube's subtitle menu, they appear simply under the language name, for example **English** or **Bangla**.

### Auto-generated captions

Produced by YouTube's speech recognition for supported languages. They appear as, for example, **English (auto-generated)**. They're usually close, but contain errors with names, technical terms and numbers, and often have sparse punctuation. See [How Automatic Speech Recognition Works](/guides/how-automatic-speech-recognition-works).

### Auto-translated captions

Under **Auto-translate** in the subtitle menu, YouTube can machine-translate a track into many languages on the fly. These are translations, not transcripts. They're useful for understanding, but they aren't what the speaker said.

### Why it matters

| Track | Good for | Not good for |
| --- | --- | --- |
| Creator captions (spoken language) | Quotes, study, research | — (still spot-check) |
| Auto-generated | Reading, skimming, study with care | Quoting without checking |
| Creator translation | Understanding; may be high quality | Quoting the speaker's exact words |
| Auto-translated | Getting the gist | Anything precise |

## How Transcriptly chooses a track

In the default **original-language** mode, Transcriptly aims to give you the speaker's own words:

- It prefers **creator-uploaded** tracks over auto-generated ones.
- It uses the **script of the video title** as a hint — a title in Bengali script suggests the video is in Bangla — and looks for a matching track.
- If the only track is auto-generated in a language that clashes with the title's script, it reports original captions as unavailable, rather than give you text that's probably wrong.

The result shows the detected language, and the TXT and JSON exports record it together with whether the track was auto-generated. If you choose a **target language** instead, you get a translation, clearly labelled. [How to Transcribe Videos in Different Languages](/guides/how-to-transcribe-videos-in-different-languages) covers this in depth.

## Language codes

Caption tracks are identified by language codes based on the BCP 47 standard:

| Code | Meaning |
| --- | --- |
| `en` | English |
| `en-GB`, `en-US` | English, British / American variant |
| `bn` | Bangla (Bengali) |
| `hi` | Hindi |
| `ar` | Arabic |
| `ur` | Urdu |
| `es`, `es-419` | Spanish; Latin American Spanish |
| `zh-Hans`, `zh-Hant` | Chinese, simplified / traditional script |
| `pt-BR` | Brazilian Portuguese |

The first part is the language; anything after a hyphen narrows it to a region or script. A video can have both `en` and `en-GB` tracks with slightly different spelling. In Transcriptly's JSON export, `available_languages` lists every track the video offered, with its code and whether it was auto-generated.

## Timestamps

### What a timestamp measures

Each caption segment has:

- a **start time** — seconds from the beginning of the video when the caption appears, and
- a **duration** — how long it stays on screen.

The end time is start + duration. These are **display** times, chosen so the text appears roughly as the words are spoken. They're usually close to when the words were said, but not precise to the syllable — especially for auto-captions, where a segment may appear slightly before or after the speech.

### Formats you'll see

| Where | Format | Example |
| --- | --- | --- |
| YouTube transcript panel | `m:ss` or `h:mm:ss` | `12:34`, `1:02:15` |
| Transcriptly segments / JSON | seconds (decimal) | `754.32` |
| SRT files | `hh:mm:ss,mmm` | `00:12:34,320` |
| WebVTT files | `hh:mm:ss.mmm` | `00:12:34.320` |
| YouTube links | `t=` in seconds | `&t=754s` |

Converting is simple arithmetic: 754.32 seconds = 12 minutes 34.32 seconds → `00:12:34,320` in SRT. Note the comma in SRT and the full stop in WebVTT.

### Overlapping times

In auto-generated captions, a segment often starts before the previous one ends. That's the "rolling" display style, where two lines are on screen at once. Transcriptly uses this overlap to recognise and remove duplicated words when it builds paragraphs. The cleaned segments keep their original start times. See [How Sentence Splitting Works in Multilingual Transcription](/guides/how-sentence-splitting-works-in-multilingual-transcription).

### Paragraphs don't have timestamps

When segments are merged into paragraphs, individual times are no longer shown. If you need times — to quote, cite or jump back — use the **Timestamped** view, the SRT export, or the JSON export, which keeps both segments and paragraphs.

## Using timestamps in practice

- **Jump to a moment.** Add `&t=754s` to a `youtube.com/watch` link (or `?t=754` to a `youtu.be` link) to start playback at 12:34.
- **Cite a quote.** Give the start time, or a range: "12:34–13:10".
- **Verify a passage.** Before quoting auto-captions, listen at the timestamp to confirm the words. See [How to Research More Efficiently with Video Transcripts](/guides/how-to-research-efficiently-with-video-transcripts).
- **Sync your notes.** Put timestamps next to note headings so each note leads back to the explanation. See [How to Turn YouTube Lectures into Structured Study Notes](/guides/how-to-turn-youtube-lectures-into-study-notes).

## Translations and timing

When Transcriptly translates a transcript, translated segments keep the timing of the original segments, and paragraphs are aligned so the **Side-by-Side** view shows corresponding original and translated paragraphs together. Because languages differ in word order and length, alignment is at the level of segments and paragraphs, not individual words.

## Frequently asked questions

### Why is a caption slightly out of sync with the speech?

Caption times are display times, and auto-generated timing isn't always exact. A difference of a fraction of a second is normal.

### What does "auto-generated" mean on a non-English track?

The same as for English: it was produced by YouTube's speech recognition in that language, not written by a person.

### Can I tell from an export which kind of track it came from?

Yes. The JSON export includes `is_generated` and `transcription_method`, and the TXT header states the language and method. That's why we recommend keeping JSON exports for anything you might quote later — see [SRT vs TXT vs JSON](/guides/srt-vs-txt-vs-json-transcript-formats).
