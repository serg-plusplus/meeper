// web audio context
let audioCtx: AudioContext | null = null;

// audio data
let audio: Float32Array | null = null;
let audio0: Float32Array | null = null;

//
// microphone
//

const kSampleRate = 16000;
const kRestartRecording_s = 120;
const kIntervalAudio_ms = 5000; // pass the recorded audio to the C++ instance at this rate

let mediaRecorder: MediaRecorder | null = null;
let doRecording = false;
// let startTime = 0;

export function stopMicrophone() {
  // Module.set_status("paused");
  doRecording = false;
  audio0 = null;
  audio = null;
  audioCtx = null;
}

export function startMicrophone(
  onAudio: (a: Float32Array) => void,
  log: (...m: string[]) => void = console.info
) {
  if (!audioCtx) {
    audioCtx = new AudioContext({
      sampleRate: kSampleRate,
      channelCount: 1,
      echoCancellation: false,
      autoGainControl: true,
      noiseSuppression: true,
    } as any);
  }

  // Module.set_status("");

  // document.getElementById("start").disabled = true;
  // document.getElementById("stop").disabled = false;

  doRecording = true;
  // startTime = Date.now();

  const chunks: Blob[] = [];
  let stream: MediaStream | null = null;

  navigator.mediaDevices
    .getUserMedia({ audio: true, video: false })
    .then((s) => {
      stream = s;
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = (evt) => {
        chunks.push(evt.data);

        const blob = new Blob(chunks, { type: "audio/ogg; codecs=opus" });
        const reader = new FileReader();

        reader.onload = () => {
          const buf = new Uint8Array(reader.result as ArrayBuffer); // TODO: Is it really always ArrayBuffer?

          if (!audioCtx) {
            return;
          }
          audioCtx.decodeAudioData(
            buf.buffer,
            (audioBuffer) => {
              const offlineContext = new OfflineAudioContext(
                audioBuffer.numberOfChannels,
                audioBuffer.length,
                audioBuffer.sampleRate
              );
              const source = offlineContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(offlineContext.destination);
              source.start(0);

              offlineContext.startRendering().then((renderedBuffer) => {
                audio = renderedBuffer.getChannelData(0);

                //printTextarea('audio recorded, size: ' + audio.length + ', old size: ' + (audio0 == null ? 0 : audio0.length));

                const audioAll = new Float32Array(
                  audio0 == null ? audio.length : audio0.length + audio.length
                );
                if (audio0 != null) {
                  audioAll.set(audio0, 0);
                }
                audioAll.set(audio, audio0 == null ? 0 : audio0.length);

                onAudio(audioAll);

                // if (instance) {
                //   Module.set_audio(instance, audioAll);
                // }
              });
            },
            () => {
              audio = null;
            }
          );
        };

        reader.readAsArrayBuffer(blob);
      };

      mediaRecorder.onstop = () => {
        if (doRecording) {
          setTimeout(() => {
            startMicrophone(onAudio, log);
          });
        }
      };

      mediaRecorder.start(kIntervalAudio_ms);
    })
    .catch((err) => {
      log("error getting audio stream: " + err);
    });

  const interval = setInterval(() => {
    if (!doRecording) {
      clearInterval(interval);
      mediaRecorder?.stop();
      stream?.getTracks().forEach((track) => {
        track.stop();
      });

      // document.getElementById("start").disabled = false;
      // document.getElementById("stop").disabled = true;

      mediaRecorder = null;
    }

    // if audio length is more than kRestartRecording_s seconds, restart recording
    if (audio != null && audio.length > kSampleRate * kRestartRecording_s) {
      if (doRecording) {
        // printTextarea('restarting recording');

        clearInterval(interval);
        audio0 = audio;
        audio = null;
        mediaRecorder?.stop();
        stream?.getTracks().forEach((track) => {
          track.stop();
        });
      }
    }
  }, 100);
}
