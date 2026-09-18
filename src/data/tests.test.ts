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
    const result = scoreTest(def, { 0: 2, 1: 2, 2: 2, 3: 3, 4: 1, 5: 1 });
    expect(result.totalScore).toBe(4);
    expect(result.severity).toBe("positive");
  });

  it("ASRS: использует отдельные пороги для первых и последних пунктов", () => {
    const def = getTest("ASRS");
    if (!def) throw new Error("no ASRS");
    const result = scoreTest(def, { 0: 2, 1: 2, 2: 2, 3: 2, 4: 2, 5: 2 });
    expect(result.totalScore).toBe(3);
    expect(result.severity).toBe("negative");
  });

  it("MDQ: положительный результат требует всех трёх условий", () => {
    const def = getTest("MDQ");
    if (!def) throw new Error("no MDQ");
    const positive = scoreTest(def, {
      0: 1, 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 0, 13: 1, 14: 2,
    });
    expect(positive.totalScore).toBe(8);
    expect(positive.severity).toBe("positive");
    const missingCondition = scoreTest(def, {
      0: 1, 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 13: 0, 14: 3,
    });
    expect(missingCondition.severity).toBe("context");

    const allSymptomsOnly = scoreTest(def, {
      0: 1, 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1, 9: 1, 10: 1, 11: 1, 12: 1, 13: 0, 14: 0,
    });
    expect(allSymptomsOnly.totalScore).toBe(13);
    expect(allSymptomsOnly.severity).toBe("context");
    expect(allSymptomsOnly.label).toBe("Нужен дополнительный контекст");
  });

  it("PSS-10: обратно кодирует пункты 4, 5, 7 и 8", () => {
    const def = getTest("PSS10");
    if (!def) throw new Error("no PSS10");
    expect(scoreTest(def, {}).totalScore).toBe(16);
    expect(scoreTest(def, { 3: 4, 4: 4, 6: 4, 7: 4 }).totalScore).toBe(0);
  });

  it("ISI: использует разные варианты ответа для пунктов", () => {
    const def = getTest("ISI");
    if (!def) throw new Error("no ISI");
    expect(def.questionOptions?.[3][0].label).toContain("доволен");
    expect(scoreTest(def, {}).totalScore).toBe(0);
  });

  it("WHO-5: возвращает сырой и нормированный балл", () => {
    const def = getTest("WHO5");
    if (!def) throw new Error("no WHO5");
    const result = scoreTest(def, { 0: 3, 1: 3, 2: 3, 3: 3, 4: 3 });
    expect(result.totalScore).toBe(15);
    expect(result.normalizedScore).toBe(60);
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
    expect(text).toContain("112");
  });
});
