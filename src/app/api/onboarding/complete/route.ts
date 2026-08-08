import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { onboardingSchema, apiError } from "@/lib/validation";
import { withApiHandler } from "@/lib/route-handler";

/** POST /api/onboarding/complete — сохраняет выбор тегов и завершает онбординг. */
export const POST = withApiHandler("onboarding.complete", async (req, { logger }) => {
  const user = await requireUser();

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

  logger.info("onboarding.complete.success", { userId: user.id, tagCount: conditionTagIds.length });
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
});
