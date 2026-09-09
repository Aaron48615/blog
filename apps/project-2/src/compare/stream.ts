// 按空行解析 SSE 事件；网络块与事件边界互不等价。
export async function* readSSE(
  body: ReadableStream<Uint8Array>,
  signal?: AbortSignal,
): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let pending = "";
  let data: string[] = [];
  const abort = () => {
    void reader.cancel().catch(() => {});
  };
  signal?.addEventListener("abort", abort, { once: true });
  try {
    while (true) {
      if (signal?.aborted) throw new DOMException("已取消", "AbortError");
      const { done, value } = await reader.read();
      pending += done
        ? decoder.decode()
        : decoder.decode(value, { stream: true });
      let pos: number;
      while ((pos = pending.indexOf("\n")) >= 0) {
        const line = pending.slice(0, pos).replace(/\r$/, "");
        pending = pending.slice(pos + 1);
        if (!line) {
          if (data.length) {
            yield data.join("\n");
            data = [];
          }
        } else if (line.startsWith("data:"))
          data.push(line.slice(5).replace(/^ /, ""));
      }
      if (done) {
        if (pending || data.length) throw new Error("连接提前结束，事件不完整");
        break;
      }
    }
  } finally {
    signal?.removeEventListener("abort", abort);
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
export class RequestGeneration {
  private version = 0;
  next() {
    return ++this.version;
  }
  current(id: number) {
    return this.version === id;
  }
}
