import hark from "hark";

export function detectSpeechEnd({
  audioCtx,
  stream,
  voiceMinDecibels = -50,
  minTimeout = 4_000,
  initialInterval = 60,
  intervalSpeedupStep = 10,
  delaySpeedupStep = 3_000,
  onSpeechStart,
  onSpeechEnd,
}: {
  audioCtx: AudioContext;
  stream: MediaStream;
  onSpeechStart: () => void;
  onSpeechEnd: () => void;
  voiceMinDecibels?: number;
  minTimeout?: number;
  initialInterval?: number;
  intervalSpeedupStep?: number;
  delaySpeedupStep?: number;
}) {
  const speechDetector = hark(stream, {
    audioContext: audioCtx,
    threshold: voiceMinDecibels,
    interval: initialInterval,
    play: false,
  });

  let speedupIntervalTimeout: ReturnType<typeof setTimeout>;
  let hardStopTimeout: ReturnType<typeof setTimeout>;
  let startedAt: number;
  let speaking = false;

  const setIntervalAndDefer = (interval: number, delay = delaySpeedupStep) => {
    speechDetector.setInterval(interval);

    speedupIntervalTimeout = setTimeout(
      setIntervalAndDefer,
      delay,
      interval - intervalSpeedupStep
    );
  };

  const start = () => {
    startedAt = Date.now();
    clearTimeout(speedupIntervalTimeout);
    clearTimeout(hardStopTimeout);
    setIntervalAndDefer(initialInterval, minTimeout);
  };

  const stop = () => {
    // speaking = false;

    clearTimeout(speedupIntervalTimeout);
    onSpeechEnd();
  };

  speechDetector.on("stopped_speaking", () => {
    clearTimeout(hardStopTimeout);

    // const duration = Date.now() - startedAt;
    // if (duration < minTimeout) {
    //   hardStopTimeout = setTimeout(stop, minTimeout - duration);
    //   return;
    // }

    stop();
  });

  speechDetector.on("speaking", () => {
    clearTimeout(hardStopTimeout);

    // if (speaking) return;
    // speaking = true;

    start();
    onSpeechStart();
  });

  return () => {
    clearTimeout(speedupIntervalTimeout);
    clearTimeout(hardStopTimeout);
    speechDetector.stop();

    // if (speaking) {
    //   onSpeechEnd();
    // }
  };
}
