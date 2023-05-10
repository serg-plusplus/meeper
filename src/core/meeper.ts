import { nanoid } from "nanoid";
import { Streams, captureAudio, prepareStreams } from "../lib/capture-audio";
import { requestWhisperOpenaiApi } from "../lib/whisper/openaiApi";
import { retry, promiseQueue, pick } from "../lib/system";
import { RecordType, TabInfo } from "./types";
import { dbRecords, dbContents } from "./db";

const audioCtx = new AudioContext();

export type MeeperRecorder = {
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
  const tab = await chrome.tabs.get(tabId);

  // Create record in DB
  const recordId = nanoid();
  await Promise.all([
    dbRecords.add({
      id: recordId,
      createdAt: Date.now(),
      recordType,
      tab: pick(tab, "id", "url", "title", "favIconUrl") as TabInfo,
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

  const dispatch = () => onStateUpdate({ recording, content });

  const onAudio = (audioFile: File) => {
    const whisperPrompt = content
      .slice(content.length - 3, content.length)
      .join("\n");

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

        await dbContents
          .update(recordId, {
            content,
          })
          .catch(console.error);
      } catch (err) {
        console.error(err);
      }
    });
  };

  const start = () => {
    if (recording) return;
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
    if (!stream.active) {
      stop();
      dispatch();
      return;
    }

    setTimeout(checkIsStreamIsActive, 1_000);
  };

  start();
  checkIsStreamIsActive();

  return {
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