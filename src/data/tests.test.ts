import { describe, it, expect } from "bun:test";
import { scoreTest, maxScore, formatResultText, getTest, ALL_TESTS } from "./tests";

describe("static tests data", () => {
  it("каталог содержит 7 тестов", () => {
    expect(ALL_TESTS.length).toBe(7);
    expect(ALL_TESTS.map((t) => t.code)).toEqual(["PHQ9", "GAD7", "MDQ", "ASRS", "PSS10", "ISI", "WHO5"]);
  });

  it("getTest находит тест по коду", () => {
    expect(getTest("PHQ9")?.questions.length).toBe(9);
    expect(getTest("NOPE")).toBeUndefined();
  });
});

describe("scoreTest (static)", () => {
  it("PHQ-9: сумма и severity", () => {
    const def = getTest("PHQ9");
    if (!def) throw new Error("no PHQ9");
    const result = scoreTest(def, { 0: 1, 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 0 });
    expect(result.totalScore).toBe(8);
    expect(result.severity).toBe("mild");
    expect(result.crisisDetected).toBe(false);
  });

  it("PHQ-9: кризис при ответе на вопрос 9", () => {
    const def = getTest("PHQ9");
    if (!def) throw new Error("no PHQ9");
    const result = scoreTest(def, { 8: 1 });
    expect(result.crisisDetected).toBe(true);
  });

  it("ASRS: положительный скрининг", () => {
    const def = getTest("ASRS");
    if (!def) throw new Error("no ASRS");
    const result = scoreTest(def, { 0: 2, 1: 2, 2: 2, 3: 2, 4: 1, 5: 1 });
    expect(result.totalScore).toBe(4);
    expect(result.severity).toBe("positive");
  });

  it("maxScore считает максимум", () => {
    const def = getTest("PHQ9");
    if (!def) throw new Error("no PHQ9");
    expect(maxScore(def)).toBe(27);
  });

  it("formatResultText содержит балл и ответы", () => {
    const def = getTest("GAD7");
    if (!def) throw new Error("no GAD7");
    const answers = { 0: 1, 1: 0, 2: 2, 3: 1, 4: 0, 5: 1, 6: 0 };
    const result = scoreTest(def, answers);
    const text = formatResultText({ def, answers, result, date: new Date("2026-09-18T10:00:00") });
    expect(text).toContain("GAD-7");
    expect(text).toContain(`Балл: ${result.totalScore}`);
    expect(text).toContain("НЕ диагноз");
    expect(text).toContain("8-800-2000-122");
  });
});
