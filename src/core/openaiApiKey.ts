import memoizeOne from "memoize-one";
import { Configuration, OpenAIApi } from "openai";
import { decrypt, encrypt } from "../lib/encryption";
import { retry } from "../lib/system";

const OPENAI_API_KEY = "_oak";

export const getOpenAiApiKey = memoizeOne(async () => {
  const { [OPENAI_API_KEY]: encrypted } = await chrome.storage.local.get(
    OPENAI_API_KEY
  );
  if (!encrypted) throw new NoApiKeyError();

  const apiKey = await decrypt(encrypted).catch(() => null);
  if (!apiKey) throw new NoApiKeyError();

  await validateApiKey(apiKey);

  return apiKey;
});

export async function setOpenAiApiKey(apiKey: string | null) {
  if (!apiKey) {
    return chrome.storage.local.remove(OPENAI_API_KEY);
  }

  const encrypted = await encrypt(apiKey);
  await chrome.storage.local.set({ [OPENAI_API_KEY]: encrypted });
  getOpenAiApiKey.clear();
}

export async function validateApiKey(apiKey: string) {
  try {
    const openai = new OpenAIApi(new Configuration({ apiKey }));
    await retry(() => openai.listModels(), 0, 2);
  } catch (err: any) {
    throw new InvalidApiKeyError(err?.message);
  }
}

export class NoApiKeyError extends Error {}
export class InvalidApiKeyError extends Error {}
