import { registerContentScript } from "./lib/registerContentScript";

registerContentScript();

if (process.env.NODE_ENV === "development") {
  import("./_dev/hotreloadObserver")
    .then(({ initHotReloadTab }) => initHotReloadTab())
    .catch(console.error);
}

chrome.tabs.create({
  url: chrome.runtime.getURL("meet.html"),
  active: true,
});
