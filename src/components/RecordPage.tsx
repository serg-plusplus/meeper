import { useState, useEffect, useRef } from "react";
import classNames from "clsx";

import { RecordType } from "../core/types";
import { MeeperRecorder, MeeperState, recordMeeper } from "../core/meeper";

import RecordHeader from "./RecordHeader";
import FatalError from "./FatalError";

export default function RecordPage({
  tabId,
  recordType,
}: {
  tabId: number;
  recordType: string;
}) {
  const meeperRef = useRef<MeeperRecorder>();
  const [meeperState, setMeeperState] = useState<MeeperState>();
  const [fatalError, setFatalError] = useState<Error | string | null>(null);
  const [closing, setClosing] = useState(false);

  const meeper = meeperRef.current;
  const isActive = meeper?.stream.active;
  const { recording = false, content = [] } = meeperState ?? {};

  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // 👇️ scroll to bottom every time content change
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [content.length]);

  useEffect(() => {
    if (
      !tabId ||
      !recordType ||
      !Object.values(RecordType).includes(recordType as any)
    ) {
      window.close();
      return;
    }

    recordMeeper(tabId, recordType as RecordType, setMeeperState)
      .then((meeper) => {
        meeperRef.current = meeper;
      })
      .catch((err) => {
        console.error(err);
        setFatalError(err);
      });
  }, [tabId, recordType, setMeeperState, setFatalError]);

  useEffect(() => {
    // Handle stop
    if (meeper && !isActive) {
      setClosing(true);
      setTimeout(() => window.close(), 3_000);
    }
  }, [meeper, isActive]);

  useEffect(() => meeperRef.current?.stop, []);

  if (fatalError) {
    return <FatalError error={fatalError} />;
  }

  if (!meeper) return;

  return (
    <div
      className={classNames(
        "min-h-screen flex flex-col",
        closing && "opacity-75 cursor-wait"
      )}
    >
      <RecordHeader
        meeper={meeper}
        recordType={recordType as RecordType}
        recording={recording}
      />

      <main className="flex-1 container mx-auto max-w-3xl px-4 py-8 grow bg-white">
        <article className="mx-auto prose prose-slate">
          {content.length > 0
            ? content.map((item, i) => <p key={i}>{item}</p>)
            : "Waiting for audio..."}
        </article>
      </main>

      <div ref={bottomRef} />
    </div>
  );
}
