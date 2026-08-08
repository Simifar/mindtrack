import { NextResponse } from "next/server";
import { destroySession, getCurrentUser } from "@/lib/auth";
import { withApiHandler } from "@/lib/route-handler";

export const POST = withApiHandler("auth.logout", async (_req, { logger }) => {
  const user = await getCurrentUser();
  await destroySession();
  if (user) {
    logger.info("auth.logout.success", { userId: user.id });
  }
  return NextResponse.json({ ok: true });
});
