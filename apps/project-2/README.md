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
- 共享 `VITE_AI_API_KEY` 已停止在前端读取，模板保留空字段作为弃用提示；Vite 仅暴露公开配置前缀。AI 未配置时继续使用本地兜底；用户自己的浏览器配置仍可用。**不得将真实共享密钥写进 Vercel 的 `VITE_AI_API_KEY`**，共享 AI 代理的服务端密钥、鉴权和限流另行确认。
- 原登录 AES 常量随协议实现保留，浏览器端常量不能视为保密措施；本次不改登录协议。

## Vercel 部署

- 项目 Root Directory 为 `apps/project-2`，使用 Vite，构建命令 `pnpm build`，输出 `dist`。
- `vercel.json` 先将 `/api/*` 转到 `api/proxy.ts`，通过保留参数 `__path` 传入上游路径；其余前端路由回退到 `index.html`。
- 代理固定访问 `http://shop-api.edu.koobietech.com/*`，保留业务请求的方法、查询参数、请求体和 Authorization。`__path` 是内部路由参数，客户端业务查询不能使用它。
- 代理不转发 Cookie、Vercel 内部头或上游 Set-Cookie，不跟随重定向，响应统一 `no-store`；上游超时返回 504，其余连接错误返回 502。
- Vite 开发环境使用同目标的 `/api` 代理；`vite preview` 仅用于静态产物预览，线上 Serverless 行为以 Vercel 预览部署验收为准。
- 旧图片域名 `shop-static.edu.koobietech.com` 的 HTTPS 证书不匹配。axios 响应统一把该域名的图片地址（含商品 HTML、图片数组/逗号串）转换为 `/shop-images/*`，由 `api/image.ts` 向固定 HTTP 来源读取。只支持 GET/HEAD、常见光栅图片、4 MiB 上限，不接受任意 URL、SVG/HTML，不跟随重定向，不转发 Cookie/Authorization/查询参数；仅成功图片可缓存。缓存及流量会占用 Vercel 额度，来源链路仍为 HTTP，长期应由上游修复 HTTPS。
- 首页三个接口独立结算；某一区域失败时保留其他成功数据，显示失败区域及重试入口，不将接口异常伪装成正常空列表。
- 浏览器到 Vercel 为 HTTPS，但 Vercel 到旧商城仍为 HTTP。认证 token 和业务请求在这段链路上不受 TLS 保护；后端 HTTPS 升级属于后续事项。
- 验收至少覆盖 `/`、`/cart`、`/myorder` 和 `/api/indexImgs`；读取接口成功不代表登录、支付、订单等写入操作已联调。

参考：[Vercel Node.js Functions](https://vercel.com/docs/functions/runtimes/node-js)、[Vercel 路由配置](https://vercel.com/docs/project-configuration/vercel-json)、[Vite 环境变量安全说明](https://vite.dev/guide/env-and-mode)。

### 当前验收记录（2026-08-27）

- `d1740b5` 已成功生成[预览部署](https://project-2-n17vpv11p-aaronsblog.vercel.app)。GitHub 的 Vercel deployment status 为 `success`。
- 原版 11 项代理测试、构建及假密钥产物检查通过。图片修复后共 25 项测试和构建通过；本地实际调用三个首页接口，并通过新图片代理逐一读取 15 张去重后的真实轮播图/商品图，均返回图片。
- 用户在已登录的内置浏览器确认旧预览 `/api/indexImgs` 正常，但页面缺图，尚不通过页面验收。修复后的新预览仍需检查首页、购物车、订单路由及图片；浏览器自动读取持续超时，不能用本地图片测试代替线上页面验收。未关闭部署保护。
- Dashboard Production 环境变量尚未修改，未上传真实 AI key；共享 AI 的安全替代范围待用户确认。
