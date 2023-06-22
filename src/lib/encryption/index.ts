import { Buffer } from "buffer";

import { ENCRYPTION_KEY } from "../../config/env";

export async function encrypt(data: string) {
  const salt = getRandomBytes();
  const cryptoKey = await getCryptoKey(salt);

  const iv = getRandomBytes(16);
  const cipher = Buffer.from(
    await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv,
      },
      cryptoKey,
      Buffer.from(data, "utf8")
    )
  );

  return Buffer.concat([salt, iv, cipher]).toString("hex");
}

export async function decrypt(encrypted: string) {
  const itemBuf = Buffer.from(encrypted, "hex");

  let index = 0;
  const pick = (length?: number) =>
    itemBuf.subarray(index, length && (index += length));

  const salt = pick(32);
  const iv = pick(16);
  const cipher = pick();

  const cryptoKey = await getCryptoKey(salt);
  const dataBuf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    cipher
  );

  return Buffer.from(dataBuf).toString("utf8");
}

async function getCryptoKey(salt: Uint8Array) {
  const originKey = await crypto.subtle.importKey(
    "raw",
    Buffer.from(ENCRYPTION_KEY, "utf8"),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 120_000,
      hash: "SHA-512",
    },
    originKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

function getRandomBytes(byteCount = 32) {
  const view = new Uint8Array(byteCount);
  crypto.getRandomValues(view);
  return view;
}
