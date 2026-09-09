import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { join, normalize } from "node:path";
const root = join(process.cwd(), "out");
if (!existsSync(root)) throw new Error("out/ does not exist. Run bun run build:pages first.");
const port = Number(process.env.PORT ?? 4173);
const server = createServer((request, response) => {
  const pathname = decodeURIComponent((request.url ?? "/").split("?")[0]);
  const relative = normalize(pathname).replace(/^([.][.][\\/])+/, "");
  const candidates = [join(root, relative), join(root, relative, "index.html"), join(root, `${relative}.html`)];
  const file = candidates.find((candidate) => existsSync(candidate) && statSync(candidate).isFile());
  if (!file) { response.statusCode = 404; response.end("Not found"); return; }
  createReadStream(file).pipe(response);
});
server.listen(port, () => console.log(`Static preview: http://localhost:${port}`));
