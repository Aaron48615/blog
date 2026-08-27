import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const { outputText } = ts.transpileModule(
  readFileSync(new URL("../src/utils/rem.ts", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
);

function loadRem(clientWidth: number, bodyWidth = clientWidth) {
  const document = {
    documentElement: { clientWidth, style: { fontSize: "" } },
    body: { clientWidth: bodyWidth },
  };
  const listeners = new Map<string, () => void>();
  runInNewContext(outputText, {
    exports: {},
    document,
    window: {
      addEventListener: (event: string, callback: () => void) =>
        listeners.set(event, callback),
    },
  });
  return { document, listeners };
}

for (const width of [320, 360, 375, 376, 750, 1280]) {
  test(`rem at ${width}px keeps the 10rem shell at min(viewport, 375px)`, () => {
    const { document } = loadRem(width);
    const fontSize = parseFloat(document.documentElement.style.fontSize);
    assert.equal(fontSize, Math.min(width, 375) / 10);
    assert.equal(fontSize * 10, Math.min(width, 375));
  });
}

test("resize and orientation changes recompute the root font", () => {
  const { document, listeners } = loadRem(1280);
  document.documentElement.clientWidth = 320;
  assert.ok(listeners.has("resize"));
  listeners.get("resize")!();
  assert.equal(document.documentElement.style.fontSize, "32px");

  document.documentElement.clientWidth = 667;
  assert.ok(listeners.has("orientationchange"));
  listeners.get("orientationchange")!();
  assert.equal(document.documentElement.style.fontSize, "37.5px");
});

test("body width fallback still respects the phone-width cap", () => {
  assert.equal(loadRem(0, 320).document.documentElement.style.fontSize, "32px");
  assert.equal(
    loadRem(0, 1280).document.documentElement.style.fontSize,
    "37.5px",
  );
});
