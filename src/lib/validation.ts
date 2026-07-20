import { z } from "zod";

// ---------- Аутентификация ----------
export const registerSchema = z.object({
  email: z.string().email("Некорректный email"),
  password: z.string().min(8, "Пароль не короче 8 символов").max(128),
  timezone: z.string().max(64).optional(),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("Некорректный email"),
  password: z.string().min(1, "Введите пароль"),
});
export type LoginInput = z.infer<typeof loginSchema>;

// ---------- Онбординг ----------
export const onboardingSchema = z.object({
  conditionTagIds: z.array(z.string()).min(0).max(20),
  consentAccepted: z.boolean().refine((v) => v === true, "Необходимо принять согласие"),
});
export type OnboardingInput = z.infer<typeof onboardingSchema>;

// ---------- Тесты ----------
export const submitTestSchema = z.object({
  testDefinitionId: z.string().min(1),
  /** Массив ответов: { questionId, value } где value — число или строка (для freeText). */
  answers: z
    .array(
      z.object({
        questionId: z.string(),
        value: z.union([z.number(), z.string()]),
      })
    )
    .min(1, "Нужен хотя бы один ответ"),
});
export type SubmitTestInput = z.infer<typeof submitTestSchema>;

// ---------- Дневник ----------
export const diaryEntrySchema = z.object({
  date: z.string().min(1), // ISO date string (YYYY-MM-DD)
  mood: z.number().int().min(0).max(10),
  sleepHours: z.number().min(0).max(24).nullable().optional(),
  energyLevel: z.number().int().min(0).max(10).nullable().optional(),
  notes: z.string().max(5000).optional().default(""),
});
export type DiaryEntryInput = z.infer<typeof diaryEntrySchema>;

// ---------- Экспорт ----------
export const exportRequestSchema = z.object({
  dateFrom: z.string().min(1),
  dateTo: z.string().min(1),
  sections: z
    .array(z.enum(["tests", "diary", "charts", "summary"]))
    .min(1, "Выберите хотя бы один раздел"),
  generateShareLink: z.boolean().optional().default(false),
  shareTtlDays: z.number().int().min(1).max(30).optional().default(7),
});
export type ExportRequestInput = z.infer<typeof exportRequestSchema>;

// ---------- Утилиты ответов API ----------
export function apiError(message: string, status = 400, details?: unknown) {
  return Response.json({ error: message, details }, { status });
}
