import { MsgType } from "./core/types";
import { registerInpageScripts } from "./config/inpageScripts";
import { buildMainURL } from "./config/extUrl";
import { getTabRecordState } from "./core/session";
import { dbRecords } from "./core/db";

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

chrome.tabs.onRemoved.addListener(async (tabId) => {
  try {
    const state = await getTabRecordState(tabId);
    if (!state) return;

    await dbRecords.update(state.recordId, {
      finishedAt: Date.now(),
    });

    const tab = await chrome.tabs.get(state.tabId).catch(() => null);

    await chrome.tabs.create({
      url: buildMainURL(`/explore/${state.recordId}`),
      active: true,
      openerTabId: tab?.id,
      index: tab?.index ?? state.tabIndex,
    });
  } catch (err) {
    console.error(err);
  }
});
