If you've worked with video transcripts for a while, you'll have met two very different kinds of machine-generated text: YouTube's automatic captions, and output from Whisper, the open-source speech recognition model released by OpenAI in 2022. They're often compared, and claims about which is "more accurate" are easy to find. This article explains how the two differ in design and behaviour, where each tends to fail, and how to measure accuracy on your own videos rather than relying on general claims.

> [!note] **What this article does and doesn't contain.** It describes design differences and commonly observed behaviour, and gives a reproducible test method. It does not publish accuracy figures: we haven't run a controlled benchmark ourselves, and published numbers from others depend heavily on the test audio. Where something is a general observation rather than a documented fact, we say so.

## The two systems at a glance

| | YouTube auto-captions | Whisper |
| --- | --- | --- |
| Who runs it | Google, on YouTube's servers | Anyone — open-source model weights |
| When it runs | Automatically after upload (for supported languages) | Whenever you run it on an audio file |
| Model details | Not publicly documented in detail | Published paper and code |
| Output | Timed caption cues | Timed segments with punctuation |
| Punctuation & capitals | Varies; often sparse | Usually included |
| Languages | A list of supported languages that has grown over time | Trained on ~100 languages; quality varies widely by language |
| Cost to you | Free, already there | Free software, but needs computing power |
| Model sizes | Not applicable | Several, from *tiny* to *large*; larger is slower and usually more accurate |

## How YouTube auto-captions work (what's known)

YouTube generates automatic captions with Google's speech recognition. Google hasn't published the full details of the current system, so specifics are limited, but some behaviour is visible to anyone:

- **Captions are produced per video, after upload,** and only for languages YouTube supports for auto-captioning. New uploads can take a while to get them.
- **Output is designed for on-screen display:** short cues, often with little punctuation, and on many videos without consistent capitalisation.
- **Rolling captions overlap.** Consecutive cues frequently repeat words, because captions were designed to scroll. (Transcriptly removes these overlaps when building paragraphs — see [How Sentence Splitting Works](/guides/how-sentence-splitting-works-in-multilingual-transcription).)
- **Creators can replace or correct them,** and when they do, YouTube shows the creator's track separately from the auto-generated one.

## How Whisper works

Whisper is an end-to-end neural network: it takes audio and directly outputs text. According to its published paper, it was trained on a very large amount of audio paired with transcripts collected from the web, covering many languages, and it's trained to do several tasks — transcription, translation into English, language identification and timestamping — with one model.

Some consequences of that design:

- **Punctuation and capitalisation come "for free"**, because the training transcripts contained them. Whisper output usually reads more like written text.
- **It can identify the language** of the audio itself.
- **It's robust to many accents and recording conditions**, because of the diversity of its training data — though "robust" doesn't mean error-free.
- **It can hallucinate.** Whisper is known to sometimes produce fluent text that wasn't spoken, especially during silence, music or noise, or to repeat a phrase in a loop. This is a well-documented failure mode, and tools that run Whisper often add voice-activity detection to skip non-speech audio for this reason.
- **Accuracy depends strongly on model size and language.** Smaller models are faster but make more mistakes; quality for lower-resource languages is generally well below that for English.

## Where each tends to struggle

These are general observations, not measured results; your videos may behave differently.

**Both systems commonly struggle with:**

- Proper nouns, brand names and technical vocabulary.
- Overlapping speakers and cross-talk.
- Heavy background music or noise.
- Code-switching between languages mid-sentence.
- Numbers ("fifteen" vs "fifty"), and short words like "can" vs "can't".

**YouTube auto-captions:** often sparse punctuation, which makes the text hard to read as prose; rolling duplicates; no captions at all for unsupported languages or some videos.

**Whisper:** hallucinated or repeated text in silent or musical passages; occasional mis-identification of the language on short or mixed clips; slower and computationally heavier, especially with larger models.

## How Transcriptly uses them

Transcriptly prefers existing captions, because they're fast and, when creator-uploaded, often the most accurate option. It picks the original-language track and prefers creator captions over auto-generated ones.

