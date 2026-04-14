import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const KEY_HEX = process.env.ENCRYPTION_KEY;
if (!KEY_HEX && process.env.NODE_ENV === "production") {
  throw new Error("ENCRYPTION_KEY env var must be set (64 hex chars).");
}
const KEY = KEY_HEX ? Buffer.from(KEY_HEX, "hex") : randomBytes(32);

export function encrypt(text: string): { encrypted: string; iv: string } {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", KEY, iv);
  const enc = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    encrypted: Buffer.concat([enc, tag]).toString("base64"),
    iv: iv.toString("base64"),
  };
}

export function decrypt(encB64: string, ivB64: string): string {
  const iv = Buffer.from(ivB64, "base64");
  const combined = Buffer.from(encB64, "base64");
  const tag = combined.subarray(combined.length - 16);
  const enc = combined.subarray(0, combined.length - 16);
  const d = createDecipheriv("aes-256-gcm", KEY, iv);
  d.setAuthTag(tag);
  return d.update(enc) + d.final("utf8");
}
