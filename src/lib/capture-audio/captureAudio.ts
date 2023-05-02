import { detectSpeechEnd } from "./detectSpeech";
import { recordAudio } from "./record";

export function captureAudio(
  stream: MediaStream,
  audioCtx: AudioContext,
  onAudio: (f: File) => void
) {
  let stopRecord: (() => void) | undefined;

  const restartRecord = () => {
    stopRecord?.();

    stopRecord = recordAudio({
      stream,
      onAudio: onAudio,
      onError: console.error,
    });
  };

  const stopSpeechDetect = detectSpeechEnd({
    audioCtx,
    stream,
    onSpeechStart() {
      // console.info("START Speech");
      restartRecord();
    },
    onSpeechEnd() {
      // console.info("END Speech");
      stopRecord?.();
    },
  });

  return () => {
    stopSpeechDetect();
    stopRecord?.();
  };
}
