import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { withApiHandler } from "@/lib/route-handler";

export const POST = withApiHandler("consent.accept", async (_req, { logger }) => {
  const user = await requireUser();
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
  logger.info("consent.accept.success", { userId: user.id });
  return NextResponse.json({ user: updated });
});
