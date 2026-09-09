import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";
test("emitted Node ESM function imports resolve without source TypeScript files", async () => {
  const directory = mkdtempSync(join(tmpdir(), "compare-build-"));
  try {
    writeFileSync(join(directory, "package.json"), '{"type":"module"}');
    const config = ts.readConfigFile(
      new URL("../tsconfig.json", import.meta.url).pathname,
      ts.sys.readFile,
    ).config;
    const options = ts.convertCompilerOptionsFromJson(
      config.compilerOptions ?? {},
      ".",
    ).options;
    for (const file of [
      "api/compare.ts",
      "server/compare.ts",
      "src/compare/model.ts",
      "src/compare/stream.ts",
    ]) {
      const source = readFileSync(
        new URL("../" + file, import.meta.url),
        "utf8",
      );
      const result = ts.transpileModule(source, {
        compilerOptions: {
          ...options,
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2022,
        },
      });
      const target = join(directory, file.replace(/\.ts$/, ".js"));
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, result.outputText);
    }
    const { default: handler } = await import(
      pathToFileURL(join(directory, "api/compare.js")).href
    );
    assert.equal(
      (
        await handler.fetch(
          new Request("https://shop.example/api/compare/advice"),
        )
      ).status,
      405,
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("Vercel opts the streaming function into client cancellation", () => {
  const config = JSON.parse(
    readFileSync(new URL("../vercel.json", import.meta.url), "utf8"),
  );
  assert.equal(config.functions["api/compare.ts"].supportsCancellation, true);
});
