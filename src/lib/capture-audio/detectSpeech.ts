import hark from "hark";

export function detectSpeechEnd({
  audioCtx,
  stream,
  voiceMinDecibels = -50,
  initialSpeedupDelay = 4_000,
  initialInterval = 55,
  intervalSpeedupStep = 5,
  delaySpeedupStep = 1_500,
  onSpeechStart,
  onSpeechEnd,
}: {
  audioCtx: AudioContext;
  stream: MediaStream;
  onSpeechStart: () => void;
  onSpeechEnd: () => void;
  voiceMinDecibels?: number;
  initialSpeedupDelay?: number;
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

  const setIntervalAndDefer = (interval: number, delay = delaySpeedupStep) => {
    speechDetector.setInterval(interval);

    speedupIntervalTimeout = setTimeout(
      setIntervalAndDefer,
      delay,
      interval - intervalSpeedupStep
    );
  };

  const stop = () => {
    clearTimeout(speedupIntervalTimeout);
    onSpeechEnd();
  };

  speechDetector.on("stopped_speaking", () => {
    stop();
  });

  speechDetector.on("speaking", () => {
    setIntervalAndDefer(initialInterval, initialSpeedupDelay);
    onSpeechStart();
  });

  return () => {
    clearTimeout(speedupIntervalTimeout);
    speechDetector.stop();
  };
}
