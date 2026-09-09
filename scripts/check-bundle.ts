import { existsSync } from "node:fs";
if (!existsSync(".next/standalone/server.js")) throw new Error("Standalone server.js is missing");
if (!existsSync(".next/static")) throw new Error("Standalone static assets are missing");
console.log("Standalone bundle is complete.");
