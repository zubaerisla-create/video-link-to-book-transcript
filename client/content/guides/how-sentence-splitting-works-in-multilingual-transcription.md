Captions don't arrive as sentences. They arrive as short, timed fragments sized to fit on a screen — sometimes overlapping, sometimes repeating, often with little punctuation. Turning those fragments into readable paragraphs is a small but surprisingly subtle problem, and it gets harder when the text isn't in English. This article explains how the process works in Transcriptly, step by step, including the rules for Bangla, Hindi, Arabic and Urdu scripts, and the places where any automatic approach has limits.

## What raw captions look like

A caption track is a list of segments, each with text, a start time and a duration (in seconds):

```
{ "text": "so the first thing to",          "start": 12.04, "duration": 2.10 }
{ "text": "the first thing to understand",  "start": 13.10, "duration": 2.30 }
{ "text": "understand is that memory",       "start": 14.40, "duration": 2.00 }
{ "text": "is not a recording.",             "start": 16.40, "duration": 1.80 }
```

Notice three problems:

1. **Fragments.** One sentence is spread over four segments.
2. **Overlap.** Auto-generated captions "roll": each new segment repeats the end of the previous one. Joining them naively gives "so the first thing to the first thing to understand understand is that memory…".
3. **Timing overlap.** The second segment starts (13.10) before the first one ends (12.04 + 2.10 = 14.14). That's the signature of rolling captions.

The goal is: *So the first thing to understand is that memory is not a recording.* — with nothing added, removed or reworded.

## Step 1: Clean each segment

Each segment's text is normalised before anything else:

- HTML entities are decoded (`&amp;` → `&`, `&#39;` → `'`).
- Line breaks and non-breaking spaces become ordinary spaces.
- Runs of whitespace collapse to one space.

Nothing else changes. Characters in every script — Bengali, Devanagari, Arabic, Latin — pass through untouched.

## Step 2: Remove rolling overlaps

For each segment, Transcriptly compares the **last few words of the previous segment** with the **first few words of the current one** (up to six words), ignoring case and surrounding punctuation, including the Bengali and Devanagari full stop (।), the Arabic question mark (؟) and the Urdu full stop (۔).

If the end of one matches the start of the next, the repeated words are dropped from the current segment:

```
previous:  "the first thing to understand"
current:   "understand is that memory"
overlap:   "understand"
kept:      "is that memory"
```

The longest overlap is checked first, so a six-word repetition is caught before a one-word one.

### When repetition is real

People genuinely repeat themselves: "very, very important", or a speaker restating a phrase for emphasis. Removing every repetition would delete real speech. So there's a safeguard: if a whole segment is identical to the end of the previous one, it's only treated as a duplicate when the two segments **overlap in time** — the hallmark of rolling captions. If the previous segment had already finished before the current one started, the repetition is kept as genuine speech.

This isn't perfect — no automatic rule is — but it errs towards keeping words rather than losing them.

## Step 3: Find sentence boundaries

A sentence boundary is recognised when text ends with a **terminal punctuation mark**. Transcriptly recognises marks from several writing systems:

| Mark | Name | Used in |
| --- | --- | --- |
| `.` `!` `?` | Full stop, exclamation, question mark | English, Spanish, French and many others |
| `।` | দাঁড়ি / पूर्ण विराम (dari / purna viram) | Bangla, Hindi and other Indic languages |
| `॥` | Double danda | Verse and some religious texts in Indic scripts |
| `؟` | Arabic question mark | Arabic, Urdu, Persian |
| `۔` | Urdu full stop | Urdu |

This is why a Bangla transcript with proper দাঁড়ি punctuation is split into paragraphs at sentence ends rather than mid-sentence, even though it contains no Latin full stops.

## Step 4: Decide where paragraphs break

Segments are added to the current paragraph one by one. Before adding each segment, Transcriptly decides whether to start a new paragraph. A break happens when:

