/**
 * Language
 */

export const LANGCODE = "langcode";

export async function getLangCode() {
  const items = await chrome.storage.session.get(LANGCODE);
  return (items[LANGCODE] as string) ?? "auto";
}

/**
 * Tab Record
 */

export interface TabRecordState {
  tabId: number;
  tabIndex: number;
  recordTabId: number;
  recordId: string;
  recording: boolean;
}

export async function getTabRecordState(
  params: { tabId: number } | { recordTabId: number }
) {
  const storageKey = "tabId" in params ? toTabKey(params) : toRecordKey(params);

  const items = await chrome.storage.session.get(storageKey);
  return items[storageKey] as TabRecordState | undefined;
}

export async function syncTabRecordState(state: TabRecordState) {
  const recKey = toRecordKey(state);
  const tabKey = toTabKey(state);
  await chrome.storage.session.set({
    [recKey]: state,
    [tabKey]: state,
  });
}

export async function cleanupTabRecordState({
  tabId,
  recordTabId,
}: Pick<TabRecordState, "tabId" | "recordTabId">) {
  const recKey = toRecordKey({ recordTabId });
  const tabKey = toTabKey({ tabId });
  await chrome.storage.session.remove([recKey, tabKey]);
}

export function toTabKey({ tabId }: Pick<TabRecordState, "tabId">) {
  return `tab_${tabId}`;
}

export function toRecordKey({
  recordTabId,
}: Pick<TabRecordState, "recordTabId">) {
  return `rtab_${recordTabId}`;
}
