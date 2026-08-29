const UPSTREAM_ORIGIN = "http://116.62.230.90";
const UPSTREAM_TIMEOUT_MS = 8_000;
const ALLOWED_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);

type HeaderValue = string | string[] | undefined;
type QueryValue = string | string[] | undefined;

export interface ApiProxyRequest {
  method?: string;
  query: Record<string, QueryValue>;
  headers: Record<string, HeaderValue>;
  body?: unknown;
}

export interface ApiProxyResponse {
  setHeader(name: string, value: string): void;
  status(code: number): ApiProxyResponse;
  send(body: unknown): ApiProxyResponse;
}

export type ApiProxyFetch = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

function sendJson(
  response: ApiProxyResponse,
  status: number,
  body: Record<string, unknown>,
): void {
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.status(status).send(JSON.stringify(body));
}

function readHeader(
  headers: ApiProxyRequest["headers"],
  name: string,
): string | undefined {
  const value = headers[name];
  return Array.isArray(value) ? value[0] : value;
}

function getUpstreamUrl(query: ApiProxyRequest["query"]): URL | null {
  const rawPath = query.path;
  const pathParts = (Array.isArray(rawPath) ? rawPath : [rawPath])
    .filter((part): part is string => typeof part === "string")
    .flatMap((part) => part.split("/"))
    .filter(Boolean);

  if (
    pathParts.length === 0 ||
    pathParts.some((part) => {
      const decoded = decodeURIComponent(part);
      return decoded === "." || decoded === "..";
    })
  ) {
    return null;
  }

  const url = new URL(
    `/api/${pathParts.map((part) => encodeURIComponent(decodeURIComponent(part))).join("/")}`,
    UPSTREAM_ORIGIN,
  );

  Object.entries(query).forEach(([name, value]) => {
    if (name === "path" || value === undefined) return;

    const values = Array.isArray(value) ? value : [value];
    values.forEach((item) => url.searchParams.append(name, item));
  });

  return url;
}

function getRequestBody(
  method: string,
  request: ApiProxyRequest,
): RequestInit["body"] {
  if (method === "GET" || request.body === undefined) return undefined;

  return typeof request.body === "string"
    ? request.body
    : JSON.stringify(request.body);
}

export async function handleApiProxy(
  request: ApiProxyRequest,
  response: ApiProxyResponse,
  fetchImpl: ApiProxyFetch = fetch,
): Promise<void> {
  response.setHeader("cache-control", "no-store");
  response.setHeader("x-content-type-options", "nosniff");

  const method = request.method?.toUpperCase() ?? "GET";
  if (!ALLOWED_METHODS.has(method)) {
    response.setHeader("allow", [...ALLOWED_METHODS].join(", "));
    sendJson(response, 405, { code: 405, message: "请求方法不受支持" });
    return;
  }

  let upstreamUrl: URL | null;
  try {
    upstreamUrl = getUpstreamUrl(request.query);
  } catch {
    upstreamUrl = null;
  }

  if (!upstreamUrl) {
    sendJson(response, 400, { code: 400, message: "API 路径无效" });
    return;
  }

  const headers = new Headers();
  const accept = readHeader(request.headers, "accept");
  const contentType = readHeader(request.headers, "content-type");
  const authorization = readHeader(request.headers, "authorization");

  headers.set("accept", accept ?? "application/json");
  if (contentType) headers.set("content-type", contentType);
  if (authorization) headers.set("authorization", authorization);

  try {
    const upstreamResponse = await fetchImpl(upstreamUrl, {
      method,
      headers,
      body: getRequestBody(method, request),
      redirect: "manual",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    const responseContentType = upstreamResponse.headers.get("content-type");
    if (responseContentType)
      response.setHeader("content-type", responseContentType);

    response
      .status(upstreamResponse.status)
      .send(await upstreamResponse.text());
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      sendJson(response, 504, { code: 504, message: "上游服务响应超时" });
      return;
    }

    console.error("[project-1-api-proxy] upstream request failed", error);
    sendJson(response, 502, { code: 502, message: "上游服务暂时不可用" });
  }
}

export default async function handler(
  request: ApiProxyRequest,
  response: ApiProxyResponse,
): Promise<void> {
  await handleApiProxy(request, response);
}
