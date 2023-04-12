const HOTRELOAD_TAB_URL = chrome.runtime.getURL("hotreload.html");

export async function initHotReloadTab() {
  const existing = await chrome.tabs.query({ url: `${HOTRELOAD_TAB_URL}**` });

  if (existing.length === 0) {
    await chrome.tabs.create({
      url: HOTRELOAD_TAB_URL,
      active: false,
      index: 0,
    });
  }
}
