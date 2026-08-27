const UPSTREAM = "http://shop-api.edu.koobietech.com";
const METHODS = ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];

function failure(status: number, message: string) {
  return Response.json(
    { success: false, msg: message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export default {
  async fetch(request: Request): Promise<Response> {
    if (!METHODS.includes(request.method)) {
      const response = failure(405, "Method not allowed");
      response.headers.set("Allow", METHODS.join(", "));
      return response;
    }

    // vercel.json supplies this reserved parameter; never accept an upstream URL.
    const incoming = new URL(request.url);
    const paths = incoming.searchParams.getAll("__path");
    const path = paths[0];
    if (
      paths.length !== 1 ||
      !path ||
      path.startsWith("/") ||
      path.includes("\\") ||
      /^[a-z][a-z\d+.-]*:/i.test(path) ||
      path.split("/").some((segment) => segment === "." || segment === "..")
    ) {
      return failure(400, "Invalid API path");
    }

    incoming.searchParams.delete("__path");
    const target = new URL(UPSTREAM);
    target.pathname = `/${path}`;
    target.search = incoming.searchParams.toString();

    const headers = new Headers();
    // Do not leak deployment-protection cookies or Vercel internal headers.
    for (const name of [
      "accept",
      "content-type",
      "authorization",
      "x-requested-with",
      "x-custom-header",
    ]) {
      const value = request.headers.get(name);
      if (value !== null) headers.set(name, value);
    }

    try {
      const upstream = await fetch(target, {
        method: request.method,
        headers,
        body:
          request.method === "GET" || request.method === "HEAD"
            ? undefined
            : await request.arrayBuffer(),
        redirect: "error",
        signal: AbortSignal.any([request.signal, AbortSignal.timeout(15_000)]),
      });
      const responseHeaders = new Headers({ "Cache-Control": "no-store" });
      const contentType = upstream.headers.get("content-type");
      if (contentType) responseHeaders.set("Content-Type", contentType);
      // fetch decompresses responses; do not copy content-encoding/content-length.
      const body =
        request.method === "HEAD" || [204, 205, 304].includes(upstream.status)
          ? null
          : await upstream.arrayBuffer();
      return new Response(body, {
        status: upstream.status,
        headers: responseHeaders,
      });
    } catch (error) {
      const timeout = error instanceof Error && error.name === "TimeoutError";
      return failure(
        timeout ? 504 : 502,
        timeout ? "Upstream timeout" : "Upstream unavailable",
      );
    }
  },
};