1. **There's a long pause *and* the previous text ended a sentence.** A gap between segments suggests a change of thought, but only if the paragraph already has at least 20 words — so a brief hesitation doesn't create a one-line paragraph.
2. **The paragraph has reached its target length *and* the previous text ended a sentence.** This keeps paragraphs readable without cutting sentences in half.
3. **The paragraph has reached its maximum length**, regardless of punctuation. This is the safety valve for unpunctuated captions; without it, a transcript with no full stops would become one enormous paragraph.

The thresholds depend on the paragraph length you choose:

| Setting | Target words | Maximum words | Pause that suggests a break |
| --- | --- | --- | --- |
| Short | 50 | 80 | 1.6 seconds |
| Medium | 100 | 160 | 2.2 seconds |
| Long | 180 | 260 | 3.0 seconds |

Longer settings also require a longer pause before breaking, so long paragraphs aren't fragmented by ordinary hesitations.

Finally, stray spaces before punctuation are tidied ("memory ." → "memory."), for both Latin and non-Latin marks.

## Step 5: Keep the timed segments too

The cleaned segments, with their original start times, are kept alongside the paragraphs. That's what powers the **Timestamped** view and the SRT export, and it means you can always trace a paragraph back to the moment in the video. See [SRT vs TXT vs JSON](/guides/srt-vs-txt-vs-json-transcript-formats).

## What the process deliberately doesn't do

- **It doesn't add punctuation.** If a caption track has no full stops, Transcriptly doesn't guess where sentences end; it falls back to the maximum-length rule. Adding punctuation automatically would require a language model that might change meaning.
- **It doesn't rewrite.** Fillers, false starts and informal grammar stay as spoken.
- **It doesn't identify speakers.** Caption tracks rarely contain speaker labels, so paragraph breaks are about timing and punctuation, not who's talking.

## Why multilingual splitting is harder than it looks

Some challenges are specific to non-English text:

- **Word counting differs by script.** Word counts here are based on spaces. That works well for Bangla, Hindi, Arabic and Urdu, which separate words with spaces, but languages like Chinese, Japanese and Thai don't use spaces between words, so word-based thresholds behave differently for them.
- **Abbreviations and decimals.** A full stop in "Dr." or "3.5" isn't a sentence end. The rules above only look at the last character of a segment, which avoids most mid-sentence false positives, but an abbreviation at the end of a segment can still trigger a break.
- **Mixed scripts.** In code-mixed speech, one sentence may contain Bangla and English words with either kind of punctuation. Recognising all marks together handles this naturally.
- **Right-to-left text.** Arabic and Urdu are processed as text in logical order; direction only matters at display time, where the browser handles it.

## Seeing it in action

Try the same video with each paragraph setting on the [Transcriptly home page](/). Short paragraphs are easier to scan on a phone; long ones read like a book. If you're reading a Bangla, Hindi or Arabic video, notice that paragraphs end at the language's own sentence marks.

## Frequently asked questions

### Why did one of my paragraphs end mid-sentence?

Usually because the captions had no punctuation in that stretch, so the maximum-length rule applied. Creator-uploaded captions, which are usually punctuated, give the best paragraphs.

### Could the de-duplication remove a word the speaker actually repeated?

It's possible in rare cases where a speaker repeats words exactly at a segment boundary in overlapping captions. The time-overlap safeguard prevents most of these. For quotes, always check the audio.

### Is the same process used for speech-recognition transcripts?

Yes. Speech-recognition output is formatted with the same rules, and because models like Whisper usually add punctuation, the sentence-based breaks work especially well.

## Related guides

- [How Automatic Speech Recognition Works](/guides/how-automatic-speech-recognition-works)
- [How to Copy, Format and Save YouTube Captions](/guides/how-to-copy-and-save-youtube-captions)
- [How to Learn Bangla Vocabulary Through Video Content](/guides/how-to-learn-bangla-vocabulary-through-video)
