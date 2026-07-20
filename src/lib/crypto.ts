import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { env } from "./env";

const ALGO = "aes-256-gcm";
const KEY = Buffer.from(env.ENCRYPTION_KEY, "hex"); // 32 байта

export interface EncryptedPayload {
  /** base64 шифртекста */
  ct: string;
  /** base64 iv (12 байт) */
  iv: string;
  /** base64 auth tag (16 байт) */
  t: string;
}

/**
 * Шифрует произвольную строку (обычно JSON). Возвращает компактный JSON-пакет
 * {ct,iv,t}. Используется для DiaryEntry.notes и TestResponse.answersJson.
 */
export function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, KEY, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload: EncryptedPayload = {
    ct: enc.toString("base64"),
    iv: iv.toString("base64"),
    t: tag.toString("base64"),
  };
  return JSON.stringify(payload);
}

/** Расшифровывает пакет, созданный encrypt(). При ошибке целостности бросает исключение. */
export function decrypt(packet: string): string {
  const payload = JSON.parse(packet) as EncryptedPayload;
  const decipher = createDecipheriv(ALGO, KEY, Buffer.from(payload.iv, "base64"));
  decipher.setAuthTag(Buffer.from(payload.t, "base64"));
  const dec = Buffer.concat([
    decipher.update(Buffer.from(payload.ct, "base64")),
    decipher.final(),
  ]);
  return dec.toString("utf8");
}

/** Безопасное расшифрование: возвращает пустую строку вместо исключения. */
export function decryptSafe(packet: string): string {
  try {
    return decrypt(packet);
  } catch {
    return "";
  }
}
