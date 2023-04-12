// import { WebAssemblyRecorder } from "recordrtc";

// navigator.mediaDevices
//   .getUserMedia({
//     audio: true,
//   })
//   .then(async function (stream) {
//     let recorder: any = new WebAssemblyRecorder(stream, {
//       type: "audio",
//     });
//     recorder.record();

//     const sleep = (m: number) => new Promise((r) => setTimeout(r, m));
//     await sleep(3000);

//     recorder.stop((blob: any) => {
//       const audioURL = URL.createObjectURL(blob);
//       console.info({ audioURL });
//       const el = document.createElement("audio");
//       el.src = audioURL;
//       el.autoplay = true;
//       document.body.appendChild(el);
//     });
//   });

function saveToFile(blob: any, name: any) {
  const url = URL.createObjectURL(blob);
  console.info(url);

  const el = document.createElement("audio");
  el.src = url;
  el.autoplay = true;
  document.body.appendChild(el);
  // const a = document.createElement("a");
  // document.body.appendChild(a);
  // a.style = "display: none";
  // a.href = url;
  // a.download = name;
  // a.click();
  // URL.revokeObjectURL(url);
  // a.remove();
}

function captureTabAudio() {
  chrome.tabCapture.capture({ audio: true, video: false }, (stream: any) => {
    // these lines enable the audio to continue playing while capturing
    let context = new AudioContext();
    var newStream = context.createMediaStreamSource(stream);
    newStream.connect(context.destination);

    const recorder = new MediaRecorder(stream);
    const chunks: any[] = [];
    recorder.ondataavailable = (e) => {
      chunks.push(e.data);
    };
    recorder.onstop = (e) => saveToFile(new Blob(chunks), "test.wav");
    recorder.start();
    setTimeout(() => recorder.stop(), 3000);
  });
}

(window as any).captureTabAudio = captureTabAudio;
