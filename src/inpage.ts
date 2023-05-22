export {};

injectAndRetry();

function injectAndRetry() {
  try {
    injectButton();
  } catch {}

  setTimeout(injectAndRetry, 250);
}

function injectButton() {
  const containerNode = document.querySelector(
    `[style="inset: 16px 16px 80px;"]`
  )?.firstChild;
  if (!containerNode) return;
  if (
    (containerNode.lastChild as HTMLButtonElement)?.dataset?.meeper === "true"
  )
    return;

  (containerNode as HTMLDivElement).style.position = "relative";

  const button = document.createElement("button");

  button.dataset.meeper = "true";
  button.type = "button";
  button.style.backgroundImage = `url('${MEEPER_BASE64}')`;
  button.style.backgroundRepeat = "no-repeat";
  button.style.backgroundSize = "100% auto";
  button.style.width = "5rem";
  button.style.height = "5rem";
  button.style.position = "absolute";
  button.style.right = "2rem";
  button.style.bottom = "2rem";
  button.style.border = "none";
  button.style.backgroundColor = "transparent";
  button.id = "meeper-toggle";

  (containerNode as HTMLDivElement).append(button);

  // const micNode = document.querySelectorAll("[data-is-muted=false]")![0];
  // const toolbarNode = micNode.parentNode!.parentNode!.parentNode!;

  // if ((toolbarNode.firstChild as HTMLButtonElement)?.dataset?.meeper === "true")
  //   return;

  // const button = document.createElement("button");
  // button.dataset.meeper = "true";
  // button.type = "button";
  // button.textContent = "R";
  // button.style.display = "inline-flex";
  // button.style.alignItems = "center";
  // button.style.justifyContent = "center";
  // button.style.borderRadius = "100%";
  // button.style.backgroundColor = "rgb(60,64,67)";
  // button.style.color = "white";
  // button.style.fontWeight = "bold";
  // button.style.borderWidth = "0";
  // button.style.height = "2.5rem";
  // button.style.width = "2.5rem";
  // button.id = "meeper-toggle";

  // button.onclick = (evt) => {
  //   window.postMessage({ target: "meeper", type: "start-listen" });

  // navigator.mediaDevices
  //   .getUserMedia({
  //     video: false,
  //     audio: true,
  //     // audio: {
  //     //   mandatory: {
  //     //     chromeMediaSource: "tab",
  //     //     chromeMediaSourceId: request.streamId,
  //     //   },
  //     // } as any,
  //   })
  //   .then((stream) => {
  //     // To resolve original audio muting
  //     // const context = new AudioContext();
  //     // var audio = context.createMediaStreamSource(stream);
  //     // audio.connect(context.destination);

  //     const recorder = new MediaRecorder(stream);
  //     const chunks = [];
  //     recorder.ondataavailable = (e) => {
  //       chunks.push(e.data);
  //       console.info("e.data", e.data);
  //     };

  //     setTimeout(() => {
  //       recorder.stop();
  //     }, 3_000);
  //   });
  // };

  // toolbarNode.prepend(button);
}

const MEEPER_BASE64 = `data:image/png;base64,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`;
