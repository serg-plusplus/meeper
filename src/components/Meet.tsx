import classNames from "clsx";
import { useState, useRef, useEffect } from "preact/hooks";

import MeetHeader from "./MeetHeader";
import { loadWhisper } from "../lib/whisper";
import { startMicrophone, stopMicrophone } from "../lib/microphone";

export default function Meet() {
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [content, setContent] = useState<string[]>([]);

  const wsprRef = useRef<any>();
  const transcribeIntervalRef = useRef<ReturnType<typeof setInterval>>();

  const toggle = async () => {
    if (loading) return;
    setLoading(true);

    try {
      if (!recording) {
        if (!wsprRef.current) {
          const wspr = await loadWhisper(
            "https://whisper.ggerganov.com/ggml-model-whisper-base.bin",
            142,
            (p) => console.info("Progress:", p)
          );
          const instance = wspr.init("whisper.bin");

          wsprRef.current = { wspr, instance };
        }

        const { wspr, instance } = wsprRef.current;

        wspr.set_status("");

        startMicrophone((audio) => {
          if (instance) {
            wspr.set_audio(instance, audio);
          }
        });

        transcribeIntervalRef.current = setInterval(function () {
          const transcribed = wspr.get_transcribed();

          if (transcribed != null && transcribed.length > 1) {
            setContent((c) => [...c, transcribed]);
          }
        }, 100);

        setRecording(true);
      } else {
        clearInterval(transcribeIntervalRef.current);
        wsprRef.current?.wspr.set_status("paused");
        stopMicrophone();
        setTimeout(() => setRecording(false), 500);
      }
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  useEffect(
    () => () => {
      clearInterval(transcribeIntervalRef.current);
    },
    []
  );

  return (
    <div className="min-h-screen flex flex-col">
      <MeetHeader
        rightSide={
          <button
            type="button"
            className={classNames(
              "px-2 py-1 text-lg font-semibold rounded-md border border-slate-200",
              loading && "opacity-75 cursor-wait"
            )}
            onClick={() => toggle()}
            disabled={loading}
          >
            {!recording ? "Record" : "Stop"}
          </button>
        }
      />
      <main className="flex-1 container mx-auto max-w-3xl p-8 grow bg-white">
        <article className="prose prose-slate lg:prose-xl">
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