When a video has no captions, Transcriptly's servers can optionally run **faster-whisper** — an efficient re-implementation of Whisper — on the video's audio, with voice-activity filtering enabled to reduce hallucination in non-speech sections. This fallback is limited in video length and depends on server availability, and it runs a small model to keep processing time reasonable. That means its accuracy will generally be lower than published results for the largest Whisper models. The transcript records which method produced it, so you always know whether you're reading captions or speech-to-text output.

## How to measure accuracy yourself

The standard measure is **word error rate (WER)**:

```
WER = (S + D + I) / N
```

where *S* is the number of substituted words, *D* deleted words, *I* inserted words, and *N* the number of words in a correct reference transcript. A WER of 0.10 means roughly one error per ten reference words. Lower is better.

### A reproducible test

1. **Choose test clips.** Pick several 2–3 minute clips that represent what you actually transcribe: your languages, accents, audio quality. Include at least one difficult clip (noise, fast speech).
2. **Make reference transcripts.** Transcribe each clip carefully by hand, listening as many times as needed. This is the slow part, and the quality of your test depends on it. Ideally, have a second person check it.
3. **Get the hypotheses.** Export the YouTube auto-caption track for each clip (Transcriptly's TXT or JSON export works) and run Whisper on the same audio, noting the model size and settings.
4. **Normalise the text.** Before comparing, lower-case everything, remove punctuation, and standardise numbers ("15" vs "fifteen") the same way for all three texts. Otherwise you'll be measuring punctuation style, not recognition.
5. **Compute WER.** Use an established implementation rather than counting by hand — for example the `jiwer` Python package:

```python
import jiwer

reference = open("clip1_reference.txt", encoding="utf-8").read()
youtube = open("clip1_youtube.txt", encoding="utf-8").read()
whisper = open("clip1_whisper.txt", encoding="utf-8").read()

normalise = jiwer.Compose([
    jiwer.ToLowerCase(),
    jiwer.RemovePunctuation(),
    jiwer.RemoveMultipleSpaces(),
    jiwer.Strip(),
])

for name, hyp in [("YouTube", youtube), ("Whisper", whisper)]:
    print(name, round(jiwer.wer(normalise(reference), normalise(hyp)), 3))
```

6. **Look at the errors, not just the score.** A WER difference of a few points may matter less than *which* words are wrong. One misheard drug name can matter more than ten dropped "um"s.
7. **Record conditions.** Note the date, Whisper model and settings, and which caption track you used. Both systems change over time.

### Interpreting results

- **WER for languages without spaces** (such as Chinese or Japanese) is usually replaced by character error rate.
- **Small samples are noisy.** A few minutes of audio can tell you about *your* material, but not about either system in general.
- **Readability isn't measured by WER.** Whisper's punctuation may make it much easier to read even at a similar WER.

## Which should you use?

- **If the video has creator-uploaded captions,** use them.
- **If it has only auto-captions,** they're usually a reasonable starting point; correct the parts you rely on.
- **If there are no captions,** speech recognition like Whisper is the practical option.
- **For anything you'll quote or publish,** verify against the audio whatever the source. See [How to Fix Incorrect YouTube Captions](/guides/how-to-fix-incorrect-youtube-captions).

## Frequently asked questions

### Is Whisper always more accurate than YouTube captions?

No. It depends on the language, audio, speakers and model size. That's why a test on your own material is worth more than a general claim.

### Can I run Whisper myself?

Yes. Whisper and faster-whisper are open-source. You'll need some technical setup, and larger models need significant memory and benefit from a GPU.

### Why do Whisper transcripts sometimes repeat a sentence many times?

That's a known failure mode of the model, especially on silence or music. Voice-activity detection and careful settings reduce it.

## Related guides

- [How Automatic Speech Recognition Works](/guides/how-automatic-speech-recognition-works)
- [How to Transcribe Videos in Different Languages](/guides/how-to-transcribe-videos-in-different-languages)
- [How to Fix Missing or Unavailable YouTube Captions](/guides/how-to-fix-missing-unavailable-captions)
