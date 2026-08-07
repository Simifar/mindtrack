import { describe, it, expect } from "bun:test";
import {
  registerSchema,
  diaryEntrySchema,
  exportRequestSchema,
  submitTestSchema,
} from "./validation";

describe("registerSchema", () => {
  it("пропускает корректные данные", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "SuperPassword123!",
      timezone: "Europe/Moscow",
    });
    expect(result.success).toBe(true);
  });

  it("отклоняет слишком короткий пароль", () => {
    const result = registerSchema.safeParse({ email: "user@example.com", password: "short" });
    expect(result.success).toBe(false);
  });

  it("отклоняет пароль, совпадающий с email", () => {
    const result = registerSchema.safeParse({ email: "User@Example.com", password: "user@example.com" });
    expect(result.success).toBe(false);
  });
});

describe("diaryEntrySchema", () => {
  it("пропускает корректную запись", () => {
    const result = diaryEntrySchema.safeParse({
      date: "2026-08-05",
      mood: 7,
      sleepHours: 7.5,
      energyLevel: 6,
      notes: "",
    });
    expect(result.success).toBe(true);
  });

  it("отклоняет дату в будущем", () => {
    const result = diaryEntrySchema.safeParse({
      date: "2099-01-01",
      mood: 5,
    });
    expect(result.success).toBe(false);
  });

  it("отклоняет некорректный формат даты", () => {
    const result = diaryEntrySchema.safeParse({ date: "05-08-2026", mood: 5 });
    expect(result.success).toBe(false);
  });
});

describe("exportRequestSchema", () => {
  it("пропускает корректный диапазон", () => {
    const result = exportRequestSchema.safeParse({
      dateFrom: "2026-07-01",
      dateTo: "2026-08-05",
      sections: ["summary", "diary"],
    });
    expect(result.success).toBe(true);
  });

  it("отклоняет dateFrom позже dateTo", () => {
    const result = exportRequestSchema.safeParse({
      dateFrom: "2026-08-10",
      dateTo: "2026-08-05",
      sections: ["summary"],
    });
    expect(result.success).toBe(false);
  });

  it("отклоняет dateTo в будущем", () => {
    const result = exportRequestSchema.safeParse({
      dateFrom: "2026-08-01",
      dateTo: "2099-01-01",
      sections: ["summary"],
    });
    expect(result.success).toBe(false);
  });
});

describe("submitTestSchema", () => {
  it("пропускает корректные ответы", () => {
    const result = submitTestSchema.safeParse({
      testDefinitionId: "test-1",
      answers: [
        { questionId: "q1", value: 2 },
        { questionId: "q2", value: "free text" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("отклоняет пустой массив ответов", () => {
    const result = submitTestSchema.safeParse({ testDefinitionId: "test-1", answers: [] });
    expect(result.success).toBe(false);
  });

  it("отклоняет отрицательное числовое значение", () => {
    const result = submitTestSchema.safeParse({
      testDefinitionId: "test-1",
      answers: [{ questionId: "q1", value: -1 }],
    });
    expect(result.success).toBe(false);
  });
});
