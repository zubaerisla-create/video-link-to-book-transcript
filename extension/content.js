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

  // Diagnostic tracking for content script
  let extractionCallCount = 0;

  function getActiveTranscriptContainer() {
    // 1. Look for visible engagement panel with target-id="engagement-panel-transcript"
    const panels = Array.from(
      document.querySelectorAll('ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-transcript"]')
    );
    for (const panel of panels) {
      const isHidden =
        panel.hasAttribute("hidden") ||
        panel.getAttribute("visibility") === "ENGAGEMENT_PANEL_VISIBILITY_HIDDEN" ||
        panel.style.display === "none";
      if (!isHidden) {
        const segContainer = panel.querySelector("#segments-container");
        if (segContainer) return segContainer;
        const listRenderer = panel.querySelector("ytd-transcript-segment-list-renderer");
        if (listRenderer) return listRenderer;
        return panel;
      }
    }

    // 2. Visible segments-container anywhere in DOM
    const segContainers = Array.from(document.querySelectorAll("#segments-container"));
    for (const cont of segContainers) {
      if (!cont.closest("[hidden]") && cont.offsetParent !== null) {
        return cont;
      }
    }

    // 3. Dedicated description transcript section renderer
    const descSection = document.querySelector("ytd-video-description-transcript-section-renderer");
    if (descSection && !descSection.closest("[hidden]")) {
      return descSection;
    }

    // 4. Any segments-container or transcript segment list renderer in DOM
    const fallbackCont = document.querySelector("#segments-container, ytd-transcript-segment-list-renderer");
    if (fallbackCont) return fallbackCont;

    return document;
  }

  function getSegmentNodes(container) {
    if (!container) return [];

    // Target the canonical YouTube custom element tag first.
    // CRITICAL: We query ONLY 'ytd-transcript-segment-renderer', NEVER combining it with
    // '.ytd-transcript-segment-renderer'. In YouTube Polymer / Shady DOM, all descendant elements
    // inside <ytd-transcript-segment-renderer> (such as <div id="segment">) carry the scoped class
    // 'style-scope ytd-transcript-segment-renderer'. Querying both matched parent and child,
    // which caused every single transcript row to be extracted twice.
    const primaryNodes = Array.from(container.querySelectorAll("ytd-transcript-segment-renderer"));
    if (primaryNodes.length > 0) {
      return primaryNodes;
    }

    // Fallback ONLY if no <ytd-transcript-segment-renderer> custom elements exist:
    const candidateNodes = Array.from(
      container.querySelectorAll(".ytd-transcript-segment-renderer, [class*='transcript-segment-renderer']")
    );

    // Hierarchical filter: keep only top-level nodes, excluding any descendant if an ancestor was matched
    return candidateNodes.filter((node) => {
      return !candidateNodes.some((other) => other !== node && other.contains(node));
    });
  }

  async function waitForTranscriptSegments(timeoutMs = 1500) {
    const initialContainer = getActiveTranscriptContainer();
    let initialNodes = getSegmentNodes(initialContainer);
    if (initialNodes.length > 0) {
      return { container: initialContainer, nodes: initialNodes };
    }

    // Check if transcript container or panel exists but is currently rendering
    const panelExists = document.querySelector(
      'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-transcript"], #segments-container, ytd-transcript-renderer, ytd-transcript-search-panel-renderer'
    );
    if (!panelExists) {
      return { container: initialContainer, nodes: [] };
    }

    const startTime = Date.now();
    return new Promise((resolve) => {
      let resolved = false;

      const finish = (resultNodes) => {
        if (!resolved) {
          resolved = true;
          if (observer) {
            try {
              observer.disconnect();
            } catch (e) {}
          }
          resolve({ container: getActiveTranscriptContainer(), nodes: resultNodes });
        }
      };

      let observer = null;
      try {
        observer = new MutationObserver(() => {
          const curContainer = getActiveTranscriptContainer();
          const curNodes = getSegmentNodes(curContainer);
          if (curNodes.length > 0) {
            finish(curNodes);
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });
      } catch (e) {}

      const interval = setInterval(() => {
        const curContainer = getActiveTranscriptContainer();
        const curNodes = getSegmentNodes(curContainer);
        if (curNodes.length > 0) {
          clearInterval(interval);
          finish(curNodes);
        } else if (Date.now() - startTime >= timeoutMs) {
          clearInterval(interval);
          finish([]);
        }
      }, 100);
    });
  }

  async function extractVisibleTranscript() {
    extractionCallCount++;
    const callId = extractionCallCount;

    const { nodes: segmentNodes } = await waitForTranscriptSegments(1500);
    const sourceRowCount = segmentNodes ? segmentNodes.length : 0;

    if (!segmentNodes || segmentNodes.length === 0) {
      console.log(`[Transcriptly content.js] Call #${callId}: No transcript segments found (sourceRowCount=0).`);
      return {
        found: false,
        segments: [],
        count: 0,
        extractionCallCount: callId,
        sourceRowCount: 0,
        uniqueSegmentCount: 0,
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
        // Each DOM node represents a unique row in the source transcript.
        // Legitimate repeated phrases spoken in the video are preserved as separate timed segments.
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

    // Diagnostic logging: log only metadata (no tokens, passwords, or credentials)
    console.log(
      `[Transcriptly content.js] Call #${callId}: Extracted ${segments.length} segments from ${sourceRowCount} source DOM rows.`
    );

    return {
      found: segments.length > 0,
      segments: segments,
      count: segments.length,
      extractionCallCount: callId,
      sourceRowCount: sourceRowCount,
      uniqueSegmentCount: segments.length,
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
      return false;
    }

    if (request.action === "EXTRACT_TRANSCRIPT") {
      extractVisibleTranscript().then((transcriptData) => {
        const info = getVideoInfo();
        sendResponse({
          ...info,
          ...transcriptData,
        });
      });
      return true;
    }

    if (request.action === "OPEN_TRANSCRIPT_PANEL") {
      const res = tryOpenTranscriptPanel();
      sendResponse(res);
      return false;
    }
  });
})();
