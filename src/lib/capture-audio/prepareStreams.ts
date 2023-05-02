export type Streams = {
  micStream?: MediaStream | null;
  tabCaptureStream?: MediaStream | null;
};

export function prepareStreams(
  audioCtx: AudioContext,
  { tabCaptureStream, micStream }: Streams
) {
  let fullStream: MediaStream;

  if (tabCaptureStream && micStream) {
    // Merge two streams in one if both provided
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

  return fullStream;
}
