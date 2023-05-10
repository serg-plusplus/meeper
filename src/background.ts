import { MsgType } from "./core/types";
import { registerInpageScripts } from "./config/inpageScripts";
import { buildMainURL } from "./config/mainUrl";

registerInpageScripts();

if (process.env.NODE_ENV === "development") {
  import("./_dev/hotreloadObserver")
    .then(({ initHotReloadTab }) => initHotReloadTab())
    .catch(console.error);
}

chrome.runtime.onMessage.addListener(async (msg) => {
  try {
    if (msg?.type === MsgType.Start) {
      await chrome.tabs.create({
        url: buildMainURL(`/record/${msg.tabId}`, {
          recordType: msg.recordType,
        }),
        active: false,
        index: msg.tabIndex + 1,
        openerTabId: msg.tabId,
      });
    }
  } catch (err) {
    console.error(err);
  }
});

// chrome.tabs.onRemoved.addListener((tabId) => {

// });

// chrome.tabs.create({
//   url: chrome.runtime.getURL("main.html"),
//   active: true,
// });

// chrome.action.onClicked.addListener(async (currentTab) => {
//   console.info("HERE");
//   chrome.runtime.sendMessage({ type: "start-listen", tabId: currentTab.id });
// });

// chrome.runtime.onMessage.addListener((msg, sender) => {
//   console.info(msg);
//   if (msg.type === "start-listen") {
//     console.info("started");

//     chrome.tabCapture.getMediaStreamId(
//       { consumerTabId: sender.tab?.id },
//       (streamId) => {
//         console.info({ streamId });
//       }
//     );
//   }
// });
