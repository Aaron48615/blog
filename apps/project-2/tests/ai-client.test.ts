import assert from "node:assert/strict";
import { test } from "node:test";
import { generate } from "../src/ai/providers/openai.js";
import { getSearchSuggestion, getSellingPoint } from "../src/ai/search.js";
import { createAIProxy } from "../api/ai.ts";

const product = { prodName: "运动鞋", price: 99, brief: "轻便运动鞋" };

test("client uses same-origin proxy without constructing auth or reading browser configuration", async (t) => {
  t.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    assert.equal(url, "/api/ai");
    assert.equal(init.method, "POST");
    // Default same-origin cookies can satisfy Vercel Deployment Protection;
    // the handler must strip them before forwarding to the provider.
    assert.equal(init.credentials, undefined);
    assert.deepEqual(Object.fromEntries(new Headers(init.headers)), {
      "content-type": "application/json",
    });
    assert.deepEqual(JSON.parse(init.body as string), {
      prompt: "商品",
      model: "deepseek-chat",
    });
    return Response.json({ text: " 文案 ", error: null });
  });
  assert.deepEqual(await generate("商品", "deepseek-chat"), {
    text: "文案",
    error: null,
  });
});

for (const status of [400, 401, 403, 429, 500, 503, 504]) {
  test(`HTTP ${status} is classified safely and both public APIs retain fallback results`, async (t) => {
    t.mock.method(
      globalThis,
      "fetch",
      async () => new Response("private upstream detail", { status }),
    );
    const result = await generate("商品");
    assert.equal(result.text, null);
    assert.match(result.error!, new RegExp(`HTTP ${status}`));
    assert.doesNotMatch(result.error!, /private upstream detail/);
    const search = await getSearchSuggestion("运动鞋");
    assert.equal(search.source, "fallback");
    assert.ok(Array.isArray(search.result) && search.result.length === 5);
    const selling = await getSellingPoint(product);
    assert.equal(selling.source, "fallback");
    assert.deepEqual(selling.result, [
      "轻盈舒适，每一步都自在",
      "潮流设计，百搭不出错",
      "品质保证，正品承诺",
      "现货速发，急速物流",
    ]);
  });
}

test("proxy success keeps both {result, source} interfaces", async (t) => {
  t.mock.method(globalThis, "fetch", async () =>
    Response.json({ text: "建议一\n建议二", error: null }),
  );
  for (const result of [
    await getSearchSuggestion("鞋"),
    await getSellingPoint(product),
  ]) {
    assert.deepEqual(result, { result: "建议一\n建议二", source: "openai" });
  }
});

test("network errors and malformed/empty JSON return fallback without throwing", async (t) => {
  for (const implementation of [
    async () => {
      throw new TypeError("Failed to fetch");
    },
    async () => new Response("not json"),
    async () => Response.json({ text: " " }),
    async () => Response.json({ text: 12 }),
  ]) {
    const fetch = t.mock.method(globalThis, "fetch", implementation);
    assert.equal((await generate("商品")).text, null);
    assert.equal((await getSellingPoint(product)).source, "fallback");
    fetch.mock.restore();
  }
});

test("15-second timeout includes response-body reads and is always cleared", async (t) => {
  let timeoutCallback: (() => void) | undefined;
  const timer = t.mock.method(
    globalThis,
    "setTimeout",
    (callback: () => void, delay: number) => {
      assert.equal(delay, 15_000);
      timeoutCallback = callback;
      return 123;
    },
  );
  const cleared = t.mock.method(globalThis, "clearTimeout", (id: number) =>
    assert.equal(id, 123),
  );
  t.mock.method(
    globalThis,
    "fetch",
    async (_url: string, init: RequestInit) => ({
      ok: true,
      json: () =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError")),
          );
          timeoutCallback!();
        }),
    }),
  );
  assert.deepEqual(await generate("商品"), {
    text: null,
    error: "请求超时（15s）",
  });
  assert.equal(timer.mock.callCount(), 1);
  assert.equal(cleared.mock.callCount(), 1);
});

test("client-to-handler integration falls back when the server has no key", async (t) => {
  const savedKey = process.env.DEEPSEEK_API_KEY;
  delete process.env.DEEPSEEK_API_KEY;
  t.after(() => {
    if (savedKey === undefined) delete process.env.DEEPSEEK_API_KEY;
    else process.env.DEEPSEEK_API_KEY = savedKey;
  });
  const proxy = createAIProxy();
  t.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    assert.equal(url, "/api/ai");
    const response = await proxy.fetch(
      new Request(`https://shop.example${url}`, init),
    );
    assert.equal(response.status, 503);
    return response;
  });
  assert.equal((await getSearchSuggestion("鞋")).source, "fallback");
  assert.equal((await getSellingPoint(product)).source, "fallback");
});
