import classNames from "clsx";
import { useState, useRef, useEffect } from "preact/hooks";

import MeetHeader from "./MeetHeader";
import { loadWhisper } from "../lib/whisper";
import { captureAudio, Streams } from "../lib/captureAudio";
import { RecordType } from "../core/types";

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

    const currentTab = await chrome.tabs.getCurrent();
    await chrome.tabs.update(currentTab!.id!, { active: true });

    try {
      if (!wsprRef.current) {
        const lang = prompt("Language?", "en");

        const wspr = await loadWhisper(
          lang === "en"
            ? "https://whisper.ggerganov.com/ggml-model-whisper-base.en.bin"
            : "https://whisper.ggerganov.com/ggml-model-whisper-base.bin",
          142,
          (p) => console.info("Progress:", p),
          console.info
        );
        const instance = wspr.init("whisper.bin", lang);

        wsprRef.current = { wspr, instance };
      }

      const { wspr, instance } = wsprRef.current;

      wspr.set_status("");

      stopAudioCaptureRef.current = captureAudio(streams, (audio) => {
        if (instance) {
          wspr.set_audio(instance, audio);
        }
      });

      const getTranscribedAndDefer = () => {
        const transcribed = wspr.get_transcribed();

        if (transcribed != null && transcribed.length > 1) {
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
    wsprRef.current?.wspr.set_status("paused");
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
