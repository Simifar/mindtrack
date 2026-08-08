import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";
import { registerSchema, apiError } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { withApiHandler } from "@/lib/route-handler";

export const POST = withApiHandler("auth.register", async (req, { logger, ip }) => {
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
  const emailLower = email.toLowerCase();

  if (!rateLimit(`register:${ip}`, 10, 60 * 60 * 1000).allowed) {
    logger.warn("auth.register.rateLimited", { email: emailLower });
    return apiError("Слишком много попыток, попробуйте позже", 429);
  }

  const existing = await db.user.findUnique({ where: { email: emailLower } });
  if (existing) {
    logger.warn("auth.register.alreadyExists", { email: emailLower });
    return apiError("Пользователь с таким email уже существует", 409);
  }

  const passwordHash = await hashPassword(password);
  const user = await db.user.create({
    data: {
      email: emailLower,
      passwordHash,
      timezone: timezone ?? "UTC",
    },
    select: { id: true, email: true, timezone: true, consentAcceptedAt: true, onboardingCompleted: true },
  });

  await createSession(user.id, user.email, req.headers.get("user-agent") ?? undefined);
  logger.info("auth.register.success", { userId: user.id, email: user.email });
  return NextResponse.json({ user });
});
