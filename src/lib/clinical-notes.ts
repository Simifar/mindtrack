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

const DIARY_KEY = "mindtrack.diary.v1";
const VISIT_KEY = "mindtrack.visit-prep.v1";

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
  if (typeof window === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(DIARY_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeDiary)
      .filter((entry): entry is DiaryEntry => Boolean(entry))
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

function writeDiaryEntries(entries: DiaryEntry[]): void {
  window.localStorage.setItem(DIARY_KEY, JSON.stringify(entries.slice(0, 365)));
}

export function saveDiaryEntry(entry: DiaryEntry): void {
  const entries = loadDiaryEntries().filter((item) => item.id !== entry.id);
  writeDiaryEntries([entry, ...entries]);
}

export function deleteDiaryEntry(id: string): void {
  writeDiaryEntries(loadDiaryEntries().filter((entry) => entry.id !== id));
}

export function exportDiaryJson(): string {
  return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), entries: loadDiaryEntries() }, null, 2);
}

export function loadVisitPrep(): VisitPrep {
  if (typeof window === "undefined") return { ...EMPTY_VISIT };
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(VISIT_KEY) ?? "null");
    if (!isRecord(parsed)) return { ...EMPTY_VISIT };
    return { ...EMPTY_VISIT, ...Object.fromEntries(Object.keys(EMPTY_VISIT).map((key) => [key, text(parsed[key])])) } as VisitPrep;
  } catch {
    return { ...EMPTY_VISIT };
  }
}

export function saveVisitPrep(value: VisitPrep): void {
  window.localStorage.setItem(VISIT_KEY, JSON.stringify({ ...value, updatedAt: new Date().toISOString() }));
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
