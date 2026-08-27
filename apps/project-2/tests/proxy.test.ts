import assert from "node:assert/strict";
import { test } from "node:test";
import proxy from "../api/proxy.ts";

test("forwards nested paths and repeated query parameters to the fixed shop origin", async (t) => {
  t.mock.method(globalThis, "fetch", async (url: URL, init: RequestInit) => {
    assert.equal(url.origin, "http://shop-api.edu.koobietech.com");
    assert.equal(url.pathname, "/p/myOrder/myOrder");
    assert.deepEqual(url.searchParams.getAll("status"), ["1", "2"]);
    assert.equal(url.searchParams.get("q"), "手机 & 配件");
    assert.equal(url.searchParams.has("__path"), false);
    assert.equal(init.method, "GET");
    assert.equal(init.body, undefined);
    assert.equal(init.redirect, "error");
    return Response.json({ success: true, data: [] });
  });
  const response = await proxy.fetch(
    new Request(
      "https://shop.example/api/proxy?__path=p/myOrder/myOrder&status=1&status=2&q=手机%20%26%20配件",
    ),
  );
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true, data: [] });
});

for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
  test(`${method} preserves the raw body and business auth without forwarding platform credentials`, async (t) => {
    const body = '{"basketIds":[1,2],"name":"手机"}';
    t.mock.method(globalThis, "fetch", async (_url: URL, init: RequestInit) => {
      assert.equal(init.method, method);
      assert.equal(new TextDecoder().decode(init.body as ArrayBuffer), body);
      const headers = new Headers(init.headers);
      assert.equal(headers.get("authorization"), "test-business-token");
      assert.equal(headers.get("content-type"), "application/json");
      assert.equal(headers.get("cookie"), null);
      assert.equal(headers.get("x-vercel-protection-bypass"), null);
      assert.equal(headers.get("host"), null);
      return new Response(null, { status: 204 });
    });
    const response = await proxy.fetch(
      new Request(
        "https://shop.example/api/proxy?__path=p/shopCart/changeItem",
        {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: "test-business-token",
            Cookie: "platform-session=must-not-forward",
            "X-Vercel-Protection-Bypass": "must-not-forward",
          },
          body,
        },
      ),
    );
    assert.equal(response.status, 204);
    assert.equal(await response.text(), "");
  });
}

test("keeps upstream error status and bytes but prevents caching and stale compression headers", async (t) => {
  const bytes = Uint8Array.from([0, 1, 128, 255]);
  t.mock.method(
    globalThis,
    "fetch",
    async () =>
      new Response(bytes, {
        status: 401,
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Encoding": "gzip",
          "Content-Length": "999",
          "Cache-Control": "public, max-age=3600",
          "Set-Cookie": "upstream-session=private",
        },
      }),
  );
  const response = await proxy.fetch(
    new Request("https://shop.example/api/proxy?__path=p/user/userInfo"),
  );
  assert.equal(response.status, 401);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(
    response.headers.get("content-type"),
    "application/octet-stream",
  );
  assert.equal(response.headers.get("content-encoding"), null);
  assert.equal(response.headers.get("content-length"), null);
  assert.equal(response.headers.get("set-cookie"), null);
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()), bytes);
});

test("HEAD has no body", async (t) => {
  t.mock.method(globalThis, "fetch", async (_url: URL, init: RequestInit) => {
    assert.equal(init.method, "HEAD");
    assert.equal(init.body, undefined);
    return new Response(null);
  });
  const response = await proxy.fetch(
    new Request("https://shop.example/api/proxy?__path=indexImgs", {
      method: "HEAD",
    }),
  );
  assert.equal(await response.text(), "");
});

test("rejects malformed or ambiguous paths before making any upstream call", async (t) => {
  const fetch = t.mock.method(globalThis, "fetch", async () => {
    throw new Error("must not fetch");
  });
  for (const query of [
    "",
    "__path=",
    "__path=one&__path=two",
    "__path=//evil.example",
    "__path=https://evil.example",
    "__path=../admin",
    "__path=one/../admin",
    "__path=one%5Cadmin",
  ]) {
    const response = await proxy.fetch(
      new Request(`https://shop.example/api/proxy?${query}`),
    );
    assert.equal(response.status, 400, query);
  }
  assert.equal(fetch.mock.callCount(), 0);
});

test("rejects unsupported methods without forwarding", async (t) => {
  const fetch = t.mock.method(globalThis, "fetch", async () => {
    throw new Error("must not fetch");
  });
  const response = await proxy.fetch(
    new Request("https://shop.example/api/proxy?__path=indexImgs", {
      method: "BREW",
    }),
  );
  assert.equal(response.status, 405);
  assert.match(response.headers.get("allow") ?? "", /GET/);
  assert.equal(fetch.mock.callCount(), 0);
});

for (const [name, status] of [
  ["TimeoutError", 504],
  ["TypeError", 502],
] as const) {
  test(`${name} becomes ${status} without exposing upstream error details`, async (t) => {
    t.mock.method(globalThis, "fetch", async () => {
      const error = new Error("sensitive upstream details");
      error.name = name;
      throw error;
    });
    const response = await proxy.fetch(
      new Request("https://shop.example/api/proxy?__path=indexImgs"),
    );
    assert.equal(response.status, status);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.doesNotMatch(await response.text(), /sensitive upstream details/);
  });
}
