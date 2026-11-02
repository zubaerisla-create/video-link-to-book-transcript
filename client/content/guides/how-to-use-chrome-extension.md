The Transcriptly Chrome extension is a small helper for your browser. It reads the transcript that YouTube is already showing you on a video page and sends it to Transcriptly, where it becomes clean paragraphs you can read, save as a book, or export. This guide covers what the extension does, how to install it (it is not in the Chrome Web Store yet, so installing takes about a minute of manual steps), how to use it day to day, and what to do when something goes wrong.

> [!note] Prefer Bangla instructions? The [extension download page](/extension) has the same installation steps written in Bangla, with illustrations and a tutorial video.

## What the extension does — and why it exists

There are two ways Transcriptly can get the captions for a YouTube video.

1. **Server-side, from a pasted link.** You paste a URL on the [Transcriptly home page](/) and our server asks YouTube for the caption track. This is the simplest option and works for most videos.
2. **In your browser, with the extension.** The extension reads the transcript panel YouTube renders on the page you have open, then hands that text to Transcriptly.

The second route exists because YouTube sometimes limits or blocks caption requests that come from data-centre servers. When that happens, the website may report that YouTube refused the request or that the server is rate-limited, even though the video clearly has captions when you watch it. Your own browser is not affected in the same way, because it is just a normal viewer loading a normal YouTube page. The extension takes advantage of that: it only collects what you can already see.

In practical terms, the extension:

- Detects the video title and channel name on the YouTube page you are viewing.
- Reads the segments in YouTube's **Show transcript** panel, including their timestamps.
- Shows you a preview: segment count, word count, the caption language and a short snippet.
- Sends the transcript to Transcriptly and opens it in a new tab, ready to review, save or export.
- Offers a **Manual Paste** tab for text you already have — for example, a transcript you copied from somewhere else.

It does **not** download video or audio, it does not read your YouTube account, and it does not run in the background on other websites.

## Who should use it

The extension is most useful if:

- Pasting a link on the website returns an error such as "YouTube blocked the request" or "rate limited", but the video has a transcript when you open it on YouTube.
- You collect transcripts regularly — for example, saving every lecture in a course — and want a one-click workflow from the video page.
- You watch in Chrome, Microsoft Edge, Brave, Opera or another Chromium-based desktop browser.

If you only need a transcript occasionally and the website works for you, you don't need the extension at all.

## Before you install

- **Supported browsers:** Chromium-based desktop browsers (Chrome, Edge, Brave, Opera). Firefox and Safari use different extension formats and are not supported.
- **Mobile:** Mobile browsers generally cannot load unpacked extensions, so the extension is not supported on phones. Use the website directly instead.
- **Why "Developer mode"?** Because the extension is not yet published in the Chrome Web Store, Chrome only allows it to be installed through its built-in "Load unpacked" feature, which lives behind the Developer mode switch. This is a standard Chrome feature; it does not change your browser's security settings for other sites. Chrome may occasionally show a reminder that a developer-mode extension is installed — that is expected.
- **Permissions it requests:** access to the active tab when you click the icon, the ability to run its script on YouTube pages, storage for one setting (which Transcriptly address to send imports to), and permission to talk to `youtube.com` and `habd.tech`.

## How to install the extension

1. **Download the ZIP.** Go to the [extension page](/extension) and click the download button. The file is small (under 30 KB).
2. **Extract it.** Right-click the ZIP and choose *Extract All* (Windows) or double-click it (macOS). Move the extracted folder somewhere permanent, such as your Documents folder. Chrome loads the extension from this folder, so if you delete or move it later, the extension stops working.
3. **Open the extensions page.** In the address bar, type `chrome://extensions` and press Enter. In Edge, use `edge://extensions`; in Brave, `brave://extensions`.
4. **Turn on Developer mode.** The switch is in the top-right corner of the extensions page (in Edge, it is in the left sidebar).
5. **Click "Load unpacked".** A file picker opens. Select the extracted folder — the one that directly contains `manifest.json`, not the folder above it.
6. **Pin it.** Click the puzzle-piece icon in the toolbar and click the pin next to **Transcriptly** so the icon is always visible.

