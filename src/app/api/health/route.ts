import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withApiHandler } from "@/lib/route-handler";

export const dynamic = "force-dynamic";

/**
 * GET /api/health — простая проверка жизни приложения и доступности БД.
 */
export const GET = withApiHandler("health", async (_req, { logger }) => {
  let dbStatus: "connected" | "error" = "connected";
  try {
    await db.$queryRaw`SELECT 1`;
  } catch (err) {
    dbStatus = "error";
    logger.error("health.dbCheckFailed", { message: err instanceof Error ? err.message : String(err) });
  }

  return NextResponse.json({
    status: dbStatus === "connected" ? "ok" : "degraded",
    db: dbStatus,
    timestamp: new Date().toISOString(),
  });
});
