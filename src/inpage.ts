export {};

const kek = () => {
  const CAPTIONS_SELECTOR =
    "#ow3 > div.T4LgNb > div > div:nth-child(9) > div.crqnQb > div.a4cQT > div:nth-child(1) > div:nth-child(1)";
  const lastOf = <T extends unknown>(list?: T[]) =>
    list ? list[list.length - 1] : null;

  const removeLast = <T extends unknown>(list: T[]) =>
    list.splice(0, list.length - 1);

  type CaptionLine = string;

  const capLine: CaptionLine[] = [];

  const getCaptionsFeed = () => capLine;
  // JSON.parse(localStorage.getItem("captions-feed") || "[]") as CaptionLine[];

  const setMessagesFeed = (msgs: CaptionLine[]) => {
    capLine.push(...msgs);
    console.info(capLine);
  };
  // localStorage.setItem("captions-feed", JSON.stringify(msgs));

  const addToCaptionsFeed = (newCaption?: CaptionLine | null) => {
    if (!newCaption) return;
    const pastMessages = getCaptionsFeed();
    const lastCaption = lastOf(pastMessages);
    if (lastCaption && newCaption.includes(lastCaption)) {
      setMessagesFeed([...removeLast(pastMessages), newCaption]);
      return;
    }
    setMessagesFeed([...pastMessages, newCaption]);
  };

  const callback: MutationCallback = function (mutationsList, observer) {
    // Use traditional 'for loops' for IE 11
    mutationsList.forEach(onReceiveMutation);
  };

  const observer = new MutationObserver(callback);

  // const targetNode = document.querySelector(CAPTIONS_SELECTOR);
  const targetNode = document.querySelector(`[jsname=dsyhDe]`);
  console.info({ targetNode });

  const config = { attributes: true, childList: true, subtree: true };

  const getMessageFromMutationRecord = async (update: MutationRecord) => {
    return update.target.textContent;
  };
  const onReceiveMutation = (m: MutationRecord) => {
    console.info("received");
    if (m.type === "childList") {
      getMessageFromMutationRecord(m).then(addToCaptionsFeed);
    }
  };

  if (!targetNode) throw new Error("No found");

  console.info("Found");

  observer.observe(targetNode, config);

  // const startObserving = () => {
  //   targetNode
  //     ? observer.observe(targetNode, config)
  //     : console.log("node not found");
  //   return observer;
  // };
  // const stopObserving = () => observer.disconnect();

  // startObserving();
};

injectAndRetry();

function injectAndRetry() {
  try {
    kek();
  } catch {
    setTimeout(injectAndRetry, 250);
  }
}

// let script: string[] = [];
// let last_speaker = "";

// function kek() {
//   // DOM element containing all subtitles
//   const subtitleDiv = document.querySelector("div[jscontroller='TEjq6e']");
//   console.info({ subtitleDiv });

//   if (!subtitleDiv) throw new Error("No found");

//   console.info("FOund");

//   const subtitleObserver = new MutationObserver((mutations) => {
//     mutations.forEach((mutation) => {
//       if (
//         (mutation.target as any).classList &&
//         (mutation.target as any).classList.contains("iTTPOb")
//       ) {
//         if (mutation.addedNodes.length) {
//           var newNodes = mutation.addedNodes;
//           var speaker =
//             newNodes["0"]?.parentNode?.parentNode?.parentNode?.querySelector(
//               ".zs7s8d.jxFHg"
//             )?.textContent;
//           if (speaker) {
//             setTimeout(function () {
//               if (newNodes.length) {
//                 if (last_speaker != speaker) {
//                   script.push(
//                     speaker + " : " + (newNodes["0"] as any).innerText + "\r\n"
//                   );
//                   last_speaker = speaker!;
//                 } else {
//                   let lastText = script.pop();
//                   lastText = lastText?.slice(0, -2);
//                   lastText =
//                     lastText + (newNodes["0"] as any).innerText + "\r\n";
//                   script.push(lastText);
//                 }

//                 chrome.storage.sync.set({
//                   script: script,
//                 });
//               }
//             }, 10000);
//           }
//         }
//       }
//     });
//   });

//   // Start observing subtitle div
//   subtitleObserver.observe(subtitleDiv, {
//     childList: true,
//     subtree: true,
//     attributes: false,
//     characterData: false,
//   });
// }

// injectAndRetry();

// function injectAndRetry() {
//   try {
//     injectButton();
//   } catch {}

//   setTimeout(injectAndRetry, 250);
// }

// function injectButton() {
//   const micNode = document.querySelectorAll("[data-is-muted=false]")![0];
//   const toolbarNode = micNode.parentNode!.parentNode!.parentNode!;

//   if ((toolbarNode.firstChild as HTMLButtonElement)?.dataset?.meeper === "true")
//     return;

//   const button = document.createElement("button");
//   button.dataset.meeper = "true";
//   button.type = "button";
//   button.textContent = "R";
//   button.style.display = "inline-flex";
//   button.style.alignItems = "center";
//   button.style.justifyContent = "center";
//   button.style.borderRadius = "100%";
//   button.style.backgroundColor = "rgb(60,64,67)";
//   button.style.color = "white";
//   button.style.fontWeight = "bold";
//   button.style.borderWidth = "0";
//   button.style.height = "2.5rem";
//   button.style.width = "2.5rem";
//   button.id = "meeper-toggle";

//   // button.onclick = (evt) => {
//   //   window.postMessage({ target: "meeper", type: "start-listen" });

//   // navigator.mediaDevices
//   //   .getUserMedia({
//   //     video: false,
//   //     audio: true,
//   //     // audio: {
//   //     //   mandatory: {
//   //     //     chromeMediaSource: "tab",
//   //     //     chromeMediaSourceId: request.streamId,
//   //     //   },
//   //     // } as any,
//   //   })
//   //   .then((stream) => {
//   //     // To resolve original audio muting
//   //     // const context = new AudioContext();
//   //     // var audio = context.createMediaStreamSource(stream);
//   //     // audio.connect(context.destination);

//   //     const recorder = new MediaRecorder(stream);
//   //     const chunks = [];
//   //     recorder.ondataavailable = (e) => {
//   //       chunks.push(e.data);
//   //       console.info("e.data", e.data);
//   //     };

//   //     setTimeout(() => {
//   //       recorder.stop();
//   //     }, 3_000);
//   //   });
//   // };

//   toolbarNode.prepend(button);
// }
