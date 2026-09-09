import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
const required = ["index.html", "404.html", "sitemap.xml", "robots.txt", ".nojekyll", "og.png"];
for (const file of required) if (!existsSync(join("out", file))) throw new Error(`Missing static file: out/${file}`);
for (const forbidden of [".env", "server.js", "package.json", "bun.lock"]) if (existsSync(join("out", forbidden))) throw new Error(`Server file leaked into export: ${forbidden}`);
const html = readFileSync(join("out", "index.html"), "utf8");
const usesRepositoryBasePath = html.includes('href="/MindTrack/') || html.includes('src="/MindTrack/');
if (usesRepositoryBasePath && html.match(/(?:href|src)="\/(?!MindTrack\/)/)) throw new Error("Export contains root-relative asset links; basePath is incorrect");
console.log("Pages bundle passed route, asset, and server-file checks.");
