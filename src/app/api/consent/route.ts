import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, UnauthorizedError } from "@/lib/auth";
import { apiError } from "@/lib/validation";

export async function POST() {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof UnauthorizedError) return apiError("Не авторизован", 401);
    throw e;
  }
  const updated = await db.user.update({
    where: { id: user.id },
    data: { consentAcceptedAt: new Date() },
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
