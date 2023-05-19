export function buildMainURL(path = "/", params: Record<string, any> = {}) {
  const usp = new URLSearchParams(params);
  const uspStr = usp.size > 0 ? `?${usp}` : "";

  return chrome.runtime.getURL(`main.html#${path}${uspStr}`);
}
