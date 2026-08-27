import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { readFileSync } from "node:fs";
import { createAIProxy } from "../api/ai.ts";

const TEST_KEY = "test-only-provider-secret-never-real";
const envNames = [
  "DEEPSEEK_API_KEY",
  "DEEPSEEK_API_BASE",
  "DEEPSEEK_API_MODEL",
  "AI_RATE_LIMIT_PER_MINUTE",
  "AI_RATE_LIMIT_PER_HOUR",
];
const savedEnv = Object.fromEntries(
  envNames.map((name) => [name, process.env[name]]),
);
let ai = createAIProxy();
beforeEach(() => {
  for (const name of envNames) delete process.env[name];
  process.env.DEEPSEEK_API_KEY = TEST_KEY;
  ai = createAIProxy();
});
afterEach(() => {
  for (const name of envNames) {
    if (savedEnv[name] === undefined) delete process.env[name];
    else process.env[name] = savedEnv[name];
  }
});

function request(
  body: unknown = { prompt: "推荐运动鞋" },
  headers: Record<string, string> = {},
) {
  return new Request("https://shop.example/api/ai", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": "203.0.113.10",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}
const success = () =>
  Response.json({
    choices: [{ message: { content: "  轻盈舒适，每一步都自在  " } }],
  });

test("returns only text and forwards fixed model/settings with server credentials, never client headers", async (t) => {
  t.mock.method(globalThis, "fetch", async (url: URL, init: RequestInit) => {
    assert.equal(url.href, "https://api.deepseek.com/v1/chat/completions");
    assert.equal(init.method, "POST");
    assert.equal(init.redirect, "error");
    assert.ok(init.signal);
    assert.deepEqual(Object.fromEntries(new Headers(init.headers)), {
      authorization: `Bearer ${TEST_KEY}`,
      "content-type": "application/json",
    });
    assert.deepEqual(JSON.parse(init.body as string), {
      model: "deepseek-chat",
      max_tokens: 300,
      temperature: 0.7,
      thinking: { type: "disabled" },
      messages: [
        {
          role: "system",
          content: "你是一个电商卖点文案专家。直接输出结果，不要额外解释。",
        },
        { role: "user", content: "推荐运动鞋" },
      ],
    });
    return success();
  });
  const response = await ai.fetch(
    request(
      {
        prompt: " 推荐运动鞋 ",
        model: "deepseek-chat",
        max_tokens: 9000,
        base: "https://evil.example",
        messages: [],
      },
      {
        Origin: "https://shop.example",
        Cookie: "private-cookie",
        Authorization: "private-client-token",
        "X-Vercel-Protection-Bypass": "private-bypass",
        "X-Vercel-Id": "private-id",
      },
    ),
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), {
    text: "轻盈舒适，每一步都自在",
    error: null,
  });
});

test("supports server-only base/model configuration and rejects arbitrary client models", async (t) => {
  process.env.DEEPSEEK_API_BASE = "https://provider.example/v1///";
  process.env.DEEPSEEK_API_MODEL = "configured-model";
  const fetch = t.mock.method(
    globalThis,
    "fetch",
    async (url: URL, init: RequestInit) => {
      assert.equal(url.href, "https://provider.example/v1/chat/completions");
      assert.equal(JSON.parse(init.body as string).model, "configured-model");
      return success();
    },
  );
  assert.equal((await ai.fetch(request())).status, 200);
  assert.equal(
    (await ai.fetch(request({ prompt: "商品", model: "configured-model" })))
      .status,
    200,
  );
  for (const model of ["expensive-model", "", null, 123]) {
    assert.equal(
      (await ai.fetch(request({ prompt: "商品", model }))).status,
      400,
    );
  }
  assert.equal(fetch.mock.callCount(), 2);
});

test("rejects missing, blank, invalid and overlong prompts before calling upstream", async (t) => {
  const fetch = t.mock.method(globalThis, "fetch", async () => success());
  for (const body of [
    {},
    null,
    [],
    { prompt: 42 },
    { prompt: "   " },
    { prompt: "a".repeat(2001) },
  ]) {
    const response = await ai.fetch(request(body));
    assert.equal(response.status, 400);
    assert.equal(response.headers.get("cache-control"), "no-store");
  }
  assert.equal(fetch.mock.callCount(), 0);
  assert.equal(
    (await ai.fetch(request({ prompt: "字".repeat(2000) }))).status,
    200,
  );
});

test("rejects malformed JSON and bodies above 16 KiB with and without Content-Length", async (t) => {
  const fetch = t.mock.method(globalThis, "fetch", async () => success());
  for (const [body, headers] of [
    ["{", {}],
    [JSON.stringify({ prompt: "商品", extra: "x".repeat(16384) }), {}],
    [JSON.stringify({ prompt: "商品" }), { "Content-Length": "16385" }],
  ] as const) {
    const response = await ai.fetch(
      new Request("https://shop.example/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body,
      }),
    );
    assert.equal(response.status, 400);
  }
  assert.equal(fetch.mock.callCount(), 0);
});

