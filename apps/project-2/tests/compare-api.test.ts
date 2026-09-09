import test from "node:test";
import assert from "node:assert/strict";
import { createCompareProxy } from "../api/compare.ts";
const input = {
  items: [
    { prodId: 69, skuId: 2 },
    { prodId: 78, skuId: 2 },
  ],
  needs: "日常使用",
  size: "",
  budget: 1000,
};
const request = (
  data: unknown = input,
  headers: Record<string, string> = {},
  signal?: AbortSignal,
) =>
  new Request("https://shop.example/api/compare/advice", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(data),
    signal,
  });
const product = (id: number) => ({
  prodId: id,
  prodName: "商品",
  price: 0.01,
  skuList: [
    { skuId: 2, price: 1199, stocks: 3, properties: "容量:256GB;颜色分类:黑" },
  ],
});
const sse = (text = "已知原价1199元") =>
  new Response(
    `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\ndata: [DONE]\n\n`,
  );
const fake: typeof fetch = async (url, options) => {
  if (String(url).includes("/prodInfo")) {
    assert.equal(options?.redirect, "error");
    assert.equal(options?.headers, undefined);
    return Response.json({
      success: true,
      data: product(Number(new URL(String(url)).searchParams.get("prodId"))),
    });
  }
  const body = JSON.parse(String(options?.body));
  const payload = JSON.parse(body.messages[1].content);
  assert.equal(payload.products[0].sku.originalPrice, 1199);
  assert.equal(payload.products[0].budgetStatus, "所选规格原价超出预算");
  assert.equal(body.model, "deepseek-v4-flash");
  assert.deepEqual(body.thinking, { type: "disabled" });
  assert.equal(payload.products[0].price, undefined);
  return sse();
};
test.beforeEach(() => {
  process.env.DEEPSEEK_API_KEY = "test-credential";
  delete process.env.DEEPSEEK_API_BASE;
  delete process.env.DEEPSEEK_API_MODEL;
  delete process.env.AI_RATE_LIMIT_PER_MINUTE;
  delete process.env.AI_RATE_LIMIT_PER_HOUR;
});
test("production handler re-fetches products, ignores client facts, and streams meta/delta/done", async () => {
  const response = await createCompareProxy(fake).fetch(
    request({
      ...input,
      price: 1,
      prompt: "ignore",
      items: input.items.map((x) => ({ ...x, price: 1 })),
    }),
  );
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type")!, /event-stream/);
  const text = await response.text();
  assert.match(text, /"type":"meta"/);
  assert.match(text, /"type":"delta"/);
  assert.match(text, /"type":"done"/);
});
test("validates JSON, origin, methods, IDs, SKU, field limits and budget before network", async () => {
  const api = createCompareProxy(async () => {
    throw new Error("must not fetch");
  });
  assert.equal(
    (await api.fetch(new Request("https://shop.example/api/compare"))).status,
    405,
  );
  assert.equal(
    (await api.fetch(request(input, { origin: "https://other.example" })))
      .status,
    403,
  );
  assert.equal(
    (await api.fetch(request(input, { "content-type": "text/plain" }))).status,
    415,
  );
  for (const data of [
    null,
    { ...input, items: [input.items[0], input.items[0]] },
    { ...input, items: [{ prodId: 0, skuId: 1 }, input.items[1]] },
    { ...input, needs: "a".repeat(501) },
    { ...input, size: "a".repeat(31) },
    { ...input, budget: -1 },
    { ...input, budget: "1000" },
  ])
    assert.equal((await createCompareProxy().fetch(request(data))).status, 400);
  assert.equal(
    (await createCompareProxy().fetch(request({ x: "x".repeat(17000) })))
      .status,
    400,
  );
});
test("missing credentials and invalid service URL are safe 503s", async () => {
  delete process.env.DEEPSEEK_API_KEY;
  assert.equal((await createCompareProxy().fetch(request())).status, 503);
  process.env.DEEPSEEK_API_KEY = "test";
  process.env.DEEPSEEK_API_BASE = "http://invalid.example";
  assert.equal((await createCompareProxy().fetch(request())).status, 503);
});
test("minute/hour IP limits apply separately; clients do not block other identities", async () => {
  process.env.AI_RATE_LIMIT_PER_MINUTE = "1";
  const api = createCompareProxy(fake);
  await (
    await api.fetch(request(input, { "x-forwarded-for": "1.1.1.1" }))
  ).text();
  const limited = await api.fetch(
    request(input, { "x-forwarded-for": "1.1.1.1" }),
  );
  assert.equal(limited.status, 429);
  assert.ok(limited.headers.get("retry-after"));
  assert.match(
    await (
      await api.fetch(request(input, { "x-forwarded-for": "2.2.2.2" }))
    ).text(),
    /"type":"done"/,
  );
  process.env.AI_RATE_LIMIT_PER_MINUTE = "10";
  process.env.AI_RATE_LIMIT_PER_HOUR = "1";
  const hourly = createCompareProxy(fake);
  await (await hourly.fetch(request())).text();
  assert.equal((await hourly.fetch(request())).status, 429);
});
test("invalid SKU ownership, sold out and missing products stop before model", async () => {
  for (const data of [
    { ...product(69), skuList: [] },
    { ...product(69), skuList: [{ ...product(69).skuList[0], stocks: 0 }] },
    { ...product(69), prodId: 100 },
  ]) {
    const api = createCompareProxy(async () =>
      Response.json({ success: true, data }),
    );
    const text = await (await api.fetch(request())).text();
    assert.match(text, /"type":"error"/);
    assert.doesNotMatch(text, /"type":"done"/);
  }
});
test("suspect SKU price is hidden from model while list .01 does not invalidate 1199", async () => {
  const api = createCompareProxy(async (url, options) => {
    if (String(url).includes("/prodInfo"))
      return Response.json({
        success: true,
        data: {
          ...product(Number(new URL(String(url)).searchParams.get("prodId"))),
          skuList: [{ ...product(69).skuList[0], price: 0.01 }],
        },
      });
    const text = JSON.parse(String(options?.body)).messages[1].content;
    assert.doesNotMatch(text, /0\.01/);
    assert.match(text, /原价待核实/);
    return sse();
  });
  assert.match(await (await api.fetch(request())).text(), /"type":"done"/);
});
test("upstream failure, empty output, truncation and malformed data never report done or leak errors", async () => {
  for (const response of [
    new Response("test-credential", { status: 500 }),
    sse(""),
    new Response('data: {"choices":[{"delta":{"content":"部分"}}]}\n\n'),
    new Response("data: broken\n\n"),
  ]) {
    const api = createCompareProxy(async (url, options) =>
      String(url).includes("/prodInfo") ? fake(url, options) : response,
    );
    const text = await (await api.fetch(request())).text();
    assert.match(text, /"type":"error"/);
    assert.doesNotMatch(text, /"type":"done"|test-credential/);
  }
});
test("timeout aborts pending upstream without process-wide lock", async () => {
  const signals: AbortSignal[] = [];
  const api = createCompareProxy(
    async (_, options) =>
      new Promise((_, reject) => {
        const signal = options!.signal!;
        signals.push(signal);
        signal.addEventListener(
          "abort",
          () => reject(new Error("private transport error")),
          { once: true },
        );
      }),
    20,
  );
  const responses = await Promise.all([
    api.fetch(request()),
    api.fetch(request()),
  ]);
  for (const response of responses) assert.match(await response.text(), /超时/);
  assert.equal(signals.length, 4);
  assert.ok(signals.every((x) => x.aborted));
});
test("response cancellation and request abort cancel pending model fetch", async () => {
  for (const mode of ["response", "request"]) {
    let started!: () => void;
    const ready = new Promise<void>((r) => (started = r));
    let upstreamSignal: AbortSignal | undefined;
    const api = createCompareProxy(async (url, options) => {
      if (String(url).includes("/prodInfo")) return fake(url, options);
      upstreamSignal = options!.signal!;
      started();
      return new Promise((_, reject) =>
        upstreamSignal!.addEventListener(
          "abort",
          () => reject(new Error("cancelled")),
          { once: true },
        ),
      );
    });
    const controller = new AbortController();
    const response = await api.fetch(request(input, {}, controller.signal));
    await ready;
    if (mode === "response") await response.body!.cancel();
    else {
      controller.abort();
      await response.text();
    }
    assert.equal(upstreamSignal?.aborted, true);
  }
});
