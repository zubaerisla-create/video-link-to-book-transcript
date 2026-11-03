Getting an English transcript of an English video is usually easy. Things get harder when the video is in Bangla, Hindi, Arabic, Spanish or any language where captions are less consistent — and harder still when the speaker mixes languages, or when the only "captions" on offer are machine translations. This guide explains how to get an accurate transcript in the language that was actually spoken, and how to handle the common complications.

## Start with the right goal

Be clear which of these you want:

1. **A transcript in the original language** — the speaker's own words, in their script. This is what you need for language learning, quoting and research.
2. **A translation** — the content in another language. Useful for understanding, but it's a different document.
3. **Both, side by side** — the original with a translation alongside to check meaning.

Many problems come from accidentally getting (2) when you wanted (1).

## Understanding the caption tracks on a video

A single video can offer several tracks:

- **Creator-uploaded captions** in one or more languages.
- **Auto-generated captions** in the spoken language, if YouTube supports auto-captioning for it.
- **Auto-translated captions** — YouTube can machine-translate a track into many other languages on the fly.

To check what's available, click the gear icon in the player, then **Subtitles/CC**. Tracks labelled "auto-generated" are speech recognition output; options under "Auto-translate" are machine translations. [Understanding Transcript Languages, Tracks and Timestamps](/guides/understanding-transcript-languages-and-timestamps) covers the labels in detail.

## Method 1: Original-language mode in Transcriptly

1. Paste the video link on the [Transcriptly home page](/).
2. Leave the language setting on **original** (the default).
3. Click **Get Transcript** and check the language label on the result.

In original mode, Transcriptly tries to find the track in the language actually spoken:

- It looks at the script of the **video title** (for example, Bengali, Devanagari or Arabic script) as a hint about the spoken language, and looks for a matching track.
- It prefers **creator-uploaded** captions over auto-generated ones.
- If the only available track is an auto-generated one in a language that conflicts with the title's script — for instance, English auto-captions on a video with a Bangla title — it treats original captions as unavailable rather than handing you text that's probably wrong.

The label on the result tells you which language and which kind of track you got.

## Method 2: Translation mode

If you want the content in another language, choose a **target language** instead of original mode. Transcriptly supports translation into Bangla, English, Hindi, Arabic, Urdu, Spanish, French, German, Japanese, Portuguese, Russian and Chinese.

- When YouTube can provide its own translated version of the caption track, Transcriptly uses that.
- Otherwise, it translates the original segments with a general-purpose machine translation service.
- The **Side-by-Side** view shows original and translated paragraphs together.

Treat translations as aids to understanding. They regularly mistranslate idioms, names, technical terms and dialect. For anything important, translate key passages yourself or have them checked by a fluent speaker.

## Method 3: Speech recognition when there are no captions

If a video has no captions in its spoken language, speech recognition is the remaining option. Transcriptly's servers can optionally run faster-whisper, an efficient version of the open-source Whisper model, on the video's audio:

- On the home page, choose **Transcribe with Speech-to-Text** when it's offered.
- Processing takes longer than caption extraction and is limited to shorter videos (30 minutes by default).
- It runs a small model to keep processing practical, so expect more errors than in good captions — especially for less widely spoken languages, strong regional accents and noisy audio.

Whisper detects the spoken language automatically. For short clips or mixed-language audio, that detection can be wrong; if the result is in the wrong language or script, that's the likely reason. [YouTube Auto Captions vs Whisper](/guides/youtube-auto-captions-vs-whisper) explains its strengths and weaknesses.

## Method 4: Your own subtitle file

If you've obtained captions elsewhere — from the creator, a course platform, or a subtitle editor — you can upload a `.srt`, `.vtt` or `.txt` file, or paste text, on the home page under **Upload / Paste Subtitles**. Transcriptly will format it into readable paragraphs. This is also the way to bring a corrected transcript back in.

## Handling mixed-language speech

Code-switching — moving between languages within a conversation or sentence — is very common, for example Bangla or Hindi speakers mixing in English. Expect:

- **Inconsistent scripts.** English words may appear in Latin letters or transliterated into the main script, sometimes both in the same transcript.
- **Recognition errors at switch points.** Speech recognition systems often struggle exactly where the language changes.
- **Odd translations.** Machine translation may mishandle mixed sentences.

For study or research, decide on a convention (for example, "keep English words in Latin script") and apply it when you correct the transcript.

## Script and encoding tips

- All Transcriptly exports are **UTF-8**, which supports every script. If text looks garbled after opening a file, reopen it with UTF-8 encoding.
- Right-to-left scripts (Arabic, Urdu, Persian, Hebrew) display correctly in modern browsers and editors, but lines mixing right-to-left and left-to-right text can look jumbled. That's a display issue, not a corruption of the text.
- PDF exports of saved books embed Bangla fonts so conjunct characters render correctly.

## A checklist for any non-English video

1. Check the CC menu: is there a creator track in the spoken language?
2. Extract in original mode and confirm the language label.
3. If the result is an auto-generated track, skim for obvious errors before relying on it.
4. If you need a translation, use translation mode and keep the original alongside.
5. If there are no captions, try speech-to-text and check the detected language.
6. Correct what you'll quote or study closely — see [How to Fix Incorrect YouTube Captions](/guides/how-to-fix-incorrect-youtube-captions).

## Frequently asked questions

### Why did I get an English transcript for a video in another language?

Usually because the video's only track was English — sometimes a creator uploads English subtitles for a non-English video. Those are a translation by the creator, not a transcript of the speech. Check the CC menu.

### Can Transcriptly translate into any language?

It translates into the list of languages shown above. YouTube's own auto-translate may offer more options directly in the player.

### Which languages work with speech-to-text?

Whisper was trained on around a hundred languages, but quality varies widely. Widely spoken languages with lots of training data work best.

## Related guides

- [How to Learn Bangla Vocabulary Through Video Content](/guides/how-to-learn-bangla-vocabulary-through-video)
- [How to Study Hindi and Arabic Through Video Transcripts](/guides/how-to-study-hindi-and-arabic-through-video-transcripts)
- [How Automatic Speech Recognition Works](/guides/how-automatic-speech-recognition-works)
