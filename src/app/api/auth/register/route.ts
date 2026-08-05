import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";
import { registerSchema, apiError } from "@/lib/validation";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Некорректный JSON", 400);
  }
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Ошибка валидации", 400, parsed.error.flatten().fieldErrors);
  }
  const { email, password, timezone } = parsed.data;

  const ip = clientIp(req);
  if (!rateLimit(`register:${ip}`, 10, 60 * 60 * 1000).allowed) {
    return apiError("Слишком много попыток, попробуйте позже", 429);
  }

  const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return apiError("Пользователь с таким email уже существует", 409);
  }

  const passwordHash = await hashPassword(password);
  const user = await db.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      timezone: timezone ?? "UTC",
    },
    select: { id: true, email: true, timezone: true, consentAcceptedAt: true, onboardingCompleted: true },
  });

  await createSession(user.id, user.email, req.headers.get("user-agent") ?? undefined);
  return NextResponse.json({ user });
}
