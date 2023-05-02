export function recordAudio({
  stream,
  onAudio,
  onStop,
  onError,
}: {
  stream: MediaStream;
  onAudio: (f: File) => void;
  onStop?: () => void;
  onError?: (err: any) => void;
}) {
  const mediaRecorder = new MediaRecorder(stream);

  mediaRecorder.ondataavailable = async (evt) => {
    const blob = new Blob([evt.data], { type: "audio/webm;codecs=opus" });

    const file = new File([blob], "meeper_chunk.webm", {
      type: "audio/webm",
    });
    onAudio(file);
  };

  if (onStop) mediaRecorder.onstop = onStop;
  if (onError) mediaRecorder.onerror = onError;

  mediaRecorder.start();

  return () => {
    if (mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
  };
}
