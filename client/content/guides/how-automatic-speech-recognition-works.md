Automatic speech recognition (ASR) is the technology that turns spoken audio into text. It produces YouTube's auto-captions, dictation on your phone, voice assistants and meeting transcripts. You don't need to understand the mathematics to use transcripts well, but knowing roughly how ASR works explains a lot: why it gets names wrong, why music confuses it, why some languages are served far better than others, and why a confident-looking transcript can still contain errors. This is a plain-language tour.

## The problem ASR has to solve

Speech is much messier than text:

- **No gaps between words.** In a recording, words run together. "Ice cream" and "I scream" can sound identical.
- **Huge variation.** Accent, speed, pitch, emotion, microphone and room all change the sound of the same word.
- **Background noise and overlap.** Music, traffic and other speakers mix into the signal.
- **Ambiguity.** "Their", "there" and "they're" sound the same; only context tells them apart.

An ASR system has to find the most likely sequence of words given a sound wave — while handling all of this.

## Step 1: From sound wave to features

A microphone records air pressure changes as a stream of numbers — typically 16,000 per second for speech recognition. That raw stream is too detailed and too noisy to use directly.

So the audio is cut into short overlapping windows (around 25 milliseconds each, moving forward about 10 milliseconds at a time) and each window is converted into a set of numbers describing which frequencies are present. A common representation is the **log-Mel spectrogram**: a picture of the audio with time on one axis and frequency on the other, with frequencies spaced the way human hearing perceives them (we're more sensitive to differences at low frequencies than at high ones).

You can think of the spectrogram as a "sound image" that the rest of the system reads.

## Step 2: Classic ASR — three separate models

For decades, ASR systems were built from separate components:

1. **Acoustic model** — given a slice of audio features, how likely is each speech sound (phoneme)?
2. **Pronunciation dictionary** — which sequences of phonemes make which words? (*cat* = /k/ /æ/ /t/.)
3. **Language model** — given the words so far, how likely is the next word? ("I'd like a cup of…" → *tea* is more likely than *tee*.)

A **decoder** searched through combinations of these to find the most probable sentence. This design worked, but each part had to be built separately, and the pronunciation dictionary was a weak point: any word not in it — a new product name, a person's name — couldn't be recognised at all.

## Step 3: Modern end-to-end models

Most current systems, including OpenAI's Whisper, are **end-to-end neural networks**: one large model learns to map audio features directly to text.

Whisper, for example, uses an **encoder–decoder transformer**:

- The **encoder** reads the whole spectrogram for a chunk of audio (Whisper processes 30-second windows) and builds an internal representation of what was said.
- The **decoder** generates text one piece at a time, each time looking at the encoder's representation and at the text produced so far.

Instead of whole words, the model outputs **tokens** — common words and fragments of rarer words. That means it can spell out a word it has never seen as a whole, by combining fragments, which helps with names (though it often still guesses the spelling wrong).

Because the model is trained on audio paired with real transcripts, it learns acoustics, vocabulary, grammar, punctuation and capitalisation all at once. The "language model" is no longer separate; it's part of the same network.

## Step 4: Training

An end-to-end model learns by example: it's shown a huge amount of audio with matching transcripts, and its internal parameters are adjusted, step by step, to make its output closer to the correct text.

Two consequences matter for users:

- **Quality follows data.** Languages, accents and topics that are well represented in training data are recognised much better. Languages with less available transcribed audio — many South Asian and African languages, for instance — typically see higher error rates.
- **The model learns the habits of its training transcripts.** If training transcripts included punctuation, so will the output. If they sometimes contained text that wasn't spoken (for example, subtitle credits), the model may occasionally produce that too.

## Step 5: Decoding — choosing the final text

At each step, the model gives probabilities for many possible next tokens. Decoding chooses among them:

- **Greedy decoding** takes the single most likely token each time. It's fast but can paint itself into a corner.
- **Beam search** keeps several candidate transcripts alive at once (the "beam") and picks the best complete one. It's slower but usually more accurate. (Transcriptly's speech-recognition fallback uses a beam of five.)

Systems also add **voice activity detection (VAD)** to skip silence and non-speech sections before recognition. This saves time and reduces a known problem: given silence or music, some models invent text.

## Step 6: Timestamps and formatting

Finally, the text is aligned with time. Systems output segments with start and end times, which become caption cues. Some systems add punctuation and capitalisation as a separate step; end-to-end models like Whisper usually produce them directly.

For displaying on YouTube, captions are then cut into short cues that fit on screen — which is why caption text needs re-assembling before it reads like prose. [How Sentence Splitting Works in Multilingual Transcription](/guides/how-sentence-splitting-works-in-multilingual-transcription) explains that process.

## Why ASR makes the errors it does

Understanding the pipeline explains the common mistakes:

| Error | Why it happens |
| --- | --- |
| Names and jargon misspelled | Rare in training data; the model picks a common word that sounds similar |
| Homophones swapped (their/there) | The acoustic signal is identical; context wasn't strong enough |
| "can" vs "can't" confused | The final /t/ is often barely pronounced |
| Words dropped in fast speech | Sounds merge; the model can't separate them |
| Text during music or silence | Model generates plausible text where none exists (hallucination) |
| Wrong language on short clips | Too little audio to identify the language confidently |
| Worse results for some accents | Under-represented in training data |

None of these are signs of a broken system; they're built into how statistical recognition works. That's why transcripts you rely on should be checked — see [How to Fix Incorrect YouTube Captions](/guides/how-to-fix-incorrect-youtube-captions).

## How accuracy is measured

The standard metric is **word error rate (WER)**: the number of substituted, deleted and inserted words divided by the number of words in a correct reference transcript. For languages without spaces between words, **character error rate** is used instead. WER is useful, but it treats all errors equally — mishearing "um" counts the same as mishearing a drug name. [YouTube Auto Captions vs Whisper](/guides/youtube-auto-captions-vs-whisper) includes a step-by-step method to measure WER on your own videos.

## Where Transcriptly fits

Transcriptly mainly uses existing caption tracks, which are produced either by the creator or by YouTube's own ASR. When a video has no captions, its servers can run **faster-whisper**, an efficient implementation of Whisper, as an optional fallback, with voice activity detection enabled. The transcript always records which method produced it.

## Frequently asked questions

### Does ASR understand what it transcribes?

Not in a human sense. It models which words are likely given the sound and the surrounding words. That's why it can produce grammatical sentences that are wrong.

### Why is ASR better in English than in my language?

Mostly because of training data. Languages with more transcribed audio available tend to get better recognition.

### Can ASR identify different speakers?

That's a separate task called **speaker diarisation**. Some systems include it; YouTube captions and Transcriptly's transcripts don't label speakers.

## Related guides

- [YouTube Auto Captions vs Whisper: Accuracy, Differences and Limitations](/guides/youtube-auto-captions-vs-whisper)
- [How to Transcribe Videos in Different Languages](/guides/how-to-transcribe-videos-in-different-languages)
- [Understanding Transcript Languages, Tracks and Timestamps](/guides/understanding-transcript-languages-and-timestamps)
