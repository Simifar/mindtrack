import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";
import { loginSchema, apiError } from "@/lib/validation";
import { rateLimit, clientIp } from "@/lib/rate-limit";

/** Захэшированная dummy-строка: выравнивает время ответа, когда пользователь не найден. */
const DUMMY_HASH = "$2b$12$6sn4731/vZadMuIepYSeqekneDZmu0iSksBs/jh7z.cwE/tJo5zLe";

const WINDOW_MS = 10 * 60 * 1000;

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
  const emailLower = email.toLowerCase();
  const ip = clientIp(req);

  // Rate limiting: по паре IP+email и шире — по IP.
  const byPair = rateLimit(`login:${ip}:${emailLower}`, 5, WINDOW_MS);
  const byIp = rateLimit(`login:${ip}`, 30, WINDOW_MS);
  if (!byPair.allowed || !byIp.allowed) {
    return apiError("Слишком много попыток, попробуйте позже", 429);
  }

  const user = await db.user.findUnique({ where: { email: emailLower } });
  // Всегда выполняем bcrypt compare — без timing-разницы между «нет пользователя» и «неверный пароль».
  const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) {
    return apiError("Неверный email или пароль", 401);
  }

  await createSession(user.id, user.email, req.headers.get("user-agent") ?? undefined);
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
