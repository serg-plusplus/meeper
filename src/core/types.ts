export enum MsgType {
  Start = "start",
  Pause = "pause",
}

export enum RecordType {
  StereoOnly = "stereo-only",
  MicOnly = "mic-only",
  Full = "full",
}

export interface TabInfo {
  id: number;
  url: string;
  title?: string;
  favIconUrl?: string;
}
