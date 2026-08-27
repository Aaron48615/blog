# 拾光集 · Mobile Shop

Vue 3 + TypeScript + Vite + Vant 移动端商城，迁自 `mobile-shop`。
本目录属于根仓库的 pnpm workspace，包名为 `@personal/project-2`。

## 本地运行

在仓库根目录执行（Node.js `^22.18.0 || >=24.12.0`）：

```sh
pnpm install
pnpm --filter project-2 dev
pnpm --filter project-2 build
pnpm --filter project-2 test
pnpm --filter project-2 preview
```

`build` 包含 `vue-tsc --build` 类型检查和 Vite 静态构建；产物位于本目录的 `dist/`，不提交到 Git。依赖统一记录在根目录 `pnpm-lock.yaml`。

迁移保留严格类型检查，启用 `allowJs` 以兼容现有 JS API/AI 模块，并补充视图状态类型、必要空值保护和 `postcss-pxtorem` 类型声明。API 的响应外层已有类型，旧 JS 接口的 payload 仍沿用未细化的类型，不代表已完成接口校验。原有 `::v-deep` 写法产生非阻断弃用警告，视觉调整留待后续。

## 配置与迁移边界

- axios 固定使用同源 `/api`；`.env.development` 和 `.env.example` 的 `VITE_APP_URL=/api` 用于标明部署约定，不能通过它绕过代理改为外部地址。
- 未迁入原 `.env.local`、真实 AI key、`node_modules/`、`dist/`、npm 锁文件、Vue 备份、系统文件、浏览器调试记录及学习笔记；原项目文件保持不变。
- 未使用的 `amfe-flexible` 依赖已移除，继续使用原有 `src/utils/rem.ts`，不改变移动端布局逻辑。
- AI 仅调用同源 `/api/ai`，不再读取任何 `localStorage.ai_*` 或 `VITE_AI_*` 配置，也不构造客户端 Authorization。旧浏览器设置不再生效，可手动清除；共享密钥只配置为服务端 `DEEPSEEK_API_KEY`，禁止使用 `VITE_` 前缀。Vite 仅暴露 `VITE_APP_URL`。
- 原登录 AES 常量随协议实现保留，浏览器端常量不能视为保密措施；本次不改登录协议。

## Vercel 部署

- 项目 Root Directory 为 `apps/project-2`，使用 Vite，构建命令 `pnpm build`，输出 `dist`。
- `vercel.json` 首先将 `/api/ai` 路由至 `api/ai.ts`，之后才将商城 `/api/*` 转到 `api/proxy.ts`，通过保留参数 `__path` 传入上游路径；其余前端路由回退到 `index.html`。
- 代理固定访问 `http://shop-api.edu.koobietech.com/*`，保留业务请求的方法、查询参数、请求体和 Authorization。`__path` 是内部路由参数，客户端业务查询不能使用它。
- 代理不转发 Cookie、Vercel 内部头或上游 Set-Cookie，不跟随重定向，响应统一 `no-store`；上游超时返回 504，其余连接错误返回 502。
- Vite 开发环境使用同目标的商城 `/api` 代理，但 `/api/ai` 明确返回 404 并触发本地兜底，绝不把 AI 提示词发到商城后端。`vite dev` / `vite preview` 不运行 AI Serverless；线上行为以 Vercel 预览部署验收为准。
- 旧图片域名 `shop-static.edu.koobietech.com` 的 HTTPS 证书不匹配。axios 响应统一把该域名的图片地址（含商品 HTML、图片数组/逗号串）转换为 `/shop-images/*`，由 `api/image.ts` 向固定 HTTP 来源读取。只支持 GET/HEAD、常见光栅图片、4 MiB 上限，不接受任意 URL、SVG/HTML，不跟随重定向，不转发 Cookie/Authorization/查询参数；仅成功图片可缓存。缓存及流量会占用 Vercel 额度，来源链路仍为 HTTP，长期应由上游修复 HTTPS。
- 首页三个接口独立结算；某一区域失败时保留其他成功数据，显示失败区域及重试入口，不将接口异常伪装成正常空列表。
- 浏览器到 Vercel 为 HTTPS，但 Vercel 到旧商城仍为 HTTP。认证 token 和业务请求在这段链路上不受 TLS 保护；后端 HTTPS 升级属于后续事项。
- 验收至少覆盖 `/`、`/cart`、`/myorder` 和 `/api/indexImgs`；读取接口成功不代表登录、支付、订单等写入操作已联调。

