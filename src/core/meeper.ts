import { nanoid } from "nanoid";
import { Streams, captureAudio, prepareStreams } from "../lib/capture-audio";
import { requestWhisperOpenaiApi } from "../lib/whisper/openaiApi";
import { retry, promiseQueue, pick } from "../lib/system";
import { RecordType, TabInfo } from "./types";
import { dbRecords, dbContents } from "./db";
import { getLangCode, syncTabRecordState } from "./session";

const audioCtx = new AudioContext();

export type MeeperRecorder = {
  recordId: string;
  tab: TabInfo;
  stream: MediaStream;
  start: () => void;
  pause: () => void;
  stop: () => void;
};

export type MeeperState = {
  recording: boolean;
  content: string[];
};

export async function recordMeeper(
  tabId: number,
  recordType: RecordType,
  onStateUpdate: (s: MeeperState) => void
): Promise<MeeperRecorder> {
  // Obtain streams
  const separateStreams = await getStreams(recordType);
  const stream = prepareStreams(audioCtx, separateStreams);

  // Get this tab
  const tabInstance = await chrome.tabs.get(tabId);
  const tabIndex = tabInstance.index;
  const tab = pick(tabInstance, "id", "url", "title", "favIconUrl") as TabInfo;

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
      recordType,
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

  const dispatch = () => {
    onStateUpdate({ recording, content });

    syncTabRecordState({
      tabId,
      tabIndex,
      recordTabId,
      recordId,
      recording,
    });
  };

  const onAudio = async (audioFile: File) => {
    const whisperPrompt = content
      .slice(content.length - 3, content.length)
      .join("\n");

    const savedLanguage = await getLangCode();

    const textPromise = retry(
      () =>
        requestWhisperOpenaiApi(audioFile, "transcriptions", {
          apiKey: process.env.OPENAI_API_KEY,
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

    if (stream.active) {
      for (const track of stream.getTracks()) {
        track.stop();
      }
    }
  };

  const checkIsStreamIsActive = () => {
    const isStreamsActive = Object.values(separateStreams).every(
      (s) => s?.active ?? true
    );

    if (!isStreamsActive) {
      stop();
      dispatch();
      return;
    }

    setTimeout(checkIsStreamIsActive, 1_000);
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
    }
  });

  return {
    recordId,
    tab,
    stream,
    start,
    pause,
    stop,
  };
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
