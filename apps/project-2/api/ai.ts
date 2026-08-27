import { isIP } from "node:net";

const MAX_PROMPT_LENGTH = 2_000;
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
export function createAIProxy() {
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
      if (
        !body ||
        typeof body !== "object" ||
        Array.isArray(body) ||
        !("prompt" in body) ||
        typeof body.prompt !== "string" ||
        !body.prompt.trim() ||
        body.prompt.length > MAX_PROMPT_LENGTH
      ) {
        return failure(400, "prompt must contain 1–2000 characters");
      }

      const model = process.env.DEEPSEEK_API_MODEL?.trim() || "deepseek-chat";
      // Clients cannot select more expensive models using the shared account.
      if ("model" in body && body.model !== model) {
        return failure(400, "Unsupported model");
      }
      const key = process.env.DEEPSEEK_API_KEY?.trim();
      if (!key) return failure(503, "AI service is not configured");
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
        ) {
          throw new Error("Invalid base URL");
        }
      } catch {
        return failure(503, "AI service configuration is invalid");
      }

      try {
        const upstream = await fetch(target, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: "system",
                content:
                  "你是一个电商卖点文案专家。直接输出结果，不要额外解释。",
              },
              { role: "user", content: body.prompt.trim() },
            ],
            max_tokens: 300,
            temperature: 0.7,
            thinking: { type: "disabled" },
          }),
          redirect: "error",
          signal: AbortSignal.any([
            request.signal,
            AbortSignal.timeout(12_000),
          ]),
        });
        if (!upstream.ok) {
          await upstream.body?.cancel();
          const status =
            upstream.status >= 400 && upstream.status <= 599
              ? upstream.status
              : 502;
          const message =
            status === 401 || status === 403
              ? "AI upstream authorization failed"
              : status === 429
                ? "AI upstream rate limit exceeded"
                : "AI upstream unavailable";
          return failure(status, message);
        }
        const data = (await upstream.json()) as {
          choices?: { message?: { content?: unknown } }[];
        } | null;
        const text = data?.choices?.[0]?.message?.content;
        if (typeof text !== "string" || !text.trim()) {
          return failure(502, "AI upstream returned an empty response");
        }
        return Response.json(
          { text: text.trim().replaceAll(key, "[redacted]"), error: null },
          { headers: { "Cache-Control": "no-store" } },
        );
      } catch (error) {
        const timeout =
          error instanceof Error &&
          ["TimeoutError", "AbortError"].includes(error.name);
        return failure(
          timeout ? 504 : 502,
          timeout ? "AI upstream timeout" : "AI upstream unavailable",
        );
      }
    },
  };
}

export default createAIProxy();
