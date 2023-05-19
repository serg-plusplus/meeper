import { Dexie } from "dexie";
import { RecordType, TabInfo } from "./types";

const db = new Dexie("meeper_main");

export interface DBRecord {
  id: string;
  createdAt: number;
  lastSyncAt?: number;
  finishedAt?: number;
  recordType: RecordType;
  recordTabId: number;
  tab: TabInfo;
}

export interface DBContent {
  id: string;
  content: string[];
  summary?: string;
  // audios?: Blob[];
}

db.version(1).stores({
  records: "&id,createdAt",
  contents: "&id",
});

export const dbRecords = db.table<DBRecord>("records");
export const dbContents = db.table<DBContent>("contents");

export async function fetchRecords(limit: number) {
  return dbRecords.orderBy("createdAt").reverse().limit(limit).toArray();
}
