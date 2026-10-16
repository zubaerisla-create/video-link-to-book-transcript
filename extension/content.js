/**
 * Transcriptly Chrome Extension - YouTube Content Script
 * Extracts user-visible captions directly from YouTube's native UI.
 * Does not bypass bot detection, does not access YouTube APIs,
 * and never collects cookies, passwords, or credentials.
 */

(function () {
  // Prevent duplicate execution
  if (window.__transcriptly_injected) return;
  window.__transcriptly_injected = true;

  function parseTimestampToSeconds(tsStr) {
    if (!tsStr) return 0;
    const clean = tsStr.trim().replace(/[\[\]\(\)]/g, "");
    const parts = clean.split(":");
    try {
      if (parts.length === 3) {
        return parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseFloat(parts[2].replace(",", "."));
      } else if (parts.length === 2) {
        return parseInt(parts[0], 10) * 60 + parseFloat(parts[1].replace(",", "."));
      } else if (parts.length === 1) {
        return parseFloat(parts[0].replace(",", "."));
      }
    } catch (e) {
      return 0;
    }
    return 0;
  }

  function getVideoInfo() {
    const url = window.location.href;
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get("v");

    if (!videoId) {
      return { isYouTubeWatch: false, videoId: null, url };
    }

    // Video Title
    const titleEl =
      document.querySelector("h1.ytd-watch-metadata yt-formatted-string") ||
      document.querySelector("ytd-watch-metadata h1") ||
      document.querySelector("h1.title yt-formatted-string") ||
      document.querySelector("h1.title");
    const title = titleEl ? titleEl.innerText.trim() : document.title.replace(" - YouTube", "").trim();

    // Channel Name
    const channelEl =
      document.querySelector("#owner #channel-name a") ||
      document.querySelector("#upload-info #channel-name a") ||
      document.querySelector("#owner-name a");
    const channel = channelEl ? channelEl.innerText.trim() : "";

    const thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    return {
      isYouTubeWatch: true,
      videoId,
      url,
      title,
      channel,
      thumbnail,
    };
  }

  function extractVisibleTranscript() {
    const segmentNodes = document.querySelectorAll(
      "ytd-transcript-segment-renderer, .ytd-transcript-segment-renderer"
    );

    if (!segmentNodes || segmentNodes.length === 0) {
      return {
        found: false,
        segments: [],
        count: 0,
        message: "No transcript segments found in DOM. The transcript panel may be closed.",
      };
    }

    const segments = [];
    segmentNodes.forEach((node) => {
      const tsEl =
        node.querySelector(".segment-timestamp") ||
        node.querySelector("[class*='timestamp']") ||
        node.querySelector("div.segment-timestamp");
      const textEl =
        node.querySelector(".segment-text") ||
        node.querySelector("yt-formatted-string.segment-text") ||
        node.querySelector("[class*='segment-text']");

      const tsText = tsEl ? tsEl.innerText.trim() : "0:00";
      const text = textEl ? textEl.innerText.trim() : "";

      if (text) {
        const startSec = parseTimestampToSeconds(tsText);
        segments.push({
          start: startSec,
          text: text,
          duration: 3.0,
        });
      }
    });

    // Calculate realistic segment durations based on subsequent start times
    for (let i = 0; i < segments.length - 1; i++) {
      const diff = segments[i + 1].start - segments[i].start;
      if (diff >= 0.5 && diff <= 30.0) {
        segments[i].duration = Math.round(diff * 100) / 100;
      }
    }

    return {
      found: segments.length > 0,
      segments: segments,
      count: segments.length,
      message: segments.length > 0 ? "Successfully extracted transcript." : "Transcript panel was empty.",
    };
  }

  function tryOpenTranscriptPanel() {
    // 1. First ensure description is expanded if collapsed
    const expandBtn =
      document.querySelector("#expand") ||
      document.querySelector("tp-yt-paper-button#expand") ||
      document.querySelector("#description-inline-expander");
    if (expandBtn && expandBtn.offsetParent !== null) {
      try {
        expandBtn.click();
      } catch (e) {}
    }

    // 2. Search for the Show Transcript button
    const buttons = Array.from(document.querySelectorAll("button, ytd-button-renderer"));
    let transcriptBtn = buttons.find((btn) => {
      const aria = (btn.getAttribute("aria-label") || "").toLowerCase();
      const text = (btn.innerText || "").toLowerCase();
      return (
        aria.includes("show transcript") ||
        aria.includes("transcript") ||
        text.includes("show transcript")
      );
    });

    // Also check dedicated section renderer
    if (!transcriptBtn) {
      transcriptBtn = document.querySelector(
        "ytd-video-description-transcript-section-renderer button"
      );
    }

    if (transcriptBtn) {
      transcriptBtn.click();
      return { success: true, message: "Clicked 'Show transcript' button. Please wait 1-2 seconds for YouTube to render." };
    }

    return {
      success: false,
      message: "Could not find a native 'Show transcript' button. Captions might not be available for this video.",
    };
  }

  // Listener for popup requests
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "GET_VIDEO_INFO") {
      sendResponse(getVideoInfo());
      return true;
    }

    if (request.action === "EXTRACT_TRANSCRIPT") {
      const info = getVideoInfo();
      const transcriptData = extractVisibleTranscript();
      sendResponse({
        ...info,
        ...transcriptData,
      });
      return true;
    }

    if (request.action === "OPEN_TRANSCRIPT_PANEL") {
      const res = tryOpenTranscriptPanel();
      sendResponse(res);
      return true;
    }
  });
})();
