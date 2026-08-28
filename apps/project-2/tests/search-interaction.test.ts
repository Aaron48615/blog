import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test, type TestContext } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import * as vue from "vue";
import { compileScript, parse } from "vue/compiler-sfc";
import { getSearchSuggestion } from "../src/ai/search.js";

// Exercise the real Search.vue setup and AI client, with only network/clock/host
// adapters replaced. Mouse wiring is also checked in the browser; real-device
// touch verification remains separate from the native-touch guard tested here.
const { descriptor } = parse(
  readFileSync(new URL("../src/views/Search.vue", import.meta.url), "utf8"),
);
const { outputText } = ts.transpileModule(
  compileScript(descriptor, { id: "search-interaction-test" }).content,
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
);

class ClearTarget {
  private isClear: boolean;
  constructor(isClear = true) {
    this.isClear = isClear;
  }
  closest(selector: string) {
    return selector === ".van-field__clear" && this.isClear ? this : null;
  }
}

function loadSearch(t: TestContext, remote = false) {
  t.mock.timers.enable({ apis: ["setTimeout", "Date"] });
  const requests: string[] = [];
  t.mock.method(
    globalThis,
    "fetch",
    async (_url: string, init: RequestInit) => {
      requests.push(JSON.parse(init.body as string).prompt);
      return remote
        ? Response.json({ text: "茶叶礼盒\n绿茶", error: null })
        : Response.json(
            { text: null, error: "AI service is not configured" },
            { status: 503 },
          );
    },
  );
  const unmount: (() => void)[] = [];
  const scope = vue.effectScope();
  t.after(() => scope.stop());
  const exports: Record<string, any> = {};
  runInNewContext(outputText, {
    exports,
    require: (name: string) => {
      if (name === "vue")
        return {
          ...vue,
          onMounted: () => {},
          onBeforeUnmount: (callback: () => void) => unmount.push(callback),
        };
      if (name === "vue-router")
        return { useRouter: () => ({ push: () => {} }) };
      if (name === "../ai/search") return { getSearchSuggestion };
      if (name === "../api/search")
        return {
          hotInfo: async () => ({ data: [] }),
          searchInfo: async () => ({ data: { records: [] } }),
        };
      throw new Error(`Unexpected import: ${name}`);
    },
    Element: ClearTarget,
    setTimeout,
    clearTimeout,
    Date,
    console: { log: () => {}, warn: () => {}, error: () => {} },
    localStorage: { getItem: () => null, setItem: () => {} },
  });
  const state = scope.run(() =>
    exports.default.setup({}, { expose: () => {} }),
  );
  const input = (value: string) => {
    state.keyWord.value = value;
    state.onInput();
  };
  const advance = async (ms: number) => {
    t.mock.timers.tick(ms);
    for (let i = 0; i < 20; i++) await Promise.resolve();
    await vue.nextTick();
  };
  return {
    state,
    input,
    requests,
    advance,
    unmount: () => unmount.forEach((fn) => fn()),
  };
}

test("search clear icon has a scoped mouse handler and keeps native touch clear", (t) => {
  const { state, input } = loadSearch(t);
  input("茶叶");
  assert.match(
    descriptor.template!.content,
    /@pointerdown\.capture="onSearchPointerDown"/,
  );
  assert.match(descriptor.template!.content, /@clear="onClear"/);
  let prevented = false;
  state.onSearchPointerDown({
    pointerType: "mouse",
    target: new ClearTarget(),
    preventDefault: () => {
      prevented = true;
    },
  });
  assert.equal(state.keyWord.value, "");
  assert.equal(prevented, true);
  input("鞋");
  state.onSearchPointerDown({
    pointerType: "touch",
    target: new ClearTarget(),
  });
  assert.equal(state.keyWord.value, "鞋", "touch remains handled by Vant");
  state.onClear();
  assert.equal(state.keyWord.value, "");
});

test("clicks elsewhere in the search field do not clear the keyword", (t) => {
  const { state, input } = loadSearch(t);
  input("茶叶");
  state.onSearchPointerDown({
    pointerType: "mouse",
    target: new ClearTarget(false),
  });
  assert.equal(state.keyWord.value, "茶叶");
});

test("AI 503 still renders non-empty fallback suggestions for an unknown category", async (t) => {
  const { state, input, advance } = loadSearch(t);
  input("茶叶");
  await advance(500);
  await advance(400);
  assert.equal(state.aiSource.value, "fallback");
  assert.deepEqual(Array.from(state.aiSuggestion.value), [
    "茶叶",
    "茶叶推荐",
    "茶叶新品",
    "茶叶热卖",
    "茶叶优惠",
  ]);
  assert.equal(state.aiLoading.value, false);
});

test("known categories retain existing local rules", async (t) => {
  const { state, input, advance } = loadSearch(t);
  input("运动鞋");
  await advance(500);
  await advance(400);
  assert.equal(state.aiSuggestion.value[0], "运动鞋");
  assert.equal(state.aiSuggestion.value.length, 5);
});

test("successful remote suggestions retain the AI label", async (t) => {
  const { state, input, advance } = loadSearch(t, true);
  input("茶叶");
  await advance(500);
  await advance(400);
  assert.deepEqual(Array.from(state.aiSuggestion.value), ["茶叶礼盒", "绿茶"]);
  assert.equal(state.aiSource.value, "openai");
  assert.equal(state.aiLoading.value, false);
});

test("clearing cancels pending AI work and resets the suggestion panel", async (t) => {
  const { state, input, requests, advance } = loadSearch(t);
  input("茶叶");
  state.onClear();
  await advance(1000);
  assert.equal(requests.length, 0);
  assert.equal(state.aiLoading.value, false);
  assert.equal(state.hasAiSuggestionStarted.value, false);
  assert.equal(state.aiSuggestion.value.length, 0);
});

test("leaving search cancels its pending suggestion request", async (t) => {
  const { input, requests, advance, unmount } = loadSearch(t);
  input("茶叶");
  unmount();
  await advance(1000);
  assert.equal(requests.length, 0);
});

test("clearing and retyping the same word ignores a late response from before clear", async (t) => {
  const { state, input, advance } = loadSearch(t);
  const pending: ((response: Response) => void)[] = [];
  t.mock.method(
    globalThis,
    "fetch",
    () => new Promise<Response>((resolve) => pending.push(resolve)),
  );
  input("茶叶");
  await advance(500);
  state.onClear();
  input("茶叶");
  await advance(500);
  pending[1]!(Response.json({ text: "最新建议" }));
  await advance(0);
  await advance(400);
  pending[0]!(Response.json({ text: "过期建议" }));
  await advance(0);
  assert.deepEqual(Array.from(state.aiSuggestion.value), ["最新建议"]);
  assert.equal(state.aiLoading.value, false);
});

test("an AI response cannot replace suggestions after a tag changes the keyword", async (t) => {
  const { state, input, advance } = loadSearch(t, true);
  let resolveResponse: (response: Response) => void = () => {};
  t.mock.method(
    globalThis,
    "fetch",
    () =>
      new Promise<Response>((resolve) => {
        resolveResponse = resolve;
      }),
  );
  input("茶叶");
  await advance(500);
  // Tag selection changes the model directly rather than emitting an input event.
  state.keyWord.value = "手机";
  resolveResponse(Response.json({ text: "茶叶礼盒" }));
  await advance(0);
  await advance(400);
  assert.equal(state.aiSuggestion.value.length, 0);
});
