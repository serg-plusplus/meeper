import {
  useState,
  useEffect,
  useCallback,
  ReactNode,
  useRef,
  useMemo,
} from "react";
import classNames from "clsx";

import RecordHeader from "./RecordHeader";
import { Streams, prepareStreams, captureAudio } from "../lib/capture-audio";
import { requestWhisperOpenaiApi } from "../lib/whisper/openaiApi";
import { retry, promiseQueue } from "../lib/system";
import { getSummary } from "../lib/summary";
import { RecordType } from "../core/types";

const audioCtx = new AudioContext();

export default function RecordPage({
  tabId,
  recordType,
}: {
  tabId: string;
  recordType: string;
}) {
  const [fullStream, setFullStream] = useState<MediaStream>();
  const [content, setContent] = useState<string[]>([]);
  const [_fatalError, setFatalError] = useState<ReactNode>();
  const [stopCaptureAudio, setStopCaptureAudio] = useState<() => void>();

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 👇️ scroll to bottom every time content change
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [content]);

  // useEffect(() => {
  //   chrome.storage.local.get("kek").then(({ kek }) => {
  //     if (Array.isArray(kek)) {
  //       setContent(kek);
  //     }
  //   });
  // }, [setContent]);

  const canRecord = Boolean(fullStream?.active);
  const recording = canRecord && Boolean(stopCaptureAudio);

  const withQueue = useMemo(promiseQueue, []);

  const contentRef = useRef(content);
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  const canRecordRef = useRef(canRecord);
  useEffect(() => {
    canRecordRef.current = canRecord;
  }, [canRecord]);

  // Boot
  // Get streams
  useEffect(() => {
    if (
      !tabId ||
      !recordType ||
      !Object.values(RecordType).includes(recordType as any)
    ) {
      window.close();
      return;
    }

    getStreams(recordType as RecordType)
      .then((streams) => {
        const fullStream = prepareStreams(audioCtx, streams);

        Object.assign(window, { fullStream });

        setFullStream(fullStream);
      })
      .catch((err) => {
        console.error(err);
        setFatalError(err.message);
      });
  }, [tabId, recordType, setFullStream, setFatalError]);

  const onAudio = useCallback(
    (audioFile: File) => {
      const cnt = contentRef.current;
      const whisperPrompt = cnt.slice(cnt.length - 3, cnt.length).join("\n");

      const textPromise = retry(
        () =>
          requestWhisperOpenaiApi(audioFile, "transcriptions", {
            apiKey: process.env.OPENAI_API_KEY,
            prompt: whisperPrompt,
            // language: "en",
          }),
        100,
        2
      );

      return withQueue(async () => {
        try {
          const text = await textPromise;
          if (!text) return;

          if (!canRecordRef.current) return;

          setContent((cnt) => {
            const lastItem = cnt[cnt.length - 1]?.trim();

            if (lastItem && lastItem.endsWith("...")) {
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
      });
    },
    [setContent]
  );

  const start = useCallback(async () => {
    if (recording || !fullStream?.active) return;

    const stopCaptureAudio = captureAudio({
      stream: fullStream,
      audioCtx,
      onAudio,
    });

    setStopCaptureAudio(() => stopCaptureAudio);
  }, [recording, fullStream, setStopCaptureAudio, onAudio]);

  const startRef = useRef(start);
  useEffect(() => {
    startRef.current = start;
  }, [start]);

  // Auto start
  useEffect(() => {
    if (fullStream) {
      startRef.current?.();
    }
  }, [fullStream]);

  const pause = useCallback(() => {
    if (!recording) return;

    setStopCaptureAudio((clean) => {
      clean?.();
      return undefined;
    });
  }, [recording, setStopCaptureAudio]);

  const stop = useCallback(async () => {
    if (!recording) return;

    pause();

    if (fullStream) {
      for (const track of fullStream.getTracks()) {
        track.stop();
      }
    }

    setFullStream(undefined);

    // await chrome.storage.local.set({ kek: content });
    setContent(["Generating summary..."]);
    const summary = await getSummary(content);
    setContent([summary]);
  }, [recording, pause, fullStream, setFullStream, content]);

  return (
    <div className="min-h-screen flex flex-col">
      <RecordHeader
        rightSide={
          canRecord && (
            <>
              <button
                type="button"
                className={classNames(
                  "px-2 py-1 text-lg font-semibold rounded-md border border-slate-200 mr-4"
                )}
                onClick={() => (recording ? pause() : start())}
              >
                {recording ? "Pause" : "Continue"}
              </button>

              <button
                type="button"
                className={classNames(
                  "px-2 py-1 text-lg font-semibold rounded-md border border-slate-200"
                )}
                onClick={() => stop()}
              >
                Stop
              </button>
            </>
          )
        }
      />
      <main className="flex-1 container mx-auto max-w-3xl p-8 grow bg-white">
        <article className="prose prose-slate">
          {content.length > 0
            ? content.map((item, i) => <p key={i}>{item}</p>)
            : recording
            ? "Recording..."
            : "Loading..."}
        </article>
      </main>

      <div ref={bottomRef} />
    </div>
  );
}

async function getStreams(recordType: RecordType): Promise<Streams> {
  const [tabCaptureStream, micStream] = await Promise.all([
    recordType !== RecordType.MicOnly ? tabCapture() : null,
    recordType !== RecordType.StereoOnly
      ? navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      : null,
  ]);

  return { tabCaptureStream, micStream };
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
