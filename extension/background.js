/**
 * Transcriptly Chrome Extension - Background Service Worker (Manifest V3)
 * Handles default settings and initialization.
 */

chrome.runtime.onInstalled.addListener(() => {
  // Initialize default instance URL if not already set
  chrome.storage.sync.get(["transcriptlyHost"], (result) => {
    if (!result.transcriptlyHost) {
      chrome.storage.sync.set({
        transcriptlyHost: "https://habd.tech"
      });
    }
  });
  console.log("Transcriptly Chrome Extension installed.");
});
