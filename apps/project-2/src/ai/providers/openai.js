// 通用 OpenAI 兼容 Provider — 支持任何 OpenAI 格式的 API
// 配置方式（浏览器控制台，立即生效）：
//   localStorage.setItem('ai_api_key',  'sk-xxx')
//   localStorage.setItem('ai_api_base', 'https://api.deepseek.com/v1')
//   localStorage.setItem('ai_api_model','deepseek-chat')
//
// 国内推荐：
//   DeepSeek:    base=https://api.deepseek.com/v1       model=deepseek-chat     (便宜)
//   硅基流动:    base=https://api.siliconflow.cn/v1     model=Qwen/Qwen3-8B     (免费额度)
//   Ollama本地:  base=http://localhost:11434/v1          model=qwen3:latest      (完全免费)

function getConfig() {
  try {
    return {
      key:
        localStorage.getItem("ai_api_key") ||
        import.meta.env.VITE_AI_API_KEY ||
        "",
      base:
        localStorage.getItem("ai_api_base") ||
        import.meta.env.VITE_AI_API_BASE ||
        "https://api.deepseek.com/v1",
      model:
        localStorage.getItem("ai_api_model") ||
        import.meta.env.VITE_AI_API_MODEL ||
        "deepseek-chat",
    };
  } catch {
    return { key: "", base: "", model: "" };
  }
}

export async function isAvailable() {
  const { key, base } = getConfig();
  return !!(key && base);
}

/**
 * 调用 OpenAI 兼容 API
 * @param {string} promptText
 * @returns {Promise<{text: string|null, error?: string}>}
 */
export async function generate(promptText) {
  const { key, base, model } = getConfig();
  if (!key || !base) {
    return {
      text: null,
      error: '未配置，控制台执行: localStorage.setItem("ai_api_key","sk-xxx")',
    };
  }

  // 去掉末尾斜杠
  const baseUrl = base.replace(/\/+$/, "");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const resp = await fetch(`${baseUrl}/chat/completions`, {
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
            content: "你是一个电商卖点文案专家。直接输出结果，不要额外解释。",
          },
          { role: "user", content: promptText },
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!resp.ok) {
      const errText = await resp.text();
      let errMsg = `HTTP ${resp.status}`;
      if (resp.status === 401) errMsg += " — API Key 无效";
      else if (resp.status === 403) errMsg += " — 无权访问，检查 Key 或余额";
      else if (resp.status === 429) errMsg += " — 请求太频繁";
      else errMsg += ` — ${errText.substring(0, 100)}`;

      console.warn(`[OpenAI] ${errMsg}`);
      return { text: null, error: errMsg };
    }

    const json = await resp.json();
    const text = json.choices?.[0]?.message?.content;
    if (text && text.trim()) {
      console.log("[OpenAI] ✅ API 调用成功");
      return { text: text.trim(), error: null };
    }

    return { text: null, error: "响应为空" };
  } catch (e) {
    let errMsg;
    if (e.name === "AbortError") {
      errMsg = "请求超时（15s）";
    } else if (
      e.message.includes("Failed to fetch") ||
      e.message.includes("NetworkError")
    ) {
      errMsg = `网络不通 — 检查 API 地址: ${baseUrl}`;
    } else {
      errMsg = e.message;
    }

    console.warn(`[OpenAI] ${errMsg}`);
    return { text: null, error: errMsg };
  }
}
