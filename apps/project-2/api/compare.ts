import { streamAdvice, validateInput } from "../server/compare.ts";
import { isIP } from "node:net";

const MAX_BODY_BYTES = 16 * 1024;
const MAX_TRACKED_IPS = 10_000;
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

function failure(status: number, error: string) {
  return Response.json(
    { text: null, error },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

function limit(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

async function readBody(request: Request): Promise<unknown> {
  if (Number(request.headers.get("content-length")) > MAX_BODY_BYTES) {
    throw new Error("Body too large");
  }
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Missing body");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new Error("Body too large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

// Each warm Vercel instance owns its own counters. This is not a global quota.
export function createCompareProxy(
  fetcher: typeof fetch = fetch,
  timeout = 55_000,
) {
  const requests = new Map<string, number[]>();

  function rateLimit(ip: string, minuteLimit: number, hourLimit: number) {
    const now = Date.now();
    const timestamps = (requests.get(ip) ?? []).filter((at) => at > now - HOUR);
    const recent = timestamps.filter((at) => at > now - MINUTE);
    const waits = [];
    if (recent.length >= minuteLimit) {
      waits.push(recent[recent.length - minuteLimit]! + MINUTE - now);
    }
    if (timestamps.length >= hourLimit) {
      waits.push(timestamps[timestamps.length - hourLimit]! + HOUR - now);
    }
    if (waits.length) return Math.ceil(Math.max(...waits) / 1000);

    if (!requests.has(ip) && requests.size >= MAX_TRACKED_IPS) {
      for (const [key, times] of requests) {
        if (times[times.length - 1]! <= now - HOUR) requests.delete(key);
      }
      // Never evict active counters: deny new identities when the table is full.
      if (requests.size >= MAX_TRACKED_IPS) return 60;
    }
    timestamps.push(now);
    requests.set(ip, timestamps);
    return 0;
  }

  return {
    async fetch(request: Request): Promise<Response> {
      if (request.method !== "POST") {
        const response = failure(405, "Method not allowed");
        response.headers.set("Allow", "POST");
        return response;
      }
      // JSON-only + same-origin browser requests; this is not authentication.
      const origin = request.headers.get("origin");
      if (
        request.headers.get("sec-fetch-site") === "cross-site" ||
        (origin !== null && origin !== new URL(request.url).origin)
      ) {
        return failure(403, "Cross-origin requests are not allowed");
      }
      if (
        request.headers
          .get("content-type")
          ?.split(";")[0]
          ?.trim()
          .toLowerCase() !== "application/json"
      ) {
        return failure(415, "Expected application/json");
      }

      // Trust only Vercel's overwritten forwarding header, never X-Real-IP.
      // Missing/malformed identities share one bucket instead of bypassing limits.
      const forwarded = request.headers
        .get("x-forwarded-for")
        ?.split(",")[0]
        ?.trim();
      const ip =
        forwarded && !forwarded.includes("%") && isIP(forwarded)
          ? isIP(forwarded) === 6
            ? new URL(`http://[${forwarded}]`).hostname
            : forwarded
          : "unknown";
      const retryAfter = rateLimit(
        ip,
        limit(process.env.AI_RATE_LIMIT_PER_MINUTE, 10),
        limit(process.env.AI_RATE_LIMIT_PER_HOUR, 50),
      );
      if (retryAfter) {
        const response = failure(429, "Too many AI requests");
        response.headers.set("Retry-After", String(retryAfter));
        return response;
      }

      let body;
      try {
        body = await readBody(request);
      } catch {
        return failure(400, "Invalid JSON or request body exceeds 16 KiB");
      }
      const input = validateInput(body);
      if (!input)
        return failure(
          400,
          "请选择两件有效商品与规格；需求最多500字，规格偏好最多30字，预算须为正数",
        );
      const key = process.env.DEEPSEEK_API_KEY?.trim();
      if (!key) return failure(503, "AI 服务尚未配置，仍可查看客观对比");
      let target: URL;
      try {
        const base =
          process.env.DEEPSEEK_API_BASE?.trim() ||
          "https://api.deepseek.com/v1";
        target = new URL(`${base.replace(/\/+$/, "")}/chat/completions`);
        if (
          target.protocol !== "https:" ||
          target.username ||
          target.password ||
          target.search ||
          target.hash
        )
          throw new Error();
      } catch {
        return failure(503, "AI 服务配置无效");
      }
      return streamAdvice(
        request,
        input,
        {
          key,
          target,
          model: process.env.DEEPSEEK_API_MODEL?.trim() || "deepseek-v4-flash",
          timeout,
        },
        fetcher,
      );
    },
  };
}
export default createCompareProxy();
