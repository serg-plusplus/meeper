import { nanoid } from "nanoid";
import { Streams, captureAudio, mergeStreams } from "../lib/capture-audio";
import { requestWhisperOpenaiApi } from "../lib/whisper/openaiApi";
import { retry, promiseQueue } from "../lib/system";
import { RecordType, TabInfo } from "./types";
import { dbRecords, dbContents } from "./db";
import { getLangCode, syncTabRecordState } from "./session";
import { getTabInfo } from "./utils";
import { getOpenAiApiKey } from "./openaiApiKey";

const audioCtx = new AudioContext();

export type MeeperRecorder = {
  recordId: string;
  tab: TabInfo;
  stream: MediaStream;
  start: () => void;
  pause: () => void;
  stop: () => void;
  toggleMic: () => void;
};

export type MeeperState = {
  recordType: RecordType;
  recording: boolean;
  content: string[];
};

// TODO: Reimplement with MeeperState only. Avoid using both state and ref

export async function recordMeeper(
  tabId: number,
  initialRecordType: RecordType,
  onStateUpdate: (s: MeeperState) => void
): Promise<MeeperRecorder> {
  // Obtain streams
  let { tabCaptureStream, micStream } = await getStreams(initialRecordType);
  let stream = mergeStreams(audioCtx, { tabCaptureStream, micStream });

  // Get this tab
  const tabInstance = await chrome.tabs.get(tabId);
  const tabIndex = tabInstance.index;
  const tab = getTabInfo(tabInstance);

  const currentTab = await chrome.tabs.getCurrent();
  const recordTabId = currentTab?.id;

  if (typeof recordTabId === "undefined") {
    throw new Error("Cannot recognize current tab");
  }

  // Create record in DB
  const recordId = nanoid();
  await Promise.all([
    dbRecords.add({
      id: recordId,
      createdAt: Date.now(),
      recordType: initialRecordType,
      recordTabId,
      tab,
    }),
    dbContents.add({
      id: recordId,
      content: [],
    }),
  ]);

  const withQueue = promiseQueue();
  const content: string[] = [];

  let recording = false;
  let stopCaptureAudio: (() => void) | undefined;
  let checkTimeout: ReturnType<typeof setTimeout>;

  const getCurrentRecordType = () => {
    if (tabCaptureStream && micStream) return RecordType.Full;
    if (tabCaptureStream) return RecordType.StereoOnly;
    return RecordType.MicOnly;
  };

  const dispatch = () => {
    onStateUpdate({
      recordType: getCurrentRecordType(),
      recording,
      content,
    });

    syncTabRecordState({
      tabId,
      tabIndex,
      recordTabId,
      recordId,
      recording,
    });

    // Notify tab about the state
    chrome.tabs
      .sendMessage(tabId, {
        target: "meeper",
        active: true,
        recording,
      })
      .catch(console.error);
  };

  const onAudio = async (audioFile: File) => {
    const apiKey = await getOpenAiApiKey().catch(() => null);
    if (!apiKey) {
      await dbRecords.update(recordId, { lastSyncAt: Date.now() });
      return;
    }

    const savedLanguage = await getLangCode();
    const whisperPrompt = content
      .slice(content.length - 3, content.length)
      .join("\n");

    const textPromise = retry(
      () =>
        requestWhisperOpenaiApi(audioFile, "transcriptions", {
          apiKey,
          prompt: whisperPrompt,
          language: savedLanguage !== "auto" ? savedLanguage : undefined,
        }),
      100,
      2
    );

    withQueue(async () => {
      try {
        const text = await textPromise.catch(console.error);
        if (!text) return;

        const lastItem = content[content.length - 1]?.trim();

        if (lastItem && lastItem.endsWith("...")) {
          const lastItemWithoutThreeDot = lastItem.slice(
            0,
            lastItem.length - 3
          );

          content[content.length - 1] = `${lastItemWithoutThreeDot} ${text}`;
        } else {
          content.push(text);
        }

        dispatch();

        await Promise.all([
          dbRecords.update(recordId, { lastSyncAt: Date.now() }),
          dbContents.update(recordId, { content }),
        ]).catch(console.error);
      } catch (err) {
        console.error(err);
      }
    });
  };

  const start = () => {
    if (recording || !stream.active) return;
    recording = true;
    dispatch();

    stopCaptureAudio = captureAudio({
      stream,
      audioCtx,
      onAudio,
    });
  };

  const pause = () => {
    if (!recording) return;
    recording = false;
    dispatch();

    stopCaptureAudio?.();
  };

  const stop = () => {
    pause();

    clearTimeout(checkTimeout);
    stopStreamTracks(stream);
  };

  let micEnabled = getCurrentRecordType() !== RecordType.StereoOnly;

  const toggleMic = () => {
    micEnabled = !micEnabled;
  };

  const updateStream = (factory: () => MediaStream) => {
    let restart = false;
    if (recording) {
      pause();
      restart = true;
    }

    const newSteram = factory();
    stream = newSteram;
    meeper.stream = newSteram;

    if (restart) start();
    else dispatch();
  };

  const checkIsStreamIsActive = async () => {
    if (micEnabled && !micStream?.active) {
      await micCapture()
        .then((newMicStream) =>
          updateStream(() => {
            micStream = newMicStream;
            return mergeStreams(audioCtx, { tabCaptureStream, micStream });
          })
        )
        .catch(console.error);
    } else if (!micEnabled && micStream) {
      updateStream(() => {
        stopStreamTracks(micStream!);
        micStream = null;
        return tabCaptureStream!;
      });
    }

    const isStreamsActive = [tabCaptureStream, micStream].every(
      (s) => s?.active ?? true
    );

    if (!isStreamsActive) {
      stop();
      dispatch();
      return;
    }

    checkTimeout = setTimeout(checkIsStreamIsActive, 500);
  };

  start();
  checkIsStreamIsActive();

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.recordId !== recordId) return;

    switch (msg?.type) {
      case "start":
        return start();

      case "pause":
        return pause();

      case "stop":
        return stop();

      case "setmic": {
        if (typeof msg.enabled !== "boolean") return;

        if (micEnabled !== msg.enabled) {
          return toggleMic();
        }
      }
    }
  });

  const meeper: MeeperRecorder = {
    recordId,
    tab,
    stream,
    start,
    pause,
    stop,
    toggleMic,
  };

  chrome.tabs.onUpdated.addListener(
    async (updatedTabId, _changes, updatedTabInstance) => {
      if (updatedTabId === tabId) {
        const updatedTab = getTabInfo(updatedTabInstance);

        await dbRecords
          .update(recordId, { tab: updatedTab })
          .catch(console.error);

        meeper.tab = updatedTab;
        dispatch();
      }
    }
  );

  return meeper;
}

export class NoStreamError extends Error {
  name = "NoStreamError";
  message = "Failed to obtain media stream";
}

async function getStreams(recordType: RecordType): Promise<Streams> {
  const [tabCaptureStream, micStream] = await Promise.all([
    recordType !== RecordType.MicOnly ? tabCapture() : null,
    recordType !== RecordType.StereoOnly ? micCapture() : null,
  ]);

  return { tabCaptureStream, micStream };
}

function tabCapture() {
  return new Promise<MediaStream | null>((resolve, reject) => {
    chrome.tabCapture.capture(
      {
        audio: true,
        video: false,
      },
      (stream) => {
        if (!stream) {
          reject(new NoStreamError(chrome.runtime.lastError?.message));
          return;
        }

        // Prevent tab mute
        const tabSourceNode = audioCtx.createMediaStreamSource(stream);
        tabSourceNode.connect(audioCtx.destination);

        resolve(stream);
      }
    );
  });
}

function micCapture() {
  return navigator.mediaDevices
    .getUserMedia({ audio: true, video: false })
    .catch(() => {
      throw new NoStreamError();
    });
}

function stopStreamTracks(stream: MediaStream) {
  if (stream.active) {
    for (const track of stream.getTracks()) {
      track.stop();
    }
  }
}
