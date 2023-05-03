import { detectSpeechEnd } from "./detectSpeech";
import { recordAudio } from "./record";

export function captureAudio({
  stream,
  audioCtx,
  onAudio,
  minChunkDuration = 5_000,
}: {
  stream: MediaStream;
  audioCtx: AudioContext;
  onAudio: (f: File) => void;
  minChunkDuration?: number;
}) {
  let startedAt: number;
  let chunks: Blob[] = [];
  let stopRecord: (() => void) | undefined;

  const onDataAvailable = async (evt: BlobEvent) => {
    chunks.push(evt.data);

    if (Date.now() - startedAt < minChunkDuration) return;

    // console.info("ON AUDIO", chunks.length);

    const blob = new Blob(chunks, { type: "audio/webm;codecs=opus" });
    const file = new File([blob], "meeper_chunk.webm", {
      type: "audio/webm",
    });

    startedAt = Date.now();
    chunks = [];

    onAudio(file);
  };

  const startRecord = () => {
    // stopRecord?.();

    if (!startedAt) {
      startedAt = Date.now();
    }

    stopRecord = recordAudio({
      stream,
      onDataAvailable,
      onError: console.error,
    });
  };

  const stopSpeechDetect = detectSpeechEnd({
    audioCtx,
    stream,
    onSpeechStart() {
      // console.info("START Speech");
      startRecord();
    },
    onSpeechEnd() {
      // console.info("END Speech");
      setTimeout(stopRecord!, 30);
    },
  });

  return () => {
    stopSpeechDetect();
    stopRecord?.();
  };
}
