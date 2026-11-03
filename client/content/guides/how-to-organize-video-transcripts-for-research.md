If you study video sources seriously — interviews, lectures, hearings, talks, documentaries — you quickly accumulate dozens or hundreds of transcripts. Without a system, you lose track of which version you corrected, which quote came from where, and whether a transcript came from creator captions or a rough auto-caption track. This guide sets out a lightweight system for managing a transcript collection with research-grade rigour: provenance, naming, versions, coding and citation.

## The three things a research collection must preserve

1. **Provenance** — where each transcript came from, when, and how it was produced.
2. **Integrity** — the original text, kept unchanged, alongside any corrections.
3. **Traceability** — the ability to go from any quote in your work back to a moment in a video.

Everything below serves one of these.

## 1. Folder structure

Keep it flat and predictable:

```
project-name/
  index.csv            ← one row per source video
  raw/                 ← exports exactly as downloaded, never edited
  corrected/           ← your corrected versions
  notes/               ← memos, coding, evidence cards
  log.md               ← dated research log
```

The separation between `raw/` and `corrected/` is the single most important rule. You must always be able to show what the captions said before you touched them.

## 2. The index

The index is a spreadsheet (saved as CSV so it's readable anywhere) with one row per video. Suggested columns:

| Column | Example | Why |
| --- | --- | --- |
| `id` | `V014` | Short stable reference for notes and filenames |
| `title` | Panel on rural broadband | Human-readable |
| `speakers` | A. Rahman; J. Lee | Captions rarely identify speakers |
| `channel` | Example Policy Forum | Source attribution |
| `url` | youtube.com/watch?v=… | Verification |
| `upload_date` | 2025-05-14 | Citation; context |
| `accessed` | 2026-10-28 | When you extracted it |
| `duration` | 01:12:40 | Planning |
| `language` | bn | Original language |
| `caption_type` | creator / auto / speech-to-text | Accuracy expectations |
| `status` | raw / corrected / coded | Progress |
| `notes` | Audio poor 40:00–45:00 | Caveats |

`caption_type` matters for interpretation: creator-uploaded captions have usually been reviewed, auto-generated ones have not, and speech-to-text output has its own error profile.

## 3. Extracting with provenance

For each video:

1. Extract on the [Transcriptly home page](/) in original-language mode, so you get the speaker's words rather than a translation. Use the [Chrome extension](/guides/how-to-use-chrome-extension) if the site reports YouTube blocking.
2. Export **JSON** into `raw/`. The JSON includes the video ID, detected language, whether the captions were auto-generated, the method used, every timed segment, and the list of other available caption tracks — exactly the provenance you need.
3. Export **TXT** into `raw/` as well, for reading and searching.
4. Name both files with the index ID: `V014_raw.json`, `V014_raw.txt`.
5. Fill in the index row immediately.

[SRT vs TXT vs JSON](/guides/srt-vs-txt-vs-json-transcript-formats) describes the contents of each export.

## 4. Correcting with a paper trail

When you correct a transcript:

- Copy the raw file into `corrected/` as `V014_corrected.txt` and edit only the copy.
- Correct against the audio, not from memory or assumption.
- Mark uncertain passages rather than guessing: `[inaudible 32:15]`, `[unclear: "fiscal"? 32:20]`.
- Add speaker labels if your analysis needs them: `RAHMAN:`, `LEE:`.
- Note in the index what kind of correction you did (full pass, spot-check of quoted passages only, etc.).

If you're comfortable with it, putting the project folder under version control (for example, Git) gives you an automatic history of every change. A simpler alternative is to never overwrite a corrected file — save `V014_corrected_v2.txt` instead.

[How to Fix Incorrect YouTube Captions](/guides/how-to-fix-incorrect-youtube-captions) has techniques for correcting efficiently.

## 5. Coding and analysis

For qualitative analysis, you'll often apply codes (themes) to passages. Whatever tool you use — a dedicated qualitative analysis program, a spreadsheet, or tagged notes — keep a reference from every coded passage back to `id` + timestamp:

```
V014  12:34–13:10  [cost-barriers] "most households here simply can't..."
V021  05:02–05:40  [cost-barriers] [infrastructure] "the last mile is..."
```

Timestamps are the bridge between your analysis and the source. Paragraph text alone doesn't have them, which is why the JSON export (with segment start times) belongs in `raw/`.

## 6. Citing

When you cite a video, include the speaker, title, channel, platform, upload date, URL and timestamp. Follow your discipline's style guide for the exact format. If you corrected the captions, your quote should reflect what was said in the audio; if you're quoting a translation, say who translated it.

[How to Research More Efficiently with Video Transcripts](/guides/how-to-research-efficiently-with-video-transcripts) covers screening, quoting and citation practice in more depth.

## 7. Multilingual collections

For sources in several languages:

- Record the original language in the index and keep the original-language transcript as the primary source.
- Store translations separately (`V014_translation_en.txt`) and record how they were produced. Machine translation — including Transcriptly's translation mode — is useful for understanding, but shouldn't be presented as a faithful translation in published work without checking.
- Be aware that some languages are poorly served by auto-captions; for these, the `caption_type` and correction notes matter even more. See [How to Transcribe Videos in Different Languages](/guides/how-to-transcribe-videos-in-different-languages).

## 8. Ethics and storage

- **Consent and context.** Publicly posted videos still have people in them. Consider how you quote private individuals, especially in sensitive contexts.
- **Copyright.** Collecting transcripts for analysis is different from redistributing them. Don't publish full transcripts unless you have the right to.
- **Storage.** Keep the project in a backed-up location, and follow your institution's data management rules if your project has them.

## A minimal version for small projects

If the full system is too much for a short project, keep just three things: an index with URL, upload date and caption type; raw exports that you never edit; and timestamps on every quote.

## Frequently asked questions

### Should I keep transcripts in Transcriptly or in files?

Both have a role. Your Transcriptly library is good for reading and searching titles; the exported files in your project folder are the research record, because you control them.

### How do I handle videos that are later deleted?

Your raw exports remain your record of the text. Note the deletion and date in the index. If possible, look for an archived copy to cite alongside.

### Is auto-generated text acceptable as research data?

It can be, as long as you report it and check passages you rely on. For close linguistic or discourse analysis, a full correction pass against the audio is usually necessary.
