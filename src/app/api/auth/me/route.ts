import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { withApiHandler } from "@/lib/route-handler";

export const GET = withApiHandler("auth.me", async () => {
  const user = await getCurrentUser();
  return NextResponse.json({ user });
});
