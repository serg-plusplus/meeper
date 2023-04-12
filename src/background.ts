import { registerContentScript } from "./lib/registerContentScript";

registerContentScript();

if (process.env.NODE_ENV === "development") {
  import("./lib/hotreloadObserver")
    .then(({ initHotReloadTab }) => initHotReloadTab())
    .catch(console.error);
}

chrome.tabs.create({
  url: chrome.runtime.getURL("meet.html"),
  active: true,
});
