import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const baseIndex = args.indexOf("--base-path");
const siteIndex = args.indexOf("--site-url");
const basePath = baseIndex >= 0 ? args[baseIndex + 1] ?? "" : "";
const siteUrl = siteIndex >= 0 ? args[siteIndex + 1] : "https://example.github.io/";
if (siteIndex < 0 || !siteUrl) throw new Error("Usage: bun run build:pages --base-path /repo --site-url https://user.github.io/repo/");
const pathname = new URL(siteUrl).pathname.replace(/\/$/, "");
if (pathname !== basePath) throw new Error(`site URL pathname ${pathname} does not match base path ${basePath}`);
mkdirSync("public", { recursive: true });
writeFileSync(join("public", "og.png"), Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64"));
const result = spawnSync("bun", ["run", "next", "build"], { stdio: "inherit", env: { ...process.env, STATIC_EXPORT: "true", NEXT_PUBLIC_BASE_PATH: basePath, NEXT_PUBLIC_SITE_URL: siteUrl } });
if (result.status !== 0) process.exit(result.status ?? 1);
mkdirSync("out", { recursive: true });
writeFileSync(join("out", ".nojekyll"), "");
console.log(`Static export ready at out/ for ${siteUrl}`);
