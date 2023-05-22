import { buildMainURL } from "../config/extUrl";

import { cleanupTabRecordState, getTabRecordState } from "./session";
import { dbContents, dbRecords, fetchRecords } from "./db";
import { RecordType } from "./types";

export function startBgWorker() {
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

  // Listen `Start` message from ext popup
  // Create Record tab/session if recieved
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type === "init") {
      chrome.tabs
        .create({
          url: buildMainURL(`/record/${msg.tabId}`, {
            recordType: msg.recordType,
          }),
          active: false,
          index: msg.tabIndex + 1,
          openerTabId: msg.tabId,
        })
        .catch(console.error);
    }
  });

  // Finilize process if Recrod tab/session closed
  // Open Explore page with certain record
  chrome.tabs.onRemoved.addListener(async (recordTabId) => {
    try {
      const state = await getTabRecordState({ recordTabId });
      if (!state) return;

      await dbRecords.update(state.recordId, {
        finishedAt: Date.now(),
      });
      await cleanupTabRecordState(state);

      const content = await dbContents.get(state.recordId);
      if (!content || content.content.length === 0) return;

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
}
