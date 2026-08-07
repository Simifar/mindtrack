import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/health — простая проверка жизни приложения и доступности БД.
 */
export async function GET() {
  let dbStatus: "connected" | "error" = "connected";
  try {
    await db.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = "error";
  }

  return NextResponse.json({
    status: "ok",
    db: dbStatus,
    timestamp: new Date().toISOString(),
  });
}
