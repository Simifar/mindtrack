import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";
import { loginSchema, apiError } from "@/lib/validation";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Некорректный JSON", 400);
  }
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Ошибка валидации", 400, parsed.error.flatten().fieldErrors);
  }
  const { email, password } = parsed.data;

  const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    return apiError("Неверный email или пароль", 401);
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return apiError("Неверный email или пароль", 401);
  }

  await createSession(user.id, user.email);
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      timezone: user.timezone,
      consentAcceptedAt: user.consentAcceptedAt,
      onboardingCompleted: user.onboardingCompleted,
    },
  });
}
