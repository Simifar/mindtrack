import { describe, it, expect } from "bun:test";
import { scoreTest, severityColor, type AnswerValue, type TestQuestionData } from "./test-scoring";
import type { ScoringRule } from "./test-scoring";

const YESNO_OPTIONS = [
  { value: 0, label: "Нет" },
  { value: 1, label: "Да" },
];

const PHQ9_OPTIONS = [
  { value: 0, label: "Совсем не беспокоило" },
  { value: 1, label: "Несколько дней" },
  { value: 2, label: "Более половины дней" },
  { value: 3, label: "Почти каждый день" },
];

const phq9Rule: ScoringRule = {
  mode: "sum",
  sumIndexes: "all",
  bands: [
    { max: 4, severity: "none", label: "Минимум / нет депрессивной симптоматики" },
    { max: 9, severity: "mild", label: "Лёгкая" },
    { max: 14, severity: "moderate", label: "Умеренная" },
    { max: 19, severity: "moderately_severe", label: "Умеренно тяжёлая" },
    { max: 27, severity: "severe", label: "Тяжёлая" },
  ],
  crisisQuestionIndexes: [8],
};

function makeQuestions(count: number, options = PHQ9_OPTIONS, freeTextIndex?: number): TestQuestionData[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `q${i}`,
    order: i,
    text: `Вопрос ${i + 1}`,
    optionsJson: options,
    isFreeText: freeTextIndex === i,
  }));
}

function makeAnswers(values: (number | string)[]): AnswerValue[] {
  return values.map((value, i) => ({ questionId: `q${i}`, value }));
}

describe("scoreTest", () => {
  it("PHQ-9: суммирует ответы и выбирает severity", () => {
    const questions = makeQuestions(9);
    const answers = makeAnswers([1, 1, 1, 1, 1, 1, 1, 1, 0]);
    const result = scoreTest(phq9Rule, answers, questions);
    expect(result.totalScore).toBe(8);
    expect(result.severity).toBe("mild");
    expect(result.crisisDetected).toBe(false);
  });

  it("PHQ-9: тяжёлая категория при максимальных баллах", () => {
    const questions = makeQuestions(9);
    const answers = makeAnswers([3, 3, 3, 3, 3, 3, 3, 3, 3]);
    const result = scoreTest(phq9Rule, answers, questions);
    expect(result.totalScore).toBe(27);
    expect(result.severity).toBe("severe");
  });

  it("PHQ-9: детектирует кризис при ответе на кризисный вопрос", () => {
    const questions = makeQuestions(9);
    const answers = makeAnswers([0, 0, 0, 0, 0, 0, 0, 0, 1]);
    const result = scoreTest(phq9Rule, answers, questions);
    expect(result.crisisDetected).toBe(true);
  });

  it("threshold: положительный скрининг ASRS", () => {
    const rule: ScoringRule = {
      mode: "threshold",
      minValuePerItem: 2,
      minItemsMeetingThreshold: 4,
      positiveSeverity: "positive",
      positiveLabel: "Положительный",
      negativeSeverity: "negative",
      negativeLabel: "Отрицательный",
      crisisQuestionIndexes: [],
    };
    const questions = makeQuestions(6, [
      { value: 0, label: "Никогда" },
      { value: 1, label: "Редко" },
      { value: 2, label: "Иногда" },
      { value: 3, label: "Часто" },
      { value: 4, label: "Очень часто" },
    ]);
    const answers = makeAnswers([2, 2, 2, 2, 1, 1]);
    const result = scoreTest(rule, answers, questions);
    expect(result.totalScore).toBe(4);
    expect(result.severity).toBe("positive");
  });

  it("composite: MDQ positive при ≥3 'да' и Q2 ≥2", () => {
    const rule: ScoringRule = {
      mode: "composite",
      matchMode: "all",
      compositeScoreFrom: "sumAll",
      conditions: [
        { type: "countAbove", indexes: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], threshold: 0, minCount: 3 },
        { type: "valueAbove", indexes: [13], threshold: 2 },
      ],
      positiveSeverity: "positive",
      positiveLabel: "Положительный",
      negativeSeverity: "negative",
      negativeLabel: "Отрицательный",
      crisisQuestionIndexes: [],
    };
    const questions = makeQuestions(15, YESNO_OPTIONS);
    const answers = makeAnswers([1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0]);
    const result = scoreTest(rule, answers, questions);
    expect(result.severity).toBe("positive");
  });

  it("composite: MDQ negative при недостатке условий", () => {
    const rule: ScoringRule = {
      mode: "composite",
      matchMode: "all",
      compositeScoreFrom: "sumAll",
      conditions: [
        { type: "countAbove", indexes: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], threshold: 0, minCount: 3 },
        { type: "valueAbove", indexes: [13], threshold: 2 },
      ],
      positiveSeverity: "positive",
      positiveLabel: "Положительный",
      negativeSeverity: "negative",
      negativeLabel: "Отрицательный",
      crisisQuestionIndexes: [],
    };
    const questions = makeQuestions(15, YESNO_OPTIONS);
    const answers = makeAnswers([1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0]);
    const result = scoreTest(rule, answers, questions);
    expect(result.severity).toBe("negative");
  });

  it("sumIndexes: суммирует только указанные индексы", () => {
    const rule: ScoringRule = {
      mode: "sum",
      sumIndexes: [0, 2],
      bands: [
        { max: 1, severity: "none", label: "Низкий" },
        { max: 6, severity: "moderate", label: "Средний" },
      ],
      crisisQuestionIndexes: [],
    };
    const questions = makeQuestions(4, PHQ9_OPTIONS);
    const answers = makeAnswers([3, 3, 3, 3]);
    const result = scoreTest(rule, answers, questions);
    expect(result.totalScore).toBe(6);
    expect(result.severity).toBe("moderate");
  });
});

describe("severityColor", () => {
  it("возвращает цвета для известных severity", () => {
    expect(severityColor("none")).toContain("--chart-2");
    expect(severityColor("severe")).toContain("--destructive");
    expect(severityColor("positive")).toContain("--chart-1");
  });

  it("возвращает muted для неизвестных", () => {
    expect(severityColor("unknown")).toContain("--muted-foreground");
  });
});
