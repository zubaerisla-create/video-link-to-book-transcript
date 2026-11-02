You paste a link, and instead of a transcript you get a message that captions aren't available. Sometimes the video genuinely has none. Sometimes it has captions but they can't be reached from where the request was made. This guide goes through every common cause, how to tell which one you're facing, and what you can do in each case.

> [!tip] If you *do* get a transcript but it's full of mistakes, that's a different problem — see [How to Fix Incorrect YouTube Captions](/guides/how-to-fix-incorrect-youtube-captions).

## First: check the video on YouTube

Open the video in a desktop browser and look at two things:

1. **The CC button** in the player. If it's missing or greyed out, YouTube has no caption track for the video.
2. **The transcript panel.** Click **...more** under the video, scroll down and look for **Show transcript**. If it's there and opens with text, captions exist.

This tells you which half of the guide applies:

- **No captions on YouTube either** → the video genuinely has none. See *Causes on YouTube's side*.
- **Captions visible on YouTube, but Transcriptly can't get them** → it's an access problem. See *Access and blocking problems*.

## Causes on YouTube's side

### The uploader disabled or never added captions

Creators can choose not to publish captions, and auto-captions aren't generated for every video. There's nothing a viewer can do to enable them.

**What to do:** use speech-to-text (below), look for another video covering the same content, or ask the creator.

### The video is very new

Auto-captions are generated after upload and can take some time to appear, longer for long videos.

**What to do:** try again later.

### The language isn't supported for auto-captions

YouTube auto-generates captions for a set of supported languages. Videos in other languages — or in regional varieties the system doesn't recognise — may have no auto-captions at all.

**What to do:** speech-to-text, or creator captions if the channel provides them. [How to Transcribe Videos in Different Languages](/guides/how-to-transcribe-videos-in-different-languages) covers the options.

### The audio is mostly music or noise

Music videos, ambient footage and videos with very little speech often have no captions, or nearly empty ones. Transcriptly reports an empty transcript in this case.

**What to do:** if there's no real speech, there's nothing to transcribe.

### It's a live stream

Live captions during a stream aren't the same as a finished caption track. After a stream ends, captions may appear once YouTube processes the recording.

**What to do:** wait until the stream has ended and been processed.

### The video is private, removed, age-restricted or region-locked

Transcriptly only works with publicly viewable videos. It reports when a video is unavailable or restricted, because the caption track can't be reached.

**What to do:** nothing, in most cases. Age-restricted and region-locked videos can't be processed.

### Only a translated track exists

Some videos have captions only in another language — for example, English subtitles on a Bangla video. In original-language mode, Transcriptly doesn't present these as a transcript of the speech, because they're a translation. If a video's only track is an auto-generated one in a language that clashes with the video title's script, it treats original captions as unavailable rather than give you probably-wrong text.

**What to do:** if a translation is fine for your purpose, choose that language as a target in translation mode.

## Access and blocking problems

If captions are visible on YouTube but Transcriptly can't fetch them, the cause is usually on the network side.

### YouTube blocked or rate-limited the request

YouTube limits automated requests, and it's especially strict with requests coming from data-centre servers rather than home connections. When that happens, Transcriptly shows a message that YouTube blocked or rate-limited the request, or that the server is temporarily busy.

**What to do:** use the **[Transcriptly Chrome extension](/guides/how-to-use-chrome-extension)**. It reads the transcript panel in your own browser — where YouTube is showing the captions to you as a normal viewer — and sends it to Transcriptly. Because the captions are read in your browser rather than fetched by our server, server-side blocking doesn't apply. Alternatively, wait a while and try again.

### Temporary upstream problems

Occasionally YouTube's caption service is slow or returns errors. Transcriptly will tell you the upstream service was unavailable.

**What to do:** try again in a few minutes.

### The link isn't a valid video link

Transcriptly accepts standard watch links, `youtu.be` short links, Shorts, live and embed links. Playlist links, channel pages and search results won't work.

**What to do:** open the specific video and copy its URL.

## Option: speech-to-text when there are no captions

When a video has no captions at all, Transcriptly can, where enabled, transcribe the audio itself with faster-whisper, an efficient version of the open-source Whisper speech recognition model.

1. Paste the link on the [home page](/).
2. If captions aren't available, choose **Transcribe with Speech-to-Text** when it's offered.
3. Wait — it takes longer than caption extraction, since the audio has to be processed.

Limitations to know about:

- It's limited to shorter videos (30 minutes by default).
- It uses a small model so processing stays practical, so expect more errors than good captions, especially for strong accents, noisy audio and less widely spoken languages.
- It needs the server to download the audio, which can be blocked by YouTube in the same way as caption requests.
- Audio files are deleted after processing.

[YouTube Auto Captions vs Whisper](/guides/youtube-auto-captions-vs-whisper) explains what to expect from speech recognition.

## Option: upload a subtitle file you already have

If you have captions from another source — the creator, a course platform, or a file you made — upload the `.srt`, `.vtt` or `.txt` file, or paste the text, under **Upload / Paste Subtitles** on the home page.

## Quick diagnosis table

| What you see | Most likely cause | Best next step |
| --- | --- | --- |
| No CC button on YouTube | No captions exist | Speech-to-text or another video |
| CC works on YouTube, Transcriptly reports blocking or rate limit | Server-side blocking | Chrome extension |
| "Video unavailable" or restricted | Private, removed, age- or region-restricted | Not possible to process |
| Empty transcript | Little or no speech | Nothing to transcribe |
| Only a foreign-language track | Creator uploaded a translation | Use translation mode if acceptable |
| New upload, no captions yet | Still processing | Try later |

## Frequently asked questions

### Why does YouTube show captions to me but Transcriptly can't get them?

Because the requests come from different places. Your browser is a normal viewer; Transcriptly's server is a data-centre machine, which YouTube restricts more heavily. The Chrome extension uses your browser's view instead.

### Is the Chrome extension safe?

It only reads the transcript panel on the YouTube tab you're using, and only when you click it. See [How to Install and Use the Transcriptly Chrome Extension](/guides/how-to-use-chrome-extension) for details on permissions and privacy.

### Can I request captions from a creator?

You can ask in a comment or through their contact details. Many creators add captions when they know viewers rely on them.
