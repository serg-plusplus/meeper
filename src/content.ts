export {};

// window.onmessage = (evt) => {
//   if (evt.data?.target === "meeper") {
//     // chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
//     //   const tab = tabs[0];
//     //   if (!tab) return;

//     //   chrome.tabCapture.getMediaStreamId(
//     //     { consumerTabId: tab.id },
//     //     (streamId) => {
//     //       console.info({ streamId });
//     //     }
//     //   );
//     // });

//     chrome.runtime.sendMessage(evt.data);
//   }
// };

// setTimeout(() => {
//   (document.getElementById("meeper-toggle") as any).onclick = () => {
//     chrome.runtime.sendMessage({ target: "meeper", type: "start-listen" });
//   };
// }, 1000);