test("only accepts POST JSON and refuses cross-site browser calls", async (t) => {
  const fetch = t.mock.method(globalThis, "fetch", async () => success());
  for (const method of ["GET", "OPTIONS", "PUT"]) {
    const response = await ai.fetch(
      new Request("https://shop.example/api/ai", { method }),
    );
    assert.equal(response.status, 405);
    assert.equal(response.headers.get("allow"), "POST");
  }
  for (const headers of [
    { Origin: "https://evil.example" },
    { Origin: "null" },
    { "Sec-Fetch-Site": "cross-site" },
  ] as Record<string, string>[]) {
    assert.equal((await ai.fetch(request(undefined, headers))).status, 403);
  }
  assert.equal(
    (await ai.fetch(request(undefined, { "Content-Type": "text/plain" })))
      .status,
    415,
  );
  assert.equal(fetch.mock.callCount(), 0);
});

test("default rolling minute limit allows 10 requests, isolates IPs and expires exactly at 60 seconds", async (t) => {
  let now = 1_000_000;
  t.mock.method(Date, "now", () => now);
  const fetch = t.mock.method(globalThis, "fetch", async () => success());
  for (let i = 0; i < 10; i++)
    assert.equal((await ai.fetch(request())).status, 200);
  now += 59_999;
  const limited = await ai.fetch(request());
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get("retry-after"), "1");
  assert.equal(limited.headers.get("cache-control"), "no-store");
  assert.equal(fetch.mock.callCount(), 10);
  assert.equal(
    (await ai.fetch(request(undefined, { "x-forwarded-for": "203.0.113.11" })))
      .status,
    200,
  );
  now++;
  assert.equal((await ai.fetch(request())).status, 200);
});

test("default hourly quota survives minute resets and expires at one hour", async (t) => {
  let now = 1_000_000;
  t.mock.method(Date, "now", () => now);
  t.mock.method(globalThis, "fetch", async () => success());
  for (let minute = 0; minute < 5; minute++) {
    for (let i = 0; i < 10; i++)
      assert.equal((await ai.fetch(request())).status, 200);
    now += 60_000;
  }
  const response = await ai.fetch(request());
  assert.equal(response.status, 429);
  assert.equal(response.headers.get("retry-after"), "3300");
  now = 1_000_000 + 3_600_000;
  assert.equal((await ai.fetch(request())).status, 200);
});

test("configurable limits count concurrent attempts before awaiting the upstream", async (t) => {
  process.env.AI_RATE_LIMIT_PER_MINUTE = "2";
  process.env.AI_RATE_LIMIT_PER_HOUR = "3";
  let now = 1_000_000;
  t.mock.method(Date, "now", () => now);
  const fetch = t.mock.method(globalThis, "fetch", async () => success());
  const responses = await Promise.all(
    Array.from({ length: 6 }, () => ai.fetch(request())),
  );
  assert.deepEqual(
    responses.map((r) => r.status),
    [200, 200, 429, 429, 429, 429],
  );
  now += 60_000;
  assert.equal((await ai.fetch(request())).status, 200);
  assert.equal((await ai.fetch(request())).status, 429);
  assert.equal(fetch.mock.callCount(), 3);
});

test("invalid limits use safe defaults, not an unlimited quota", async (t) => {
  t.mock.method(globalThis, "fetch", async () => success());
  for (const invalid of ["", "0", "-1", "2.5", "Infinity", "bad"]) {
    process.env.AI_RATE_LIMIT_PER_MINUTE = invalid;
    process.env.AI_RATE_LIMIT_PER_HOUR = invalid;
    const proxy = createAIProxy();
    for (let i = 0; i < 10; i++)
      assert.equal((await proxy.fetch(request())).status, 200);
    assert.equal((await proxy.fetch(request())).status, 429);
  }
});

