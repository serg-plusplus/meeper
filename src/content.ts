export {};

// Listen messages from InpageScript and redirect to ContentScript
window.addEventListener(
  "message",
  (evt) => {
    if (
      evt.source === window &&
      evt.origin === location.origin &&
      evt.data?.target === "meeper" &&
      evt.data?.to === "content"
    ) {
      chrome.runtime.sendMessage(evt.data);
    }
  },
  false
);

let debounceTimeout: ReturnType<typeof setTimeout>;

// Listen messages from ContentScript and redirect to InpageScript
chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.target !== "meeper") return;

  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    window.postMessage({ ...msg, to: "inpage" }, location.origin);
  }, 100);
});
