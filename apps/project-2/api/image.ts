const ORIGIN = "http://shop-static.edu.koobietech.com";
const MAX_BYTES = 4 * 1024 * 1024;
const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
  "image/bmp",
  "image/x-icon",
  "image/vnd.microsoft.icon",
]);

function failure(status: number) {
  return new Response(null, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export default {
  async fetch(request: Request): Promise<Response> {
    if (!["GET", "HEAD"].includes(request.method)) {
      const response = failure(405);
      response.headers.set("Allow", "GET, HEAD");
      return response;
    }
    const query = new URL(request.url).searchParams;
    const paths = query.getAll("__path");
    const path = paths[0];
    // Restrict to raster image paths; no arbitrary hosts, ports, traversal or SVG/HTML.
    if (
      paths.length !== 1 ||
      !path ||
      !/^(?:[a-z\d_-]+\/)*[a-z\d_-]+\.(?:jpe?g|png|gif|webp|avif|bmp|ico)$/i.test(
        path,
      )
    ) {
      return failure(400);
    }
    try {
      const upstream = await fetch(`${ORIGIN}/${path}`, {
        method: request.method,
        // Do not forward Cookie, Authorization, query strings or platform headers.
        redirect: "error",
        signal: AbortSignal.any([request.signal, AbortSignal.timeout(15_000)]),
      });
      if (!upstream.ok) {
        await upstream.body?.cancel();
        return failure(upstream.status === 404 ? 404 : 502);
      }
      const contentType = upstream.headers
        .get("content-type")
        ?.split(";")[0]
        ?.trim()
        .toLowerCase();
      if (!contentType || !IMAGE_TYPES.has(contentType)) {
        await upstream.body?.cancel();
        return failure(502);
      }
      if (Number(upstream.headers.get("content-length")) > MAX_BYTES) {
        await upstream.body?.cancel();
        return failure(413);
      }
      // Bound streamed responses too, even if the upstream omits Content-Length.
      const chunks: Uint8Array[] = [];
      let size = 0;
      if (request.method !== "HEAD" && upstream.body) {
        const reader = upstream.body.getReader();
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > MAX_BYTES) {
            await reader.cancel();
            return failure(413);
          }
          chunks.push(value);
        }
      }
      if (request.method !== "HEAD" && size === 0) return failure(502);
      const body = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) {
        body.set(chunk, offset);
        offset += chunk.byteLength;
      }
      return new Response(request.method === "HEAD" ? null : body, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=3600, s-maxage=86400",
          "X-Content-Type-Options": "nosniff",
          "Content-Security-Policy": "default-src 'none'; sandbox",
        },
      });
    } catch (error) {
      return failure(
        error instanceof Error && error.name === "TimeoutError" ? 504 : 502,
      );
    }
  },
};
