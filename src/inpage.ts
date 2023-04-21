export {};

injectAndRetry();

function injectAndRetry() {
  try {
    injectButton();
  } catch {}

  setTimeout(injectAndRetry, 250);
}

function injectButton() {
  const micNode = document.querySelectorAll("[data-is-muted=false]")![0];
  const toolbarNode = micNode.parentNode!.parentNode!.parentNode!;

  if ((toolbarNode.firstChild as HTMLButtonElement)?.dataset?.meeper === "true")
    return;

  const button = document.createElement("button");
  button.dataset.meeper = "true";
  button.type = "button";
  button.textContent = "R";
  button.style.display = "inline-flex";
  button.style.alignItems = "center";
  button.style.justifyContent = "center";
  button.style.borderRadius = "100%";
  button.style.backgroundColor = "rgb(60,64,67)";
  button.style.color = "white";
  button.style.fontWeight = "bold";
  button.style.borderWidth = "0";
  button.style.height = "2.5rem";
  button.style.width = "2.5rem";
  button.id = "meeper-toggle";

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

  toolbarNode.prepend(button);
}
