export function buildMainURL(path = "/", params: Record<string, any> = {}) {
  const usp = new URLSearchParams(params);
  return chrome.runtime.getURL(`main.html#${path}?${usp}`);
}
