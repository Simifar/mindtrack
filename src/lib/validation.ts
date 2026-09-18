import { z } from "zod";

// ---------- Аутентификация ----------
const TRIVIAL_PASSWORDS = new Set([
  "password", "password1", "12345678", "123456789", "1234567890",
  "qwerty123", "qwertyuiop", "iloveyou", "1111111111", "0000000000",
  "letmein123", "admin1234", "welcome123", "mindtrack1",
]);

/** Политика пароля: 10–128 символов, не тривиальный. */
export const passwordSchema = z
  .string()
  .min(10, "Пароль не короче 10 символов")
  .max(128, "Пароль не длиннее 128 символов")
  .refine((v) => !TRIVIAL_PASSWORDS.has(v.toLowerCase()), "Слишком простой пароль");

export const registerSchema = z
  .object({
    email: z.string().email("Некорректный email"),
    password: passwordSchema,
    timezone: z.string().max(64).optional(),
  })
  .refine((d) => d.password.toLowerCase() !== d.email.toLowerCase(), {
    message: "Пароль не должен совпадать с email",
    path: ["password"],
  });
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("Некорректный email"),
  password: z.string().min(1, "Введите пароль"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Некорректный email"),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(32, "Некорректный токен").max(256),
  password: passwordSchema,
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Введите текущий пароль"),
  newPassword: passwordSchema,
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// ---------- Онбординг ----------
export const onboardingSchema = z.object({
  conditionTagIds: z.array(z.string()).min(0).max(20),
  consentAccepted: z.boolean().refine((v) => v === true, "Необходимо принять согласие"),
});
export type OnboardingInput = z.infer<typeof onboardingSchema>;

// ---------- Тесты ----------
const answerSchema = z.object({
  questionId: z.string().min(1, "Отсутствует идентификатор вопроса"),
  value: z.union([z.number().int().min(0, "Значение ответа не может быть отрицательным"), z.string()]),
});

export const submitTestSchema = z.object({
  testDefinitionId: z.string().min(1, "Отсутствует идентификатор теста"),
  /** Массив ответов: { questionId, value } где value — число или строка (для freeText). */
  answers: z.array(answerSchema).min(1, "Нужен хотя бы один ответ"),
});
export type SubmitTestInput = z.infer<typeof submitTestSchema>;

// ---------- Дневник ----------
export const diaryEntrySchema = z
  .object({
    date: z.string().date("Некорректная дата. Ожидается YYYY-MM-DD"),
    mood: z.number().int().min(0).max(10),
    sleepHours: z.number().min(0).max(24).nullable().optional(),
    energyLevel: z.number().int().min(0).max(10).nullable().optional(),
    notes: z.string().max(5000).optional().default(""),
  })
  .refine(
    (d) => {
      const today = new Date().toISOString().slice(0, 10);
      return d.date <= today;
    },
    { message: "Дата не может быть в будущем", path: ["date"] }
  );
export type DiaryEntryInput = z.infer<typeof diaryEntrySchema>;

// ---------- Экспорт ----------
export const exportRequestSchema = z
  .object({
    dateFrom: z.string().date("Некорректная дата начала"),
    dateTo: z.string().date("Некорректная дата окончания"),
    sections: z
      .array(z.enum(["tests", "diary", "charts", "summary"]))
      .min(1, "Выберите хотя бы один раздел"),
    generateShareLink: z.boolean().optional().default(false),
    shareTtlDays: z.number().int().min(1).max(30).optional().default(7),
  })
  .refine(
    (d) => d.dateFrom <= d.dateTo,
    { message: "Дата начала не может быть позже даты окончания", path: ["dateFrom"] }
  )
  .refine(
    (d) => {
      const today = new Date().toISOString().slice(0, 10);
      return d.dateTo <= today;
    },
    { message: "Дата окончания не может быть в будущем", path: ["dateTo"] }
  );
export type ExportRequestInput = z.infer<typeof exportRequestSchema>;

// ---------- Утилиты ответов API ----------
export function apiError(message: string, status = 400, details?: unknown) {
  return Response.json({ error: message, details }, { status });
}
