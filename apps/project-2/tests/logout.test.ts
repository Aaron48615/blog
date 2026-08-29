import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import * as vue from "vue";
import { compileScript, parse } from "vue/compiler-sfc";

const { descriptor } = parse(
  readFileSync(new URL("../src/views/Mine.vue", import.meta.url), "utf8"),
);
const { outputText } = ts.transpileModule(
  compileScript(descriptor, { id: "logout-test" }).content,
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
);

test("the logout button clears the token and routes to login", () => {
  const pushedRoutes: string[] = [];
  let tokenDeleted = false;
  const exports: Record<string, any> = {};

  runInNewContext(outputText, {
    exports,
    require: (name: string) => {
      if (name === "vue") return { ...vue, onMounted: () => {} };
      if (name === "vue-router") {
        return {
          useRouter: () => ({
            push: (path: string) => pushedRoutes.push(path),
          }),
        };
      }
      if (name === "../api/mine") {
        return {
          orderCountInfo: async () => ({ data: {} }),
          collectionCountInfo: async () => ({ data: 0 }),
        };
      }
      if (name === "../utils/auth") {
        return {
          delToken: () => {
            tokenDeleted = true;
          },
        };
      }
      throw new Error(`Unexpected import: ${name}`);
    },
    console: { error: () => {} },
  });

  const state = vue
    .effectScope()
    .run(() => exports.default.setup({}, { expose: () => {} }));

  assert.match(descriptor.template!.content, /@click="logout"/);
  state.logout();
  assert.equal(tokenDeleted, true);
  assert.deepEqual(pushedRoutes, ["/login"]);
});
