import assert from "node:assert/strict";
import test from "node:test";
import { handleApiProxy } from "../api/[...path].ts";

type TestResponse = {
  headers: Map<string, string>;
  statusCode: number;
  body: unknown;
  setHeader(name: string, value: string): void;
  status(code: number): TestResponse;
  send(body: unknown): TestResponse;
};

function createResponse(): TestResponse {
  return {
    headers: new Map(),
    statusCode: 200,
    body: undefined,
    setHeader(name, value) {
      this.headers.set(name.toLowerCase(), value);
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    send(body) {
      this.body = body;
      return this;
    },
  };
}

test("验证码请求由 Serverless handler 转发到固定上游", async () => {
  let receivedUrl = "";
  let receivedInit: RequestInit | undefined;
  const response = createResponse();

  await handleApiProxy(
    {
      method: "GET",
      query: { path: ["auth", "captcha"], refresh: "1" },
      headers: { accept: "application/json" },
    },
    response,
    async (input, init) => {
      receivedUrl = String(input);
      receivedInit = init;
      return new Response('{"code":200}', {
        status: 200,
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    },
  );

  assert.equal(receivedUrl, "http://116.62.230.90/api/auth/captcha?refresh=1");
  assert.equal(receivedInit?.method, "GET");
  assert.equal(response.statusCode, 200);
  assert.equal(
    response.headers.get("content-type"),
    "application/json; charset=utf-8",
  );
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.body, '{"code":200}');
});

test("登录请求保留原字段并以 JSON 转发", async () => {
  const loginBody = {
    username: "TestNA",
    password: "testna123",
    captchaId: "captcha-id",
    captchaCode: "AB12",
  };
  let receivedInit: RequestInit | undefined;
  const response = createResponse();

  await handleApiProxy(
    {
      method: "POST",
      query: { path: ["auth", "login"] },
      headers: { "content-type": "application/json" },
      body: loginBody,
    },
    response,
    async (_input, init) => {
      receivedInit = init;
      return new Response('{"code":200}', { status: 200 });
    },
  );

  assert.equal(receivedInit?.method, "POST");
  assert.equal(receivedInit?.body, JSON.stringify(loginBody));
  assert.equal(
    new Headers(receivedInit?.headers).get("content-type"),
    "application/json",
  );
});

test("业务请求仅转发必要的 Authorization，不转发 Cookie", async () => {
  let receivedHeaders = new Headers();
  const response = createResponse();

  await handleApiProxy(
    {
      method: "GET",
      query: { path: ["cities", "overview"] },
      headers: {
        authorization: "Bearer token",
        cookie: "vercel-auth=secret",
      },
    },
    response,
    async (_input, init) => {
      receivedHeaders = new Headers(init?.headers);
      return new Response("{}", { status: 200 });
    },
  );

  assert.equal(receivedHeaders.get("authorization"), "Bearer token");
  assert.equal(receivedHeaders.get("cookie"), null);
});

test("上游网络超时返回可识别的 504 JSON", async () => {
  const response = createResponse();

  await handleApiProxy(
    {
      method: "GET",
      query: { path: ["auth", "captcha"] },
      headers: {},
    },
    response,
    async () => {
      throw new DOMException("Timed out", "TimeoutError");
    },
  );

  assert.equal(response.statusCode, 504);
  assert.equal(
    response.headers.get("content-type"),
    "application/json; charset=utf-8",
  );
  assert.equal(
    response.body,
    JSON.stringify({ code: 504, message: "上游服务响应超时" }),
  );
});
