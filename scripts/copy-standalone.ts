/**
 * Cross-platform helper for copying static assets into Next.js standalone output.
 * Replaces Unix-only `cp -r` so the build works on Windows PowerShell/CMD too.
 */
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const standaloneDir = join(process.cwd(), ".next", "standalone");

if (!existsSync(standaloneDir)) {
  console.error("❌ .next/standalone not found. Run 'next build' first.");
  process.exit(1);
}

const targetStatic = join(standaloneDir, ".next", "static");
const targetPublic = join(standaloneDir, "public");

if (existsSync(targetStatic)) rmSync(targetStatic, { recursive: true, force: true });
if (existsSync(targetPublic)) rmSync(targetPublic, { recursive: true, force: true });

mkdirSync(join(standaloneDir, ".next"), { recursive: true });

cpSync(join(process.cwd(), ".next", "static"), targetStatic, { recursive: true });
cpSync(join(process.cwd(), "public"), targetPublic, { recursive: true });

console.log("✅ Copied .next/static and public to .next/standalone/");
