import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/route-handler";

export const GET = withApiHandler("root", async () => {
  return NextResponse.json({ message: "MindTrack API" });
});