import { readdir, stat } from "node:fs/promises";
import path from "node:path";

async function filesIn(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? filesIn(fullPath) : [fullPath];
  }));
  return nested.flat();
}

const files = await filesIn(path.resolve("out/_next/static"));
const javascript = files.filter((file) => file.endsWith(".js"));
const css = files.filter((file) => file.endsWith(".css"));
const bytes = async (items: string[]) => (await Promise.all(items.map(async (file) => (await stat(file)).size))).reduce((sum, size) => sum + size, 0);
const [jsBytes, cssBytes] = await Promise.all([bytes(javascript), bytes(css)]);

function format(size: number): string {
  return `${(size / 1024).toFixed(1)} KiB`;
}

// eslint-disable-next-line no-console
console.log(`Static bundle: JS ${format(jsBytes)} in ${javascript.length} files; CSS ${format(cssBytes)} in ${css.length} files; total ${format(jsBytes + cssBytes)}`);
