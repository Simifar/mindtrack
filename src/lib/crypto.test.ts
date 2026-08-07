import { describe, it, expect } from "bun:test";

process.env.ENCRYPTION_KEY = "0000000000000000000000000000000000000000000000000000000000000001";

const { encrypt, decrypt, decryptSafe } = await import("./crypto");

describe("crypto", () => {
  it("шифрует и расшифровывает строку", () => {
    const plain = "Привет, мир! 🧠";
    const cipher = encrypt(plain);
    expect(cipher).not.toBe(plain);
    expect(decrypt(cipher)).toBe(plain);
  });

  it("расшифровывает JSON-нагрузку", () => {
    const plain = JSON.stringify({ mood: 5, notes: "тест" });
    const cipher = encrypt(plain);
    expect(JSON.parse(decrypt(cipher))).toEqual({ mood: 5, notes: "тест" });
  });

  it("decryptSafe возвращает пустую строку при повреждённом пакете", () => {
    expect(decryptSafe("not-json")).toBe("");
    expect(decryptSafe(JSON.stringify({ ct: "abc", iv: "def", t: "ghi" }))).toBe("");
  });

  it("бросает ошибку при повреждённом шифртексте", () => {
    const cipher = encrypt("secret");
    const tampered = cipher.slice(0, -2) + "00";
    expect(() => decrypt(tampered)).toThrow();
  });
});