test("uses the first forwarded IP, normalizes IPv6 and shares missing/invalid IP buckets", async (t) => {
  process.env.AI_RATE_LIMIT_PER_MINUTE = "1";
  t.mock.method(globalThis, "fetch", async () => success());
  for (const [first, second] of [
    ["203.0.113.1, 192.0.2.1", "203.0.113.1, 192.0.2.2"],
    ["2001:DB8:0:0:0:0:0:1", "2001:db8::1"],
    ["", "not-an-ip"],
  ]) {
    assert.equal(
      (await ai.fetch(request(undefined, { "x-forwarded-for": first! })))
        .status,
      200,
    );
    assert.equal(
      (await ai.fetch(request(undefined, { "x-forwarded-for": second! })))
        .status,
      429,
    );
  }
});

test("bounds tracked IPs without evicting live counters and reclaims expired entries", async (t) => {
  let now = 1_000_000;
  t.mock.method(Date, "now", () => now);
  const fetch = t.mock.method(globalThis, "fetch", async () => success());
  // Invalid attempts also consume quota, without paid upstream requests.
  for (let i = 0; i < 10_000; i++) {
    const ip = `10.0.${Math.floor(i / 256)}.${i % 256}`;
    assert.equal(
      (await ai.fetch(request({}, { "x-forwarded-for": ip }))).status,
      400,
    );
  }
  assert.equal((await ai.fetch(request())).status, 429);
  assert.equal(fetch.mock.callCount(), 0);
  now += 3_600_000;
  assert.equal((await ai.fetch(request())).status, 200);
});

test("missing key and unsafe server base return 503 without forwarding", async (t) => {
  const fetch = t.mock.method(globalThis, "fetch", async () => success());
  delete process.env.DEEPSEEK_API_KEY;
  assert.equal((await ai.fetch(request())).status, 503);
  process.env.DEEPSEEK_API_KEY = TEST_KEY;
  for (const base of [
    "http://provider.example/v1",
    "https://user:password@provider.example/v1",
    "not a url",
    "https://provider.example/v1?token=private",
    "https://provider.example/v1#fragment",
  ]) {
    process.env.DEEPSEEK_API_BASE = base;
    assert.equal((await ai.fetch(request())).status, 503);
  }
  assert.equal(fetch.mock.callCount(), 0);
});

for (const status of [400, 401, 402, 403, 429, 500, 502, 503, 504]) {
  test(`preserves upstream ${status} but never returns its body, key, or headers`, async (t) => {
    t.mock.method(
      globalThis,
      "fetch",
      async () =>
        new Response(`Bearer ${TEST_KEY} private-detail`, {
          status,
          headers: {
            "Set-Cookie": "private",
            "X-Secret": TEST_KEY,
            "Cache-Control": "public",
          },
        }),
    );
    const response = await ai.fetch(request());
    assert.equal(response.status, status);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(response.headers.get("set-cookie"), null);
    assert.equal(response.headers.get("x-secret"), null);
    assert.doesNotMatch(
      await response.text(),
      /test-only-provider-secret|private-detail/,
    );
  });
}

for (const [name, status] of [
  ["TimeoutError", 504],
  ["AbortError", 504],
  ["TypeError", 502],
] as const) {
  test(`${name} returns sanitized ${status}`, async (t) => {
    t.mock.method(globalThis, "fetch", async () => {
      throw Object.assign(new Error(TEST_KEY), { name });
    });
    const response = await ai.fetch(request());
    assert.equal(response.status, status);
    assert.doesNotMatch(await response.text(), /test-only-provider-secret/);
  });
}

test("malformed/empty upstream success is 502 and even echoed secrets are redacted", async (t) => {
  for (const body of [
    "{",
    "null",
    JSON.stringify({ choices: [] }),
    JSON.stringify({ choices: [{ message: { content: " " } }] }),
  ]) {
    const fetch = t.mock.method(
      globalThis,
      "fetch",
      async () => new Response(body),
    );
    assert.equal((await ai.fetch(request())).status, 502);
    fetch.mock.restore();
  }
  t.mock.method(globalThis, "fetch", async () =>
    Response.json({ choices: [{ message: { content: TEST_KEY } }] }),
  );
  assert.deepEqual(await (await ai.fetch(request())).json(), {
    text: "[redacted]",
    error: null,
  });
});

test("AI rewrite precedes the shop wildcard and the SPA fallback", () => {
  const config = JSON.parse(
    readFileSync(new URL("../vercel.json", import.meta.url), "utf8"),
  );
  const aiIndex = config.rewrites.findIndex(
    (r: { source: string }) => r.source === "/api/ai",
  );
  const shopIndex = config.rewrites.findIndex(
    (r: { source: string }) => r.source === "/api/:path*",
  );
  assert.ok(aiIndex >= 0 && aiIndex < shopIndex);
  assert.equal(config.rewrites[aiIndex].destination, "/api/ai");
  assert.equal(config.functions["api/ai.ts"].maxDuration, 20);
});
