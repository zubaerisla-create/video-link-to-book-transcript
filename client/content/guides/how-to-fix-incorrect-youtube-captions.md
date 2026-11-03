Automatic captions get most words right and some words badly wrong. A lecture on "Bayesian inference" becomes "basin inference"; a speaker named Nguyen becomes "win"; "fifteen percent" becomes "fifty percent". For casual viewing these errors are harmless. For studying, quoting or publishing, they matter. This guide explains why captions go wrong, how to correct a transcript efficiently, and — if you're a creator — how to fix the captions on your own videos at the source.

> [!tip] If a video shows **no** transcript at all, that's a different problem. See [How to Fix Missing or Unavailable YouTube Captions](/guides/how-to-fix-missing-unavailable-captions).

## Why automatic captions make mistakes

Automatic captions come from speech recognition, which picks the most probable words for the sounds it hears. Errors cluster in predictable places:

- **Proper nouns.** Names of people, places, companies and products are rare in training data, so the system substitutes common words that sound similar.
- **Technical vocabulary.** Field-specific terms ("mitochondrial", "Kubernetes", "habeas corpus") are often replaced with everyday words.
- **Numbers.** "Thirteen" and "thirty", "fifteen" and "fifty" are easily confused, and numbers may appear as words or digits inconsistently.
- **Negations.** "Can" and "can't", "do" and "don't" — the difference is often a barely audible consonant.
- **Fast or overlapping speech.** Words get merged or dropped.
- **Accents and audio quality.** Accents that are less represented in training data, echoey rooms and background music all increase errors.

[How Automatic Speech Recognition Works](/guides/how-automatic-speech-recognition-works) explains the underlying reasons.

## Decide how much to correct

Correcting a full hour of transcript against the audio can take several hours. Most of the time you don't need to. Match the effort to the use:

| Use | Correction level |
| --- | --- |
| Getting the gist, casual reading | None — read around the errors |
| Personal study notes | Terms and names in the parts you're studying |
| Quoting in an essay or article | Every quoted passage, checked against the audio |
| Publishing a transcript or subtitles | Full pass against the audio |
| Research data | Full pass, with uncertainties marked |

## Method: an efficient correction pass

### 1. Get a clean starting point

Extract the transcript on the [Transcriptly home page](/) and export it as **TXT** (for reading and editing) and **SRT** or **JSON** (for timestamps). Keep the original export untouched; edit a copy.

### 2. Do a "find and replace" pass for repeated errors

Most transcripts have a handful of errors that repeat — the speaker's name, the main technical term. Fix these first, all at once:

1. Skim the transcript and note recurring wrong words.
2. Use your editor's find-and-replace to correct each one throughout.
3. Be careful with short words: replacing "win" with "Nguyen" everywhere would also change genuine uses of "win". Replace one at a time, checking each.

This step often fixes a large share of the meaningful errors in minutes.

### 3. Read for sense

Read the transcript at normal speed. Mark anything that doesn't make sense, or that makes sense but seems surprising — a surprising claim is often a misheard word. Don't stop to fix things yet; just mark them with something easy to search for, like `??`.

### 4. Check marked passages against the audio

For each mark, find the timestamp in the SRT or Transcriptly's **Timestamped** view, open the video at that moment, and listen. Tips:

- Add `&t=754s` to a YouTube URL to start at 12:34.
- Slow the video to 0.75× for difficult passages.
- Listen to the sentence before and after; context helps you hear.
- If you still can't tell, mark it honestly: `[inaudible 12:34]` or `[unclear: "fifteen"? 12:34]`.

### 5. Handle numbers consistently

Choose a style (for example, words for one to nine, digits for 10 and above) and apply it everywhere. Check every number that matters against the audio.

### 6. Keep a record

Save the corrected file with a clear name (`…_corrected.txt`) next to the original. For research use, note what kind of pass you did. [How to Organize and Manage Video Transcripts for Research](/guides/how-to-organize-video-transcripts-for-research) describes a full system.

## Bringing corrections back into Transcriptly

To read the corrected version as a book, upload your edited `.txt` or `.srt` on the home page using **Upload / Paste Subtitles** and save it to your library. Give it a title that shows it's the corrected version.

## Correcting subtitle files (SRT)

If you need corrected *subtitles* rather than reading text, edit the SRT export instead of the TXT:

- Change only the text lines; leave the numbers and the `-->` timing lines intact.
- Keep each cue short enough to read in the time it's displayed.
- Dedicated subtitle editors (such as Subtitle Edit or Aegisub) let you play the video alongside the cues, which makes this much easier.

## For creators: fixing captions at the source

If the video is yours, correcting captions in YouTube Studio helps every viewer, and improves the transcripts anyone gets from tools like Transcriptly. In YouTube Studio:

1. Open **Subtitles** from the left menu and select the video.
2. For the language, choose to **edit** or **duplicate and edit** the automatic captions.
3. Correct the text while the video plays; YouTube keeps the timing.
4. Publish. Your corrected track appears as a creator track, separate from the auto-generated one.

Alternatively, upload a corrected SRT file. YouTube's interface changes over time, so check YouTube's own help pages if the menus look different.

Transcriptly prefers creator-uploaded captions over auto-generated ones, so once you publish corrected captions, they'll be used automatically.

## Common mistakes

- **Editing the only copy.** Always keep the original export.
- **Global replace on short words.** It introduces new errors.
- **"Fixing" what the speaker actually said.** If the speaker misspoke, a faithful transcript keeps it (optionally with `[sic]`). Correct the *captions*, not the *speaker*.
- **Guessing instead of marking.** An honest `[inaudible]` is better than a confident wrong word.
- **Checking only the transcript, not the audio.** You can't correct captions by reading alone.

## Frequently asked questions

### Can Transcriptly correct captions automatically?

No. It removes caption artefacts such as rolling duplicates and formats the text into paragraphs, but it doesn't change the words. Automatic "correction" would risk changing meaning without telling you.

### Is speech-to-text more accurate than YouTube's auto-captions?

Sometimes, depending on the audio and language. See [YouTube Auto Captions vs Whisper](/guides/youtube-auto-captions-vs-whisper) for a way to test it on your own videos.

### Can I suggest corrections to someone else's captions?

YouTube's community captions feature was discontinued in 2020. Today, only the creator (or people they authorise) can edit a video's captions. If you spot a significant error, you can let the creator know in a comment.

## Related guides

- [How to Fix Missing or Unavailable YouTube Captions](/guides/how-to-fix-missing-unavailable-captions)
- [How Automatic Speech Recognition Works](/guides/how-automatic-speech-recognition-works)
- [How to Research More Efficiently with Video Transcripts](/guides/how-to-research-efficiently-with-video-transcripts)
