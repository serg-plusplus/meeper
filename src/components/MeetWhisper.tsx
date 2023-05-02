import { useState, useRef, useEffect } from "react";
import classNames from "clsx";

import MeetHeader from "./MeetHeader";
import { loadWhisper } from "../lib/whisper/offline";
// import { useWhisper } from "../lib/use-whisper";
// import { captureAudio } from "../lib/captureAudio";
import {
  Streams,
  detectSpeechEnd,
  prepareStreams,
  recordAudio,
} from "../lib/capture-audio";
import { RecordType } from "../core/types";
import { requestWhisperOpenaiApi } from "../lib/whisper/openaiApi";
import { retry } from "../lib/system";

const usp = new URLSearchParams(location.hash.substring(1));
const tabId = +usp.get("tabid")!;
const recordType = usp.get("rectype") as RecordType;

export default function Meet() {
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);

  const [streams, setStreams] = useState<Streams>({});
  const [content, setContent] = useState<string[]>([]);

  const wsprRef = useRef<any>();
  const stopAudioCaptureRef = useRef<() => void>();
  const transcribeTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!tabId || !recordType) return;

    Promise.all([
      recordType !== RecordType.MicOnly ? tabCapture() : null,
      recordType !== RecordType.StereoOnly
        ? navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        : null,
    ])
      .then(([tabCaptureStream, micStream]) => {
        setStreams({ tabCaptureStream, micStream });
      })
      .catch(console.error);
  }, [setStreams]);

  useEffect(() => {
    if (Object.values(streams).filter(Boolean).length > 0) {
      start();
    }
  }, [streams]);

  const start = async () => {
    if (loading || recording) return;

    setLoading(true);

    try {
      const { micStream, tabCaptureStream } = streams;
      if (!micStream && !tabCaptureStream) throw new Error("No audio");

      const audioCtx = new AudioContext();
      const fullStream = prepareStreams(audioCtx, {
        micStream,
        tabCaptureStream,
      });

      let stopRecord: (() => void) | undefined;

      const restartRecord = () => {
        stopRecord?.();

        stopRecord = recordAudio({
          fullStream,
          onAudio: async (audioFile) => {
            // console.info("AUDIO ready", audio.length);

            setRecording(true);

            try {
              const text = await retry(
                () =>
                  requestWhisperOpenaiApi(audioFile, "transcriptions", {
                    apiKey: process.env.OPENAI_API_KEY,
                    prompt: content[content.length - 1],
                    // language: "auto",
                  }),
                100,
                3
              );

              if (!text) return;

              setContent((cnt) => {
                let lastItem = cnt[cnt.length - 1];
                if (lastItem && lastItem.endsWith("...")) {
                  lastItem = lastItem.trim();

                  return [
                    ...cnt,
                    `${lastItem.slice(0, lastItem.length - 3)} ${text}`,
                  ];
                }

                return [...cnt, text];
              });
            } catch (err) {
              console.error(err);
            }
          },
          onError: console.error,
          onStop: restartRecord,
        });
      };

      let kek = performance.now();

      const stopSpeechDetector = detectSpeechEnd({
        audioCtx,
        fullStream,
        onSpeechEnd() {
          console.info("Speech detected", performance.now() - kek);
          kek = performance.now();
          stopRecord?.();
        },
      });

      restartRecord();

      // await startRecording(fullStream);
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  const startOld = async () => {
    if (loading || recording) return;
    setLoading(true);

    const currentTab = await chrome.tabs.getCurrent();
    await chrome.tabs.update(currentTab!.id!, { active: true });

    let kek = 0;

    try {
      const lang = prompt("Language?", "en");

      if (!wsprRef.current) {
        const wspr = await loadWhisper(
          lang === "en"
            ? "https://whisper.ggerganov.com/ggml-model-whisper-base.en.bin"
            : "https://whisper.ggerganov.com/ggml-model-whisper-base.bin",
          142,
          // chrome.runtime.getURL("uk.small.bin"),
          // 465,
          (p) => console.info("Progress:", p),
          console.info
        );
        const instance = wspr.init("whisper.bin", lang, 0);

        wsprRef.current = { wspr, instance };
      }

      const { wspr, instance } = wsprRef.current;

      // captureAudio(streams, (audio) => {
      //   if (instance) {
      //     console.info("Audio here", audio.length);
      //     kek = performance.now();

      //     wspr.set_audio(instance, audio);
      //   }
      // });

      const getTranscribedAndDefer = () => {
        const transcribed = wspr.get_transcribed();

        if (transcribed != null && transcribed.length > 1) {
          console.info("!Transcribed", performance.now() - kek);

          setContent((c) => [...c, transcribed]);
        }

        transcribeTimeoutRef.current = setTimeout(getTranscribedAndDefer, 250);
      };

      getTranscribedAndDefer();
      setRecording(true);
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  const stop = () => {
    if (loading || !recording) return;

    cleanup();

    for (const stream of Object.values(streams)) {
      if (!stream) continue;
      for (const track of stream.getTracks()) {
        track.stop();
      }
    }

    setStreams({});
    setTimeout(() => setRecording(false), 300);
  };

  const cleanup = () => {
    // wsprRef.current?.wspr.free();
    stopAudioCaptureRef.current?.();
    clearTimeout(transcribeTimeoutRef.current);
  };

  useEffect(() => cleanup, []);

  return (
    <div className="min-h-screen flex flex-col">
      <MeetHeader
        rightSide={
          recording ? (
            <button
              type="button"
              className={classNames(
                "px-2 py-1 text-lg font-semibold rounded-md border border-slate-200",
                loading && "opacity-75 cursor-wait"
              )}
              onClick={() => stop()}
              disabled={loading}
            >
              Stop
            </button>
          ) : null
        }
      />
      <main className="flex-1 container mx-auto max-w-3xl p-8 grow bg-white">
        <article className="prose prose-slate">
          {content.length > 0
            ? content.map((item, i) => <p key={i}>{item}</p>)
            : recording
            ? "Just say something..."
            : "Press record to start playing!"}
        </article>
      </main>
    </div>
  );
}

function tabCapture() {
  return new Promise<MediaStream | null>((resolve) => {
    chrome.tabCapture.capture(
      {
        audio: true,
        video: false,
      },
      (stream) => {
        resolve(stream);
      }
    );
  });
}

// Other models

// "https://whisper.ggerganov.com/ggml-model-whisper-small.en.bin",
// 466,
// "https://whisper.ggerganov.com/ggml-model-whisper-medium.en-q4_0.bin",
// 469,
// "https://whisper.ggerganov.com/ggml-model-whisper-small.en-q4_0.bin",
// 152,
