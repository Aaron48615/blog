import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const dist = fileURLToPath(new URL("../dist/", import.meta.url));
const secrets = [
  process.env.DEEPSEEK_API_KEY,
  process.env.VITE_AI_API_KEY,
].filter(Boolean);
const forbidden =
  /DEEPSEEK_API_KEY|VITE_AI_API_(?:KEY|BASE|MODEL)|ai_api_key|api\.deepseek\.com|\bsk-(?:proj-|svcacct-)?[a-zA-Z0-9_-]{20,}/;
let count = 0;
const failures = [];
async function scan(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await scan(path);
    else if (entry.isFile()) {
      const content = await readFile(path, "utf8");
      count++;
      if (
        forbidden.test(content) ||
        secrets.some((secret) => content.includes(secret))
      )
        failures.push(path);
    }
  }
}
await scan(dist);
if (!count || failures.length) {
  // Report paths only; never print matched credentials.
  console.error(
    "AI bundle check failed:",
    failures.length ? failures : "empty dist",
  );
  process.exitCode = 1;
} else {
  console.log(
    `AI bundle check passed: ${count} files; no configured secret or known client AI credential pattern found.`,
  );
}
