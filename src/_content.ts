export {};

let audioChunks: any = [];
let mediaRecorder: any;

(window as any).meetTrans = {
  startRecord: () => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.start();

      mediaRecorder.addEventListener("dataavailable", (event: any) => {
        audioChunks.push(event.data);
      });
    });
  },
  stopRecord: () => {
    mediaRecorder.stop();
    return audioChunks;
  },
};

function saveToFile(blob: any, name: any) {
  const url = URL.createObjectURL(blob);
  console.info(url);
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

// let state: null | {
//   stream: MediaStream;
//   mediaRecorder: MediaRecorder;
//   audioBlobs: any[];
// } = null;

// async function startRecord() {
//   if (state) throw new Error("Already recording...");

//   if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
//     throw new Error(
//       "mediaDevices API or getUserMedia method is not supported in this browser."
//     );
//   } else {
//     const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

//     const mediaRecorder = new MediaRecorder(stream);

//     state = {
//       stream,
//       mediaRecorder,
//       audioBlobs: [],
//     };

//     //add a dataavailable event listener in order to store the audio data Blobs when recording
//     mediaRecorder.addEventListener("dataavailable", (event) => {
//       //store audio Blob object
//       state!.audioBlobs.push(event.data);
//     });

//     mediaRecorder.start();

//     return state;
//   }
// }

// async function stopRecord() {
//   if (!state) throw new Error("No recording");

//   const mimeType = state.mediaRecorder.mimeType;

//   state.mediaRecorder.addEventListener("stop", () => {
//     const audioBlob = new Blob(state!.audioBlobs, { type: mimeType });

//     console.info("HERE");

//     const reader = new FileReader();
//     reader.onload = (e) => {
//       const base64URL = e.target!.result;
//       console.info(base64URL);
//     };

//     reader.readAsDataURL(audioBlob);
//   });

//   state.mediaRecorder.stop();

//   state.stream.getTracks().forEach((track) => track.stop());

//   state = null;
// }

// (window as any).meetTrans = {
//   startRecord,
//   stopRecord,
// };

// function playAudio(audioBlob: Blob) {
//   const reader = new FileReader();

//   reader.onload = (e) => {
//     const base64URL = e.target!.result;

//     const a = document.createElement("a");
//     a.style.display = "none";
//     a.href = base64URL as string;
//     // the filename you want
//     a.download = `kek`;
//     document.body.appendChild(a);
//     a.click();
//     window.URL.revokeObjectURL(base64URL as string);
//   };

//   reader.readAsDataURL(audioBlob);
// }
