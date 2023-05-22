import { pick } from "../lib/system";

import { TabInfo } from "./types";

export function getTabInfo(tabInstance: chrome.tabs.Tab) {
  return pick(tabInstance, "id", "url", "title", "favIconUrl") as TabInfo;
}
