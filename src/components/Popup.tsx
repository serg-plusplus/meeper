import { useRef } from "react";
import classNames from "clsx";

import { MsgType, RecordType } from "../core/types";
import History from "./History";

export default function Popup() {
  const recordingRef = useRef(false);

  const startRecord = async (recordType: RecordType) => {
    if (recordingRef.current) return;
    recordingRef.current = true;

    try {
      await record(recordType);
      await new Promise((r) => setTimeout(r, 300));

      window.close();
    } catch (err: any) {
      console.error(err);
      alert(err?.message);
    }

    recordingRef.current = false;
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center py-8 px-4 gap-4">
        {RECORD_TYPES.map(([recordType, label]) => (
          <button
            key={recordType}
            type="button"
            className={classNames(
              "px-4 py-2 text-lg font-semibold rounded-md border border-slate-200"
              // loading && "opacity-75 cursor-wait"
            )}
            onClick={() => startRecord(recordType)}
          >
            Record {label}
          </button>
        ))}
      </div>

      <History />
    </>
  );
}

async function record(recordType: RecordType) {
  const [currentTab] = await chrome.tabs.query({
    currentWindow: true,
    active: true,
  });
  if (!currentTab) throw new Error("Failed to detect current tab");

  if (currentTab.url?.includes(chrome.runtime.id))
    throw new Error("Cannot start on Meeper Tab");

  await chrome.runtime.sendMessage({
    type: MsgType.Start,
    recordType,
    tabId: currentTab.id,
    tabIndex: currentTab.index,
  });
}

const RECORD_TYPES = [
  [RecordType.StereoOnly, "Tab Audio only"],
  [RecordType.MicOnly, "Microphone only"],
  [RecordType.Full, "All (Meeting)"],
] as const;