参考：[Vercel Node.js Functions](https://vercel.com/docs/functions/runtimes/node-js)、[Vercel 路由配置](https://vercel.com/docs/project-configuration/vercel-json)、[Vite 环境变量安全说明](https://vite.dev/guide/env-and-mode)。

## 共享 AI 代理

仅接受 `POST /api/ai`，请求头 `Content-Type: application/json`，请求体为 `{ "prompt": "推荐运动鞋", "model": "deepseek-v4-flash" }`。`model` 可省略；提供时必须与服务端配置一致，客户端不能选择其他付费模型。成功响应 `{ "text": "生成的文案", "error": null }`；失败为 `{ "text": null, "error": "简洁错误" }` 并附对应 HTTP 状态，所有响应 `Cache-Control: no-store`。

```js
const response = await fetch("/api/ai", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ prompt: "给运动鞋写四条卖点" }),
});
const { text, error } = await response.json();
```

页面继续使用 `getSearchSuggestion(keyWord)` / `getSellingPoint(product)`，返回 `{ result, source }`。成功保持 `source: "openai"`；未配置、超时、限流、上游失败或空响应时均为 `source: "fallback"`。搜索页原有 `localList` 和商品卖点规则保留；搜索函数本身也提供五条本地建议。

### 服务端环境变量

在 Vercel project-2 的 **Preview** 环境配置并重新部署，验收后再决定是否在 Production 启用。不要把真实 key 提交到仓库、贴到浏览器控制台或写成 `VITE_*`。设置服务端 key 不需要修改 `envPrefix`。

| 变量                       | 默认值 / 行为                                                                                          |
| -------------------------- | ------------------------------------------------------------------------------------------------------ |
| `DEEPSEEK_API_KEY`         | 必填；缺失时返回 503，页面本地兜底                                                                     |
| `DEEPSEEK_API_BASE`        | `https://api.deepseek.com/v1`；仅允许 HTTPS，不允许用户信息、query、fragment；追加 `/chat/completions` |
| `DEEPSEEK_API_MODEL`       | 按任务兼容要求保留 `deepseek-chat`；部署应显式设置当前支持的模型，见下文                               |
| `AI_RATE_LIMIT_PER_MINUTE` | 每 IP 滚动 60 秒 10 次                                                                                 |
| `AI_RATE_LIMIT_PER_HOUR`   | 每 IP 滚动 3600 秒 50 次                                                                               |

空的或非法限流值（非正整数）回退到默认值。`.env.example` 仅作配置模板；Vercel Function 不会自动加载该模板。

**模型名称提醒（2026-08-27 核对）：** DeepSeek [官方变更记录](https://api-docs.deepseek.com/updates/) 已公告旧名称 `deepseek-chat` / `deepseek-reasoner` 于 2026-07-24 停用。不能假设仅配 key 就可使用旧默认名；模板使用 `DEEPSEEK_API_MODEL=deepseek-v4-flash`，上线时仍须用实际账号验证。请求固定 `max_tokens: 300`、`temperature: 0.7`、电商卖点专家 system prompt，并按[当前接口](https://api-docs.deepseek.com/api/create-chat-completion/)显式设置 `thinking: { type: "disabled" }`，防止思考模式占用短文案输出预算。未用真实 key 验证模型可用性之前，不视为线上 AI 验收通过。

### 限流和防滥用边界

- 使用 Vercel 提供的 `x-forwarded-for` 首个 IP；IPv6 规范化，缺失/非法 IP 共用一个桶。此信任依赖 [Vercel 覆盖转发头](https://vercel.com/docs/headers/request-headers)，自托管或另加反向代理必须重新检查可信来源，不能直接信任用户自带的头。
- 两个滚动窗口同时执行，请求在异步操作前计数；输入错误和上游失败也消耗次数，429 附 `Retry-After`。最多保存 10,000 个 IP，容量满时拒绝新 IP，过期后释放，不驱逐仍有效的限流记录。
- **计数仅存在于单个热实例内存**。冷启动、重部署和多实例扩容会重置或分散计数；它不是全局配额，也不是账单硬上限。共享出口 IP 的用户共用配额；换 IP、IPv6 地址轮换、分布式请求仍可绕过。公开收费服务应另行接入持久化共享限流、用户认证或 Vercel Firewall，并设置供应商预算告警/额度，不要仅靠本实现控制费用。
- 拒绝跨站 Origin / `Sec-Fetch-Site: cross-site`，不开放 CORS，只收 JSON；这只阻挡普通浏览器跨站调用，不能阻挡伪造头的脚本，也不等于登录鉴权。当前是匿名共享服务。
- `prompt` 必须是非空字符串，原始长度不超过 2,000 个 JS UTF-16 单元；请求体含其他字段总计不超过 16 KiB（包括未声明 Content-Length 的流式请求）。超限/非法 JSON 返回 400，不转发客户端 messages、地址、token 参数。
- 上游只收到服务端生成的 Content-Type / Authorization，不转发 Cookie、业务 Authorization、Vercel 内部头；不跟随重定向，不回传上游错误正文或响应头。`DEEPSEEK_API_BASE` 是受信任的运维配置：改成第三方 HTTPS 地址会将 key 发给该服务，不要随意修改。
- 服务端上游超时为 12 秒，前端整体超时为 15 秒（包含响应体读取）；401/403/429/4xx/5xx 保持状态，连接失败或无效上游内容为 502，超时为 504。提示词会发给所配置的服务商，不应包含个人隐私；生成内容并非商品事实认证。

### AI 验收清单

1. `pnpm --filter project-2 test`、`pnpm --filter project-2 build`；测试覆盖请求校验、两级窗口/并发、错误脱敏、前端超时及本地兜底。
2. 注入假 `DEEPSEEK_API_KEY` / 旧 `VITE_AI_API_KEY` 进行构建后，执行 `pnpm --filter project-2 check:ai-bundle`，检查产物不含注入值、服务端配置名称、旧浏览器 key 入口或常见 key 模式。
3. 未配置服务端 key 的 Vercel Preview：`POST /api/ai` 应为 503，搜索/商品页显示本地规则；`GET /api/ai` 应为 405，不能被商城代理或 SPA 吞掉。
4. 配置 key 和有效模型并重新部署：分别实际触发搜索建议和商品卖点，确认 200 文本及 AI 标记、Network 请求中没有客户端 Authorization；限流命中时确认 429 与本地兜底。
5. 保留 Deployment Protection；可通过已登录的浏览器访问。前端默认携带同源平台 Cookie 供 Vercel 验证，AI handler 不会向上游转发它们。不要为验收关闭保护或把真实 key 放进测试代码。

AI 当前验证记录（2026-08-27）：`f4bcf11` 的[预览部署](https://project-2-7gqyu3q0d-aaronsblog.vercel.app)已构建成功；线上 `GET /api/ai` 返回 405/`Allow: POST`，正常格式 POST 返回 503/`AI service is not configured`，二者均为 JSON 且 `no-store`，确认没有进入商城代理或 SPA。63 项测试、build、92 文件双假密钥产物检查通过；扫描器用故意注入的 key 模式和配置值验证能正确报错。尚未配置真实 key，未验证真实上游生成或浏览器页面效果，也未修改 Production 环境或部署保护。

### 当前验收记录（2026-08-27）

- `d1740b5` 已成功生成[预览部署](https://project-2-n17vpv11p-aaronsblog.vercel.app)。GitHub 的 Vercel deployment status 为 `success`。
- 原版 11 项代理测试、构建及假密钥产物检查通过。图片修复后共 25 项测试和构建通过；本地实际调用三个首页接口，并通过新图片代理逐一读取 15 张去重后的真实轮播图/商品图，均返回图片。
- 用户曾确认旧预览 `/api/indexImgs` 正常但页面缺图；已补充图片代理及首页分区错误处理。Codex 未关闭部署保护。
- `921a205` 的[图片修复预览](https://project-2-c0me2ahv2-aaronsblog.vercel.app) 已部署成功。在线 HTTP 检查三条 SPA 路由的应用 HTML、两个入口 JS、三个首页接口及 15 张真实 JPEG/PNG 图片均通过；假密钥注入后的 92 个产物文件未发现假密钥或常见真实 key 模式。用户随后复验反馈“现在能加载出来了”；这是用户的页面加载确认，不代表自动化浏览器验收或下单/支付等全部业务已验证。
- Dashboard Production 环境变量尚未修改，未上传真实 AI key；共享 AI 的安全替代范围待用户确认。
