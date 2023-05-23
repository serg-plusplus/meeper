import { RecordType } from "../core/types";

export function matchRecordType(tab: Pick<chrome.tabs.Tab, "url">) {
  const meetLikeEntries = ["teams.live", "meet.google", "zoom"];

  if (meetLikeEntries.some((entry) => tab.url?.includes(entry))) {
    return RecordType.Full;
  }

  return RecordType.StereoOnly;
}
