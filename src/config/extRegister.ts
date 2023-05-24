/*
 * This content script is injected programmatically because
 * MAIN world injection does not work properly via manifest
 * https://bugs.chromium.org/p/chromium/issues/detail?id=634381
 */
export async function registerInpageScripts() {
  try {
    await chrome.scripting.registerContentScripts([
      {
        id: "content-main",
        matches: ["*://meet.google.com/*-*-*"],
        js: ["assets/inpage.js"],
        runAt: "document_start",
        allFrames: true,
        ["world" as any]: "MAIN",
      },
    ]);
  } catch (err: any) {
    /**
     * An error occurs when app is reloaded. Attempts to avoid the duplicate script error:
     * 1. registeringContentScripts inside runtime.onInstalled - This caused a race condition
     *    in which the provider might not be loaded in time.
     * 2. await chrome.scripting.getRegisteredContentScripts() to check for an existing
     *    content script before registering - The provider is not loaded on time.
     */
    if (!err || err?.message?.toLowerCase()?.includes("Duplicate")) return;

    console.error(err);
  }
}

export function registerContextMenus() {
  return new Promise<void>((res) => {
    chrome.contextMenus.create(
      {
        documentUrlPatterns: ["*://meet.google.com/*-*-*"],
        id: "run-meeper",
        title: "Run Meeper",
      },
      () => {
        const err = chrome.runtime.lastError;

        if (err && !err?.message?.toLowerCase()?.includes("duplicate")) {
          console.error(err);
        }

        res();
      }
    );
  });
}