![Illustration of Chrome's extensions page with Developer mode switched on and the Load unpacked button highlighted](/images/extension/step4-load-unpacked.svg "Illustration: enable Developer mode, then choose Load unpacked and select the extracted folder.|760x380")

## How to import a transcript from YouTube

1. **Open a YouTube video** in a normal tab. Let it start loading — the extension needs the page's video details to appear.
2. **Open YouTube's transcript panel.** Click **...more** under the video to expand the description, scroll down, and click **Show transcript**. A panel with timestamped lines appears beside the video. You can also let the extension do this: click the Transcriptly icon, and if it says *Transcript Panel Not Open*, click **Try Open YouTube Transcript**.
3. **Check the preview.** The popup shows the video title, channel, number of segments, word count, the language label and a short snippet. If the word count looks far too low for the length of the video, scroll the transcript panel once and reopen the popup — YouTube sometimes loads segments lazily.
4. **Click "Import to Transcriptly".** A new tab opens on Transcriptly's import page with your transcript already loaded.

![Illustration of the extension popup on a YouTube video page showing segment and word counts](/images/extension/step6-youtube-scan.svg "Illustration: the popup previews what it found before anything is sent.|760x380")

### What happens to the data when you click Import

The extension sends the transcript text, timestamps, title, channel and video URL to Transcriptly. The server holds it under a random, single-use import token for up to **five minutes**, just long enough for the new tab to open and load it. If you don't open it in that window, the staged copy expires and is deleted. Nothing is added to your library unless you choose to save it.

## Processing, saving and exporting the result

On the import page you can review the transcript before doing anything with it:

- **Paragraphs or timestamped segments.** Paragraph view merges YouTube's short caption lines into readable text. Segment view keeps each line with its timestamp — useful when you need to jump back to an exact moment in the video.
- **Paragraph length.** Transcripts imported from YouTube's panel are grouped into medium-length paragraphs. With Manual Paste (below) you can choose short, medium or long. How the grouping works is explained in [How Sentence Splitting Works in Multilingual Transcription](/guides/how-sentence-splitting-works-in-multilingual-transcription).
- **Save to My Library.** Saves the transcript as a book in your account. You need a free account for this; if you aren't signed in, Transcriptly keeps the pending import in your browser tab while you log in or sign up, so you don't have to import again.
- **Read it as a book.** Saved books open in a reader with page-by-page or continuous scrolling, light, sepia and dark themes, adjustable text size, and reading progress that remembers where you stopped.
- **Export.** From a saved book you can download TXT, SRT subtitles, JSON or a formatted PDF. If you're unsure which to pick, see [SRT vs TXT vs JSON](/guides/srt-vs-txt-vs-json-transcript-formats).

## Using Manual Paste

The **Manual Paste** tab in the popup handles text that didn't come from YouTube's transcript panel — for instance, a transcript emailed by a lecturer or text you copied from another tool. Enter the video URL (so the book is linked to its source), an optional title, paste the text, choose a paragraph style, and click **Stage & Review Pasted Transcript**. It follows the same five-minute import flow described above.

## Languages

The extension imports whatever caption track YouTube is currently showing in the transcript panel, so it works with any language YouTube provides captions for — including scripts such as Bangla, Devanagari and Arabic. If a video has several tracks, choose the one you want from the language menu at the bottom of YouTube's transcript panel *before* you import. Keep in mind that a track labelled "auto-translated" is a machine translation, not what the speaker actually said; [Understanding Transcript Languages, Tracks and Timestamps](/guides/understanding-transcript-languages-and-timestamps) explains how to tell the difference.

## Troubleshooting common problems

### "No Active YouTube Video"

The popup only works on a YouTube watch page (`youtube.com/watch?v=…`). It won't work on the YouTube home page, search results, or embedded players on other sites. Open the video itself and try again.

### "Transcript Panel Not Open"

Click **Try Open YouTube Transcript** in the popup, or open it manually via **...more → Show transcript**. If the **Show transcript** button doesn't exist anywhere in the description, the video has no captions available — see [How to Fix Missing or Unavailable YouTube Captions](/guides/how-to-fix-missing-unavailable-captions).

### The word count is too low or the snippet looks cut off

YouTube can render long transcripts in stages. Scroll to the bottom of the transcript panel, wait a second, then click the extension icon again.

### Import opens but says the token is invalid or expired

The staged import is kept for five minutes and can only be used once. Go back to the YouTube tab and import again. If you changed the address under the popup's **Settings** tab, make sure it is `https://habd.tech` (the default).

### The extension disappeared after a restart

This usually means the extracted folder was moved, renamed or deleted. Extract the ZIP again to a permanent location and repeat the **Load unpacked** step.

### The icon does nothing on YouTube after an update

YouTube changes its page layout from time to time. Reload the YouTube tab first. If the problem persists, [let us know](/contact) which video you tried, so we can update the extension.

## Privacy considerations

- The extension reads only the YouTube tab you're on, and only when you click its icon.
- It reads the visible transcript and video details, not your YouTube account, comments, history or cookies.
- It sends data to Transcriptly only when you click **Import** or **Stage & Review**.
- Staged imports expire after five minutes. Saved books stay in your account until you delete them.

The full details are in our [Privacy Policy](/privacy).

## Frequently asked questions

### Is the extension free?

Yes. There is no paid tier and no account is required to import and read a transcript. An account is only needed to save books to a library.

### Why isn't it in the Chrome Web Store?

It hasn't been published there yet. Until it is, the "Load unpacked" method is the supported way to install it. When a store version is available, this guide will be updated.

### Can I uninstall it?

Yes. Open `chrome://extensions`, find Transcriptly and click **Remove**. You can then delete the extracted folder.

### Does it work if the video has no captions?

No. The extension can only import a transcript that YouTube itself displays. For videos without captions, see the options in [How to Fix Missing or Unavailable YouTube Captions](/guides/how-to-fix-missing-unavailable-captions).

### Is it any different from pasting the link on the website?

The result is the same kind of transcript. The difference is where it's fetched from: the extension uses your browser's view of the page, which avoids server-side blocking. For an overview of all the methods, read [How to Get a Transcript from a YouTube Video](/guides/how-to-get-transcript-from-youtube).
