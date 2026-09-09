import { z } from "zod";
import type { TestResult } from "@/data/types";

export const resultInputSchema = z.object({
  scaleId: z.string().min(1),
  date: z.string().date(),
  score: z.coerce.number().finite().min(0),
  note: z.string().max(500).default(""),
});

export function createResult(input: unknown): TestResult {
  const value = resultInputSchema.parse(input);
  return { ...value, id: crypto.randomUUID(), importedAt: new Date().toISOString() };
}

function parseCsv(text: string): unknown[] {
  const rows = text.trim().split(/\r?\n/).filter(Boolean);
  if (rows.length < 2) return [];
  const headers = rows[0].split(",").map((header) => header.trim().toLowerCase());
  return rows.slice(1).map((row) => {
    const values = row.split(",").map((value) => value.trim().replace(/^"|"$/g, ""));
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

export function parseImportedResults(text: string): unknown[] {
  if (text.trim().startsWith("[") || text.trim().startsWith("{")) {
    const parsed: unknown = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
    if (typeof parsed === "object" && parsed !== null && "results" in parsed && Array.isArray(parsed.results)) return parsed.results;
    throw new Error("JSON должен содержать массив результатов или поле results.");
  }
  return parseCsv(text);
}
