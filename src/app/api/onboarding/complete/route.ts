import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, UnauthorizedError } from "@/lib/auth";
import { onboardingSchema, apiError } from "@/lib/validation";

/** POST /api/onboarding/complete — сохраняет выбор тегов и завершает онбординг. */
export async function POST(req: Request) {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof UnauthorizedError) return apiError("Не авторизован", 401);
    throw e;
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Некорректный JSON", 400);
  }
  const parsed = onboardingSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Ошибка валидации", 400, parsed.error.flatten().fieldErrors);
  }
  const { conditionTagIds } = parsed.data;

  await db.$transaction([
    db.userConditionTag.deleteMany({ where: { userId: user.id } }),
    ...conditionTagIds.map((tagId) =>
      db.userConditionTag.create({
        data: { userId: user.id, conditionTagId: tagId },
      })
    ),
    db.user.update({
      where: { id: user.id },
      data: {
        consentAcceptedAt: user.consentAcceptedAt ?? new Date(),
        onboardingCompleted: true,
      },
    }),
  ]);

  const updated = await db.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      timezone: true,
      consentAcceptedAt: true,
      onboardingCompleted: true,
    },
  });
  return NextResponse.json({ user: updated });
}
