import { buildMainURL } from "../config/extUrl";
import { matchRecordType } from "../config/recordType";

import { cleanupTabRecordState, getTabRecordState } from "./session";
import { dbContents, dbRecords, fetchRecords } from "./db";
import { RecordType } from "./types";

function runMeeper(
  tab: Pick<chrome.tabs.Tab, "id" | "index" | "url">,
  recordType?: RecordType
) {
  chrome.tabs
    .create({
      url: buildMainURL(`/record/${tab.id}`, {
        recordType: recordType ?? matchRecordType(tab),
      }),
      active: false,
      index: tab.index + 1,
      openerTabId: tab.id,
    })
    .catch(console.error);
}

export function startBgWorker() {
  // Open welcome page when installed
  chrome.runtime.onInstalled.addListener(({ reason }) => {
    if (reason === "install") {
      chrome.tabs.create({
        url: buildMainURL("/welcome"),
        active: true,
      });
    }
  });

  // Fetch latest 20 record
  // Finilize if some records didn't
  // (Rare case - application or browser turned off)
  chrome.storage.session.get("refreshed").then(({ refreshed }) => {
    if (refreshed) return;

    chrome.storage.session.set({ refreshed: true });

    fetchRecords(20)
      .then((recs) =>
        Promise.all(
          recs
            .filter((r) => !r.finishedAt)
            .map((rec) =>
              dbRecords.update(rec.id, {
                finishedAt: rec.lastSyncAt ?? Date.now(),
              })
            )
        )
      )
      .catch(console.error);
  });

  // Listen messages from ext popup & content scripts
  chrome.runtime.onMessage.addListener(async (msg, sender) => {
    // From ext popup
    if (msg?.type === "run-meeper" && msg.tabId) {
      runMeeper({ id: msg.tabId, index: msg.tabIndex }, msg.recordType);
    }

    // From content scripts
    if (msg?.target === "meeper" && sender.tab?.id) {
      const state = await getTabRecordState({ tabId: sender.tab.id });

      if (
        state &&
        ["start", "pause", "stop", "setmic", "focus"].includes(msg.type)
      ) {
        chrome.runtime.sendMessage({ ...msg, recordId: state.recordId });
      }
    }
  });

  // Listen `run-meeper` command from keyboard shortcuts
  chrome.commands.onCommand.addListener((cmd, tab) => {
    if (cmd === "run-meeper" && tab?.id) {
      runMeeper(tab);
    }
  });

  // Listen `run-meeper` item from context menus
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "run-meeper" && tab?.id) {
      runMeeper(tab);
    }
  });

  // Finilize process if Record tab/session closed
  // Open Explore page with certain record
  chrome.tabs.onRemoved.addListener(async (recordTabId) => {
    try {
      const state = await getTabRecordState({ recordTabId });
      if (!state) return;

      await dbRecords.update(state.recordId, {
        finishedAt: Date.now(),
      });
      await cleanupTabRecordState(state);

      const tab = await chrome.tabs.get(state.tabId).catch(() => null);

      // Notify tab about the state
      if (tab?.id) {
        await chrome.tabs
          .sendMessage(tab.id, {
            target: "meeper",
            active: false,
          })
          .catch(console.warn);
      }

      const content = await dbContents.get(state.recordId);
      if (!content || content.content.length === 0) return;

      await chrome.tabs.create({
        url: buildMainURL(`/explore/${state.recordId}`),
        active: true,
        openerTabId: tab?.id,
        index: (tab?.index ?? state.tabIndex) + 1,
      });
    } catch (err) {
      console.error(err);
    }
  });
}
