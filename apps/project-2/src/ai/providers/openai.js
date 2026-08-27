// The shared provider configuration and key exist only in api/ai.ts.
/**
 * @param {string} prompt
 * @param {string} [model] Must match the server-configured model, if supplied.
 * @returns {Promise<{text: string|null, error: string|null}>}
 */
export async function generate(prompt, model) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const resp = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, model }),
      signal: controller.signal,
    });
    if (!resp.ok) {
      const messages = {
        400: "请求内容无效或过长",
        401: "AI 服务认证失败",
        403: "AI 服务无权访问",
        429: "请求太频繁，请稍后再试",
        503: "AI 服务未配置或暂不可用",
        504: "AI 服务响应超时",
      };
      const message =
        messages[resp.status] ||
        (resp.status >= 500 ? "AI 服务暂不可用" : "AI 请求失败");
      return { text: null, error: `HTTP ${resp.status} — ${message}` };
    }
    const json = await resp.json();
    if (typeof json?.text === "string" && json.text.trim()) {
      return { text: json.text.trim(), error: null };
    }
    return { text: null, error: "响应为空" };
  } catch (error) {
    const message =
      controller.signal.aborted || error?.name === "AbortError"
        ? "请求超时（15s）"
        : error instanceof TypeError
          ? "网络不通，请稍后重试"
          : "AI 响应异常";
    return { text: null, error: message };
  } finally {
    // Keep the timeout active through body decoding; clear it on every exit path.
    clearTimeout(timeout);
  }
}
