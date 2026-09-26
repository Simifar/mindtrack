import { STORAGE_KEYS } from "@/lib/storage/keys";
import { readJson, removeKey, writeJson } from "@/lib/storage/storage";

export interface DiaryEntry {
  id: string;
  date: string;
  mood: number;
  sleepHours: string;
  sleepQuality: number;
  energy: number;
  anxiety: number;
  irritability: number;
  activity: string;
  medication: string;
  substances: string;
  stressors: string;
  helpful: string;
  warningSigns: string;
  notes: string;
  createdAt: string;
}

export interface VisitPrep {
  visitDate: string;
  priority: string;
  changes: string;
  episodes: string;
  sleep: string;
  moodActivity: string;
  currentMedication: string;
  previousMedication: string;
  health: string;
  familyHistory: string;
  substances: string;
  safety: string;
  other: string;
  questions: string;
  updatedAt: string;
}

export type DiaryDraft = Omit<DiaryEntry, "id" | "createdAt">;
export type VisitPrepDraft = Omit<VisitPrep, "updatedAt">;

interface StoredDraft<T> {
  version: 1;
  updatedAt: string;
  value: T;
}

const EMPTY_VISIT: VisitPrep = {
  visitDate: "",
  priority: "",
  changes: "",
  episodes: "",
  sleep: "",
  moodActivity: "",
  currentMedication: "",
  previousMedication: "",
  health: "",
  familyHistory: "",
  substances: "",
  safety: "",
  other: "",
  questions: "",
  updatedAt: "",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function number(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function isValidDate(value: unknown): value is string {
  return typeof value === "string" && (value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function normalizeDiaryDraft(value: unknown): DiaryDraft | null {
  if (!isRecord(value) || !isValidDate(value.date)) return null;
  const numericFields = ["mood", "sleepQuality", "energy", "anxiety", "irritability"] as const;
  if (numericFields.some((key) => typeof value[key] !== "number" || !Number.isInteger(value[key]) || number(value[key]) < 0 || number(value[key]) > 10)) return null;
  const textFields = ["sleepHours", "activity", "medication", "substances", "stressors", "helpful", "warningSigns", "notes"] as const;
  if (textFields.some((key) => typeof value[key] !== "string")) return null;
  return {
    date: value.date,
    mood: number(value.mood),
    sleepHours: text(value.sleepHours),
    sleepQuality: number(value.sleepQuality),
    energy: number(value.energy),
    anxiety: number(value.anxiety),
    irritability: number(value.irritability),
    activity: text(value.activity),
    medication: text(value.medication),
    substances: text(value.substances),
    stressors: text(value.stressors),
    helpful: text(value.helpful),
    warningSigns: text(value.warningSigns),
    notes: text(value.notes),
  };
}

function normalizeVisitPrepDraft(value: unknown): VisitPrepDraft | null {
  if (!isRecord(value)) return null;
  const keys: Array<keyof VisitPrepDraft> = [
    "visitDate", "priority", "changes", "episodes", "sleep", "moodActivity", "currentMedication",
    "previousMedication", "health", "familyHistory", "substances", "safety", "other", "questions",
  ];
  if (keys.some((key) => typeof value[key] !== "string")) return null;
  return Object.fromEntries(keys.map((key) => [key, text(value[key])])) as VisitPrepDraft;
}

function readDraft<T>(key: string, normalize: (value: unknown) => T | null): T | null {
  const parsed = readJson<unknown>(key);
  if (!isRecord(parsed) || parsed.version !== 1 || typeof parsed.updatedAt !== "string" || Number.isNaN(Date.parse(parsed.updatedAt))) return null;
  return normalize(parsed.value);
}

function writeDraft<T>(key: string, value: T): void {
  const draft: StoredDraft<T> = { version: 1, updatedAt: new Date().toISOString(), value };
  writeJson(key, draft);
}

function normalizeDiary(value: unknown): DiaryEntry | null {
  if (!isRecord(value) || !text(value.id) || !text(value.date)) return null;
  return {
    id: text(value.id),
    date: text(value.date),
    mood: number(value.mood, 5),
    sleepHours: text(value.sleepHours),
    sleepQuality: number(value.sleepQuality, 5),
    energy: number(value.energy, 5),
    anxiety: number(value.anxiety, 0),
    irritability: number(value.irritability, 0),
    activity: text(value.activity),
    medication: text(value.medication),
    substances: text(value.substances),
    stressors: text(value.stressors),
    helpful: text(value.helpful),
    warningSigns: text(value.warningSigns),
    notes: text(value.notes),
    createdAt: text(value.createdAt),
  };
}

export function loadDiaryEntries(): DiaryEntry[] {
  const parsed = readJson<unknown[]>(STORAGE_KEYS.diary) ?? [];
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map(normalizeDiary)
    .filter((entry): entry is DiaryEntry => Boolean(entry))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

function writeDiaryEntries(entries: DiaryEntry[]): void {
  writeJson(STORAGE_KEYS.diary, entries.slice(0, 365));
}

export function saveDiaryEntry(entry: DiaryEntry): void {
  const entries = loadDiaryEntries().filter((item) => item.id !== entry.id);
  writeDiaryEntries([entry, ...entries]);
}

export function loadDiaryDraft(): DiaryDraft | null {
  return readDraft(STORAGE_KEYS.diaryDraft, normalizeDiaryDraft);
}

export function saveDiaryDraft(value: DiaryDraft): void {
  writeDraft(STORAGE_KEYS.diaryDraft, value);
}

export function clearDiaryDraft(): void {
  removeKey(STORAGE_KEYS.diaryDraft);
}

export function deleteDiaryEntry(id: string): void {
  writeDiaryEntries(loadDiaryEntries().filter((entry) => entry.id !== id));
}

export function exportDiaryJson(): string {
  return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), entries: loadDiaryEntries() }, null, 2);
}

export function loadVisitPrep(): VisitPrep {
  const parsed = readJson<unknown>(STORAGE_KEYS.visitPrep);
  if (!isRecord(parsed)) return { ...EMPTY_VISIT };
  return { ...EMPTY_VISIT, ...Object.fromEntries(Object.keys(EMPTY_VISIT).map((key) => [key, text(parsed[key])])) } as VisitPrep;
}

export function loadVisitPrepDraft(): VisitPrepDraft | null {
  return readDraft(STORAGE_KEYS.visitPrepDraft, normalizeVisitPrepDraft);
}

export function saveVisitPrepDraft(value: VisitPrepDraft): void {
  writeDraft(STORAGE_KEYS.visitPrepDraft, value);
}

export function clearVisitPrepDraft(): void {
  removeKey(STORAGE_KEYS.visitPrepDraft);
}

export function clearVisitPrep(): void {
  removeKey(STORAGE_KEYS.visitPrep);
}

export function saveVisitPrep(value: VisitPrep): void {
  writeJson(STORAGE_KEYS.visitPrep, { ...value, updatedAt: new Date().toISOString() });
}

export function exportVisitText(value: VisitPrep, entries: DiaryEntry[] = []): string {
  const lines = [
    "MindTrack — подготовка к приёму",
    value.visitDate ? `Дата приёма: ${value.visitDate}` : "",
    "",
    "Это личная сводка для обсуждения со специалистом, а не медицинское заключение.",
    "",
    `Что сейчас беспокоит:\n${value.priority || "—"}`,
    `Что изменилось и когда:\n${value.changes || "—"}`,
    `Заметные эпизоды и их длительность:\n${value.episodes || "—"}`,
    `Сон:\n${value.sleep || "—"}`,
    `Настроение и активность:\n${value.moodActivity || "—"}`,
    `Текущие препараты и переносимость:\n${value.currentMedication || "—"}`,
    `Предыдущие препараты и эффект:\n${value.previousMedication || "—"}`,
    `Здоровье и важные медицинские сведения:\n${value.health || "—"}`,
    `Семейный анамнез:\n${value.familyHistory || "—"}`,
    `Алкоголь, кофеин и другие вещества:\n${value.substances || "—"}`,
    `Мысли о безопасности и самоповреждении:\n${value.safety || "—"}`,
    `Другое важное:\n${value.other || "—"}`,
    `Вопросы врачу:\n${value.questions || "—"}`,
  ];

  if (entries.length > 0) {
    lines.push("", `Последние записи дневника: ${entries.length}`);
    for (const entry of entries.slice(0, 14)) {
      lines.push(`${entry.date}: настроение ${entry.mood}/10; сон ${entry.sleepHours || "—"} ч; энергия ${entry.energy}/10; тревога ${entry.anxiety}/10${entry.notes ? `; ${entry.notes}` : ""}`);
    }
  }

  return lines.filter((line) => line !== undefined).join("\n");
}
