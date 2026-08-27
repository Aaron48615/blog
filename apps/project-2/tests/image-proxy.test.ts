import assert from "node:assert/strict";
import { test } from "node:test";
import image from "../api/image.ts";

const request = (query = "__path=2019/04/banner.jpg", init?: RequestInit) =>
  new Request(`https://shop.example/api/image?${query}`, init);

test("proxies raster bytes from the fixed host without forwarding credentials or query strings", async (t) => {
  const bytes = Uint8Array.from([255, 216, 255, 0]);
  t.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    assert.equal(
      url,
      "http://shop-static.edu.koobietech.com/2019/04/banner.jpg",
    );
    assert.equal(init.headers, undefined);
    assert.equal(init.redirect, "error");
    return new Response(bytes, {
      headers: {
        "Content-Type": "image/jpeg",
        "Set-Cookie": "no",
        "Content-Encoding": "gzip",
      },
    });
  });
  const response = await image.fetch(
    request("__path=2019/04/banner.jpg&token=not-forwarded", {
      headers: {
        Cookie: "private",
        Authorization: "private",
        "X-Vercel-Protection-Bypass": "private",
      },
    }),
  );
  assert.equal(response.status, 200);
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()), bytes);
  assert.equal(response.headers.get("content-type"), "image/jpeg");
  assert.equal(response.headers.get("set-cookie"), null);
  assert.equal(response.headers.get("content-encoding"), null);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.match(response.headers.get("content-security-policy")!, /sandbox/);
  assert.match(response.headers.get("cache-control")!, /s-maxage=86400/);
});

test("rejects arbitrary URLs, traversal, encoded paths and active content before fetching", async (t) => {
  const fetch = t.mock.method(globalThis, "fetch", async () => {
    throw new Error("must not fetch");
  });
  for (const path of [
    "",
    "https://evil.example/a.jpg",
    "//evil.example/a.jpg",
    "../a.jpg",
    "a/../b.jpg",
    "%2e%2e/a.jpg",
    "a\\b.jpg",
    "a.svg",
    "a.html",
    "a.jpg?url=evil",
  ]) {
    assert.equal(
      (await image.fetch(request(`__path=${encodeURIComponent(path)}`))).status,
      400,
      path,
    );
  }
  assert.equal(
    (await image.fetch(request("__path=a.jpg&__path=b.jpg"))).status,
    400,
  );
  assert.equal(fetch.mock.callCount(), 0);
});

test("only GET and HEAD are allowed and HEAD has no body", async (t) => {
  assert.equal(
    (await image.fetch(request(undefined, { method: "POST" }))).status,
    405,
  );
  t.mock.method(
    globalThis,
    "fetch",
    async (_url: string, init: RequestInit) => {
      assert.equal(init.method, "HEAD");
      return new Response(null, { headers: { "Content-Type": "image/png" } });
    },
  );
  const response = await image.fetch(request(undefined, { method: "HEAD" }));
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "");
});

for (const type of ["text/html", "image/svg+xml"]) {
  test(`rejects unexpected ${type} from the fixed upstream`, async (t) => {
    t.mock.method(
      globalThis,
      "fetch",
      async () =>
        new Response("active content", { headers: { "Content-Type": type } }),
    );
    const response = await image.fetch(request());
    assert.equal(response.status, 502);
    assert.equal(await response.text(), "");
    assert.equal(response.headers.get("cache-control"), "no-store");
  });
}

for (const withLength of [false, true]) {
  test(`rejects responses above 4 MiB (Content-Length: ${withLength})`, async (t) => {
    t.mock.method(
      globalThis,
      "fetch",
      async () =>
        new Response(new Uint8Array(4 * 1024 * 1024 + 1), {
          headers: {
            "Content-Type": "image/jpeg",
            ...(withLength ? { "Content-Length": "4194305" } : {}),
          },
        }),
    );
    assert.equal((await image.fetch(request())).status, 413);
  });
}

test("upstream errors and redirects are not exposed as successful images", async (t) => {
  for (const status of [404, 302, 500]) {
    const mock = t.mock.method(
      globalThis,
      "fetch",
      async () => new Response("upstream details", { status }),
    );
    const response = await image.fetch(request());
    assert.equal(response.status, status === 404 ? 404 : 502);
    assert.equal(await response.text(), "");
    mock.mock.restore();
  }
});

for (const [name, status] of [
  ["TimeoutError", 504],
  ["TypeError", 502],
] as const) {
  test(`${name} returns ${status}`, async (t) => {
    t.mock.method(globalThis, "fetch", async () => {
      throw Object.assign(new Error("private"), { name });
    });
    const response = await image.fetch(request());
    assert.equal(response.status, status);
    assert.equal(await response.text(), "");
  });
}
