import { describe, expect, it } from "bun:test";
import { getTest } from "@/data/tests";
import type { SavedResult } from "@/lib/results";
import { daysSince, describeDelta, formatRelativeDay, periodicityDays, plural, summarizeResults } from "./insights";

function phq(id: string, dateISO: string, total: number | null, answered = 9): SavedResult {
  return {
    id,
    code: "PHQ9",
    testName: "PHQ-9 — шкала депрессии",
    dateISO,
    totalScore: total,
    maxScore: 27,
    severity: "none",
    label: "Минимум / нет симптоматики",
    advice: "",
    crisisDetected: false,
    answers: Object.fromEntries(Array.from({ length: answered }, (_, index) => [index, 0])),
  };
}

describe("dashboard insights", () => {
  it("declines Russian nouns after numbers", () => {
    expect(plural(1, ["день", "дня", "дней"])).toBe("день");
    expect(plural(3, ["день", "дня", "дней"])).toBe("дня");
    expect(plural(11, ["день", "дня", "дней"])).toBe("дней");
    expect(plural(22, ["день", "дня", "дней"])).toBe("дня");
  });

  it("reads periodicity from test definitions", () => {
    expect(periodicityDays({ periodicity: "раз в 2 недели" })).toBe(14);
    expect(periodicityDays({ periodicity: "раз в месяц" })).toBe(30);
    expect(periodicityDays({ periodicity: "раз в 3 месяца" })).toBe(90);
    expect(periodicityDays({ periodicity: "по ситуации" })).toBeNull();
  });

  it("counts calendar days and formats them relative to now", () => {
    const now = new Date(2026, 9, 7, 9, 0);
    expect(daysSince(new Date(2026, 9, 6, 23, 0).toISOString(), now)).toBe(1);
    expect(formatRelativeDay(new Date(2026, 9, 7, 1, 0).toISOString(), now)).toBe("сегодня");
    expect(formatRelativeDay(new Date(2026, 9, 4, 12, 0).toISOString(), now)).toBe("3 дня назад");
  });

  it("describes score change without judgement", () => {
    expect(describeDelta(7, 7)).toBe("без изменений");
    expect(describeDelta(5, 7)).toBe("на 2 балла ниже");
    expect(describeDelta(12, 7)).toBe("на 5 баллов выше");
    expect(describeDelta(null, 7)).toBeNull();
  });

  it("summarises only complete results into the trend and repeat reminder", () => {
    const now = new Date("2026-10-07T10:00:00.000Z");
    const summaries = summarizeResults([
      phq("old", "2026-09-01T10:00:00.000Z", 9),
      phq("partial", "2026-10-06T10:00:00.000Z", null, 3),
      phq("recent", "2026-09-20T10:00:00.000Z", 5),
    ], now);
    expect(summaries).toHaveLength(1);
    const [summary] = summaries;
    expect(summary.def).toBe(getTest("PHQ9"));
    expect(summary.latest.id).toBe("partial");
    expect(summary.latestComplete?.id).toBe("recent");
    expect(summary.previousComplete?.id).toBe("old");
    expect(summary.completeSeries.map((result) => result.id)).toEqual(["old", "recent"]);
    expect(summary.dueForRepeat).toBe(true);
  });
});
