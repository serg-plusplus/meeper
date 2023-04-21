export type Streams = {
  micStream?: MediaStream | null;
  tabCaptureStream?: MediaStream | null;
};

export function captureAudio(
  {
    micStream,
    tabCaptureStream,
    kSampleRate = 16_000,
    kIntervalAudio_ms = 5_000,
  }: Streams & {
    kSampleRate?: number;
    kIntervalAudio_ms?: number;
  },
  onAudio: (a: Float32Array) => void,
  onStop?: () => void,
  onError: (err: any) => void = console.error
) {
  if (!micStream && !tabCaptureStream) throw new Error("No audio");

  const audioCtx = new AudioContext();
  let audioOffset: Float32Array | null = null;

  let fullStream: MediaStream;
  if (tabCaptureStream && micStream) {
    const tabMediaStream = new MediaStream();
    tabMediaStream.addTrack(tabCaptureStream.getAudioTracks()[0]);

    const micMediaStream = new MediaStream();
    micMediaStream.addTrack(micStream.getAudioTracks()[0]);

    const tabSourceNode = audioCtx.createMediaStreamSource(tabMediaStream);
    const micSourceNode = audioCtx.createMediaStreamSource(micMediaStream);

    const dest = audioCtx.createMediaStreamDestination();

    tabSourceNode.connect(dest);
    micSourceNode.connect(dest);

    fullStream = dest.stream;
  } else if (tabCaptureStream) {
    fullStream = tabCaptureStream;
  } else {
    fullStream = micStream!;
  }

  if (tabCaptureStream) {
    // Prevent tab mute
    const tabSourceNode = audioCtx.createMediaStreamSource(tabCaptureStream);
    tabSourceNode.connect(audioCtx.destination);
  }

  // Record
  const mediaRecorder = new MediaRecorder(fullStream);
  const recordCtx = new AudioContext({
    sampleRate: kSampleRate,
    channelCount: 1,
    echoCancellation: false,
    autoGainControl: true,
    noiseSuppression: true,
  } as any);

  const chunks: Blob[] = [];

  mediaRecorder.ondataavailable = (evt) => {
    chunks.push(evt.data);

    const blob = new Blob(chunks, { type: "audio/ogg; codecs=opus" });
    const reader = new FileReader();

    reader.onload = () => {
      const buf = new Uint8Array(reader.result as ArrayBuffer); // TODO: Is it really always ArrayBuffer?

      recordCtx.decodeAudioData(
        buf.buffer,
        (audioBuffer) => {
          const offlineContext = new OfflineAudioContext(
            audioBuffer.numberOfChannels,
            audioBuffer.length,
            audioBuffer.sampleRate
          );
          const source = offlineContext.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(offlineContext.destination);
          source.start(0);

          offlineContext.startRendering().then((renderedBuffer) => {
            const audio = renderedBuffer.getChannelData(0);

            if (audioOffset) {
              const audioWithOffset = new Float32Array(
                audioOffset.length + audio.length
              );
              audioWithOffset.set(audioOffset, 0);
              audioWithOffset.set(audio, audioOffset.length);

              onAudio(audioWithOffset);
            }

            audioOffset = audio;
          });
        },
        onError
      );
    };

    reader.onerror = onError;
    reader.readAsArrayBuffer(blob);
  };

  mediaRecorder.onstop = () => {
    cleanup();
    onStop?.();
  };

  mediaRecorder.onerror = onError;
  mediaRecorder.start(kIntervalAudio_ms);

  const cleanup = () => {
    fullStream.getTracks().forEach((track) => track.stop());

    audioCtx.close();
    recordCtx.close();
  };

  return () => mediaRecorder.stop();
}
