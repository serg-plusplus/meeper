export type Streams = {
  micStream?: MediaStream | null;
  tabCaptureStream?: MediaStream | null;
};

export function mergeStreams(
  audioCtx: AudioContext,
  { tabCaptureStream, micStream }: Streams
) {
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

    return dest.stream;
  } else if (tabCaptureStream) {
    return tabCaptureStream;
  } else {
    return micStream!;
  }
}
