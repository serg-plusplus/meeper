export interface TabRecordState {
  tabId: number;
  tabIndex: number;
  recordTabId: number;
  recordId: string;
  recording: boolean;
}

export async function getTabRecordState(recordTabId: number) {
  const storageKey = toSessionKey({ recordTabId });
  const items = await chrome.storage.session.get(storageKey);
  return items[storageKey] as TabRecordState | undefined;
}

export async function syncTabRecordState(state: TabRecordState) {
  const storageKey = toSessionKey(state);
  await chrome.storage.session.set({
    [storageKey]: state,
  });
}

export async function cleanupTabRecordState(recordTabId: number) {
  const storageKey = toSessionKey({ recordTabId });
  await chrome.storage.session.remove(storageKey);
}

export function toSessionKey({
  recordTabId,
}: Pick<TabRecordState, "recordTabId">) {
  return `rtab_${recordTabId}`;
}
