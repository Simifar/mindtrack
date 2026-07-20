import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

/** GET /api/onboarding — справочник ConditionTag + текущие выбранные теги пользователя. */
export async function GET() {
  const user = await getCurrentUser();
  const tags = await db.conditionTag.findMany({ orderBy: { name: "asc" } });

  let selectedIds: string[] = [];
  if (user) {
    const links = await db.userConditionTag.findMany({
      where: { userId: user.id },
      select: { conditionTagId: true },
    });
    selectedIds = links.map((l) => l.conditionTagId);
  }
  return NextResponse.json({ tags, selectedIds });
}
