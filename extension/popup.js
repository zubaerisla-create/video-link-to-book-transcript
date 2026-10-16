/**
 * Transcriptly Chrome Extension - Popup Controller
 * Manages YouTube DOM extraction, staging requests, manual fallback, and instance settings.
 */

document.addEventListener("DOMContentLoaded", async () => {
  // DOM Elements - Tabs
  const tabBtnCapture = document.getElementById("tabBtnCapture");
  const tabBtnPaste = document.getElementById("tabBtnPaste");
  const tabBtnSettings = document.getElementById("tabBtnSettings");
  const captureTab = document.getElementById("captureTab");
  const pasteTab = document.getElementById("pasteTab");
  const settingsTab = document.getElementById("settingsTab");

  // DOM Elements - Capture View
  const notYouTubeCard = document.getElementById("notYouTubeCard");
  const scanningCard = document.getElementById("scanningCard");
  const panelClosedCard = document.getElementById("panelClosedCard");
  const readyCard = document.getElementById("readyCard");
  const btnOpenPanel = document.getElementById("btnOpenPanel");
  const btnRescan = document.getElementById("btnRescan");
  const btnImportCapture = document.getElementById("btnImportCapture");

  // Video Info Elements
  const previewTitle = document.getElementById("previewTitle");
  const previewChannel = document.getElementById("previewChannel");
  const badgeSegments = document.getElementById("badgeSegments");
  const badgeWords = document.getElementById("badgeWords");
  const badgeLang = document.getElementById("badgeLang");
  const previewSnippet = document.getElementById("previewSnippet");

  // DOM Elements - Manual Paste View
  const pasteUrl = document.getElementById("pasteUrl");
  const pasteTitle = document.getElementById("pasteTitle");
  const pasteText = document.getElementById("pasteText");
  const btnImportPaste = document.getElementById("btnImportPaste");

  // DOM Elements - Settings
  const settingHost = document.getElementById("settingHost");
  const btnSaveSettings = document.getElementById("btnSaveSettings");
  const settingsAlert = document.getElementById("settingsAlert");
  const globalError = document.getElementById("globalError");

  // State
  let currentHost = "https://habd.tech";
  let activeTabInfo = null;
  let extractedTranscriptData = null;

  // 1. Load Host Settings
  const stored = await chrome.storage.sync.get(["transcriptlyHost"]);
  if (stored.transcriptlyHost) {
    currentHost = stored.transcriptlyHost.replace(/\/$/, "");
    settingHost.value = currentHost;
  }

  // 2. Tab Navigation
  function switchTab(targetTab) {
    [captureTab, pasteTab, settingsTab].forEach((tab) => tab.classList.add("hidden"));
    [tabBtnCapture, tabBtnPaste, tabBtnSettings].forEach((btn) => btn.classList.remove("active"));
    hideError();

    if (targetTab === "captureTab") {
      captureTab.classList.remove("hidden");
      tabBtnCapture.classList.add("active");
    } else if (targetTab === "pasteTab") {
      pasteTab.classList.remove("hidden");
      tabBtnPaste.classList.add("active");
    } else if (targetTab === "settingsTab") {
      settingsTab.classList.remove("hidden");
      tabBtnSettings.classList.add("active");
    }
  }

  tabBtnCapture.addEventListener("click", () => switchTab("captureTab"));
  tabBtnPaste.addEventListener("click", () => switchTab("pasteTab"));
  tabBtnSettings.addEventListener("click", () => switchTab("settingsTab"));

  // Settings Preset Chips
  document.querySelectorAll(".chip-btn").forEach((chip) => {
    chip.addEventListener("click", () => {
      const preset = chip.getAttribute("data-preset");
      if (preset) {
        settingHost.value = preset;
      }
    });
  });

  btnSaveSettings.addEventListener("click", async () => {
    const val = settingHost.value.trim().replace(/\/$/, "");
    if (!val.startsWith("http://") && !val.startsWith("https://")) {
      showError("Instance URL must begin with http:// or https://");
      return;
    }
    currentHost = val;
    await chrome.storage.sync.set({ transcriptlyHost: currentHost });
    settingsAlert.classList.remove("hidden");
    setTimeout(() => settingsAlert.classList.add("hidden"), 2500);
  });

  function showError(msg) {
    globalError.textContent = msg;
    globalError.classList.remove("hidden");
  }

  function hideError() {
    globalError.classList.add("hidden");
    globalError.textContent = "";
  }

  // 3. Scan Active YouTube Tab
  async function scanActiveTab() {
    hideError();
    scanningCard.classList.remove("hidden");
    notYouTubeCard.classList.add("hidden");
    panelClosedCard.classList.add("hidden");
    readyCard.classList.add("hidden");

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.url || !tab.url.includes("youtube.com/watch")) {
        scanningCard.classList.add("hidden");
        notYouTubeCard.classList.remove("hidden");
        return;
      }

      activeTabInfo = tab;

      // Ensure content script is injected
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["content.js"],
        });
      } catch (err) {
        // Script may already be injected, continue
      }

      // Request transcript extraction from content script
      chrome.tabs.sendMessage(tab.id, { action: "EXTRACT_TRANSCRIPT" }, (response) => {
        scanningCard.classList.add("hidden");

        if (chrome.runtime.lastError || !response) {
          // If message failed to respond, show panel closed card
          panelClosedCard.classList.remove("hidden");
          return;
        }

        extractedTranscriptData = response;

        // Auto-fill paste tab fields as fallback
        if (response.url) pasteUrl.value = response.url;
        if (response.title) pasteTitle.value = response.title;

        if (response.found && response.segments && response.segments.length > 0) {
          renderReadyView(response);
        } else {
          panelClosedCard.classList.remove("hidden");
        }
      });
    } catch (err) {
      scanningCard.classList.add("hidden");
      showError("Could not inspect current browser tab: " + err.message);
    }
  }

  function renderReadyView(data) {
    readyCard.classList.remove("hidden");
    previewTitle.textContent = data.title || "YouTube Video";
    previewChannel.textContent = data.channel ? `Channel: ${data.channel}` : "";

    const segmentCount = data.segments.length;
    const wordCount = data.segments.reduce((acc, s) => acc + (s.text ? s.text.split(/\s+/).length : 0), 0);

    badgeSegments.textContent = `${segmentCount} segments`;
    badgeWords.textContent = `~${wordCount.toLocaleString()} words`;

    // Detect if text contains Bengali/Unicode
    const sample = data.segments.slice(0, 5).map((s) => s.text).join(" ");
    const hasBangla = /[\u0980-\u09FF]/.test(sample);
    badgeLang.textContent = hasBangla ? "Bangla" : "Original";

    // Snippet
    const snippetLines = data.segments.slice(0, 4).map((s) => {
      const m = Math.floor(s.start / 60);
      const sec = Math.floor(s.start % 60);
      const ts = `${m}:${sec < 10 ? "0" : ""}${sec}`;
      return `[${ts}] ${s.text}`;
    });
    previewSnippet.textContent = snippetLines.join("\n") + (segmentCount > 4 ? "\n..." : "");
  }

  // Open Transcript Panel trigger
  btnOpenPanel.addEventListener("click", async () => {
    if (!activeTabInfo) return;
    btnOpenPanel.textContent = "Attempting to open...";
    chrome.tabs.sendMessage(activeTabInfo.id, { action: "OPEN_TRANSCRIPT_PANEL" }, (response) => {
      setTimeout(() => {
        btnOpenPanel.textContent = "Try Open YouTube Transcript";
        scanActiveTab();
      }, 1500);
    });
  });

  btnRescan.addEventListener("click", () => {
    scanActiveTab();
  });

  // 4. Import from YouTube Capture
  btnImportCapture.addEventListener("click", async () => {
    if (!extractedTranscriptData || !extractedTranscriptData.segments) return;

    btnImportCapture.disabled = true;
    btnImportCapture.innerHTML = `
      <span class="spinner" style="width:14px;height:14px;border-width:2px;display:inline-block;margin:0 4px 0 0;vertical-align:middle;"></span>
      Staging import...
    `;
    hideError();

    const payload = {
      video_url: extractedTranscriptData.url || activeTabInfo.url,
      title: extractedTranscriptData.title || null,
      channel_title: extractedTranscriptData.channel || null,
      thumbnail_url: extractedTranscriptData.thumbnail || null,
      segments: extractedTranscriptData.segments,
      paragraph_length: "medium",
    };

    try {
      const res = await fetch(`${currentHost}/api/transcript/stage-import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData?.detail?.detail || errorData?.detail || `Server returned status ${res.status}`);
      }

      const staged = await res.json();
      if (!staged.import_token) {
        throw new Error("Server did not return a valid import token.");
      }

      // Open Transcriptly web confirmation page in a new browser tab
      const targetUrl = `${currentHost}/import?token=${encodeURIComponent(staged.import_token)}`;
      await chrome.tabs.create({ url: targetUrl });

      // Close popup
      window.close();
    } catch (err) {
      btnImportCapture.disabled = false;
      btnImportCapture.innerHTML = "Import to Transcriptly";
      showError(`Import failed: ${err.message}. Ensure Transcriptly server is reachable at ${currentHost}.`);
    }
  });

  // 5. Manual Paste Fallback
  btnImportPaste.addEventListener("click", async () => {
    const url = pasteUrl.value.trim();
    const text = pasteText.value.trim();
    const title = pasteTitle.value.trim() || undefined;

    if (!url) {
      showError("Please enter a valid YouTube video URL.");
      return;
    }
    if (!text) {
      showError("Please paste transcript text into the box.");
      return;
    }

    const selectedLength =
      document.querySelector("input[name='pasteParagraphLength']:checked")?.value || "medium";

    btnImportPaste.disabled = true;
    btnImportPaste.textContent = "Staging Pasted Transcript...";
    hideError();

    const payload = {
      video_url: url,
      title: title,
      raw_text: text,
      paragraph_length: selectedLength,
    };

    try {
      const res = await fetch(`${currentHost}/api/transcript/stage-import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData?.detail?.detail || errorData?.detail || `Server returned status ${res.status}`);
      }

      const staged = await res.json();
      if (!staged.import_token) {
        throw new Error("Server did not return a valid import token.");
      }

      const targetUrl = `${currentHost}/import?token=${encodeURIComponent(staged.import_token)}`;
      await chrome.tabs.create({ url: targetUrl });
      window.close();
    } catch (err) {
      btnImportPaste.disabled = false;
      btnImportPaste.textContent = "Stage & Review Pasted Transcript";
      showError(`Import failed: ${err.message}. Ensure Transcriptly server is reachable at ${currentHost}.`);
    }
  });

  // Initial Scan on popup open
  scanActiveTab();
});
