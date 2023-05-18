import { Dexie } from "dexie";
import { RecordType, TabInfo } from "./types";

const db = new Dexie("meeper_main");

export interface DBRecord {
  id: string;
  createdAt: number;
  finishedAt?: number;
  recordType: RecordType;
  tab: TabInfo;
}

export interface DBContent {
  id: string;
  content: string[];
  audios?: Blob[];
  summary?: string;
}

db.version(1).stores({
  records: "&id,createdAt",
  contents: "&id",
});

export const dbRecords = db.table<DBRecord>("records");
export const dbContents = db.table<DBContent>("contents");
