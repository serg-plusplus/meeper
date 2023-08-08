import axios, { RawAxiosRequestHeaders } from "axios";

const whisperApiEndpoint = "https://api.openai.com/v1/audio/";

export async function requestWhisperOpenaiApi(
  file: File,
  mode: "transcriptions" | "translations" = "transcriptions",
  opts: Record<string, any> = {},
) {
  // Whisper only accept multipart/form-data currently
  const body = new FormData();
  body.append("file", file);
  body.append("model", "whisper-1");

  if (mode === "transcriptions" && opts.language) {
    body.append("language", opts.language);
  }
  if (opts.prompt) {
    body.append("prompt", opts.prompt);
  }
  if (opts.response_format) {
    body.append("response_format", opts.response_format);
  }
  if (opts.temperature) {
    body.append("temperature", `${opts.temperature}`);
  }

  const headers: RawAxiosRequestHeaders = {};
  headers["Content-Type"] = "multipart/form-data";
  if (opts.apiKey) {
    headers["Authorization"] = `Bearer ${opts.apiKey}`;
  }

  const response = await axios.post(whisperApiEndpoint + mode, body, {
    headers,
    timeout: 20_000,
  });

  return response.data.text as string;
}
