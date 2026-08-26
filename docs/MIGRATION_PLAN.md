# 旧项目迁移方案

> 来源：
>
> - project-1：`/Users/aaron/LoveCoding/21_React/高阶/data-pilot`（React 智慧城市数据平台）
> - project-2：`/Users/aaron/LoveCoding/20_Vue3/mobile-shop`（Vue3 移动端商城）
>
> 目标：迁入 `/Users/aaron/personal-hub` 的 pnpm workspace，分别位于 `apps/project-1`、`apps/project-2`，纯静态构建 + Vercel 部署。

---

## 1. 项目概览与技术栈

| 维度         | project-1（data-pilot）                       | project-2（mobile-shop）             |
| ------------ | --------------------------------------------- | ------------------------------------ |
| 框架         | React 19.2 + TypeScript 6.0                   | Vue 3.5 + TypeScript 6.0             |
| 构建工具     | Vite 8.2 + `@vitejs/plugin-react`             | Vite 8.0 + `@vitejs/plugin-vue`      |
| UI 组件库    | Ant Design 6.5 + `antd-style` 4.1             | Vant 4.10                            |
| 路由         | `react-router-dom` 7（`createBrowserRouter`） | `vue-router` 5（`createWebHistory`） |
| 状态管理     | Redux Toolkit 2.12 + `redux-persist`          | Pinia 3.0                            |
| HTTP         | axios 1.19                                    | axios 1.18                           |
| 图表/3D      | ECharts 6.1 + Three.js 0.185 + R3F            | 无                                   |
| 地图         | 高德 AMap JS API                              | 无                                   |
| AI 调用      | 浏览器 `fetch` SSE 到后端 `/api/ai/chat`      | 浏览器 `fetch` 到 OpenAI 兼容接口    |
| 测试         | Node 内置 test runner + tsx                   | 无                                   |
| 当前包管理器 | npm（`package-lock.json`）                    | npm（`package-lock.json`）           |

---

## 2. 依赖清单与说明

### 2.1 project-1 运行时依赖

| 包名                                                 | 版本                        | 用途                        |
| ---------------------------------------------------- | --------------------------- | --------------------------- |
| `react` / `react-dom`                                | ^19.2.8                     | 核心框架                    |
| `react-router-dom`                                   | ^7.18.2                     | SPA 路由                    |
| `@reduxjs/toolkit` / `react-redux` / `redux-persist` | ^2.12.0 / ^9.3.0 / ^6.0.0   | 状态管理与持久化            |
| `antd`                                               | ^6.5.4                      | UI 组件库                   |
| `antd-style`                                         | ^4.1.0                      | CSS-in-JS（当前仅少量使用） |
| `axios`                                              | ^1.19.0                     | HTTP 客户端                 |
| `echarts`                                            | ^6.1.0                      | 图表                        |
| `three` / `@react-three/fiber` / `@react-three/drei` | ^0.185.1 / ^9.7.0 / ^10.7.8 | 3D 场景                     |
| `@amap/amap-jsapi-loader`                            | ^1.0.1                      | 高德地图加载器              |

### 2.2 project-2 运行时依赖

| 包名                       | 版本               | 用途                                |
| -------------------------- | ------------------ | ----------------------------------- |
| `vue` / `vue-router`       | ^3.5.38 / ^5.1.0   | 核心框架与路由                      |
| `pinia`                    | ^3.0.4             | 状态管理                            |
| `vant` / `@vant/area-data` | ^4.10.0 / ^2.1.0   | 移动端 UI 组件                      |
| `axios`                    | ^1.18.1            | HTTP 客户端                         |
| `crypto-js`                | ^4.2.0             | 登录密码 AES 加密                   |
| `amfe-flexible`            | ^2.2.1             | 移动端 rem 适配（建议移除，见风险） |
| `postcss` / `sass`         | ^8.5.20 / ^1.101.0 | 样式处理                            |

### 2.3 共同开发依赖与注意事项

- `vite` ^8、`typescript` ~6.0 均为较新 major 版本，迁入 monorepo 后需统一留意 peer-dep 告警。
- 两个项目都使用 `@/*` 路径别名，迁入 `apps/project-1` / `apps/project-2` 后 `vite.config.ts` 的 `path.resolve(__dirname, 'src')` 仍正确，无需改动。
- `package-lock.json` 需删除，改由根目录 `pnpm install` 生成统一 `pnpm-lock.yaml`。
- 根目录 `pnpm-workspace.yaml` 已有 `allowBuilds: esbuild: true`；project-2 的 `sass`/`lightningcss` 等原生包若触发 `ERR_PNPM_IGNORED_BUILDS`，需补充到 `allowBuilds` 列表。

---

## 3. 第三方 API 与后端接口

### 3.1 project-1

- **代理目标（开发）**：`http://116.62.230.90`
- **实际业务 API**：`http://116.62.230.90/api/*`
- **API 文档服务**：`http://116.62.230.90:9999/`（不可作为业务 API rewrite 目标）
- **调用方式**：`axios.create({ baseURL: '/api' })`，开发时由 Vite `server.proxy` 转发。
- **主要接口域**：
  - `/auth/*`：登录、注册、验证码、刷新 Token
  - `/cities/*`：城市、环境、交通、事件、设施统计
  - `/dashboards/*`：看板 CRUD、克隆
  - `/charts/*`：图表 CRUD、查询、预览
  - `/datasources/*`：数据源、表、字段、查询
  - `/users/*`、`/roles/*`、`/permissions/*`：用户权限 RBAC
  - `/upload/avatar`：头像上传
  - `/export/cities`、`/export/events`：导出
  - `/ai/chat`：AI 对话 SSE（后端转发到 DeepSeek，浏览器不直接调 DeepSeek）
- **外部 SDK**：高德 AMap JS API（`webapi.amap.com`），需 `VITE_AMAP_KEY`。

### 3.2 project-2

- **主 API 基地址**：`http://shop-api.edu.koobietech.com/`
- **Swagger**：`http://shop-api.edu.koobietech.com/swagger-ui/index.html`
- **调用方式**：`src/utils/request.ts` 中的 axios 实例，请求拦截器注入 `Authorization: <token>`。
- **主要接口域**：
  - `/indexImgs`、`/shop/notice/noticeList`、`/prod/tagProdList`：首页
  - `/category/categoryInfo`、`/prod/pageProd`：分类商品
  - `/prod/prodInfo`、`/prodComm/prodCommData`：商品详情与评价
  - `/search/*`：搜索与热搜
  - `/p/shopCart/*`：购物车（需登录）
  - `/p/order/*`、`/p/myOrder/*`：下单、支付、订单
  - `/p/address/*`、`/p/area/listByPid`：收货地址与省市区
  - `/login`、`/user/register`：登录注册
  - `/p/user/userInfo`、`/p/user/collection/*`：我的
- **AI 接口**：独立的 OpenAI 兼容端点，默认 `https://api.deepseek.com/v1/chat/completions`，可被 `localStorage` 或环境变量覆盖。

### 3.3 部署层面的关键问题

- **两个项目的 `/api` 代理都是 Vite dev-server 功能，构建后失效**。Vercel 纯静态托管默认无法代理到外部 HTTP 后端。
- project-1 业务 API 为 `http://116.62.230.90/api/*`（HTTP）；生产环境采用 Vercel 服务端 rewrite，避免浏览器直接请求 HTTP 导致混合内容拦截。
- project-2 主后端为 `http://shop-api.edu.koobietech.com/`，同样存在混合内容与 CORS 风险。
- **必须在迁移前确定 API 路由方案**：
  - 方案 A：后端开启 HTTPS 与 CORS，生产环境直接调用真实域名。
  - 方案 B：在 Vercel 项目里配置 `vercel.json` rewrites（付费功能或受策略限制）。
  - 方案 C：在 `apps/project-1|2` 下新增 Vercel Serverless Function 做透传代理（与“纯静态”目标冲突，但最稳定）。

---

## 4. 环境变量需求

### 4.1 project-1

| 变量                        | 用途               | 备注                                                                        |
| --------------------------- | ------------------ | --------------------------------------------------------------------------- |
| `VITE_AMAP_KEY`             | 高德 JS API Key    | 会打入 bundle，客户端可见；原 `.env` 已含真实 key，需轮换                   |
| `VITE_AMAP_SECURITY_KEY`    | 高德安全密钥       | 构建时通过 custom Vite plugin 注入 `index.html`；需设为 Vercel 构建环境变量 |
| `VITE_API_BASE`（建议新增） | 生产环境后端基地址 | 当前代码里没有，若采用“直接调用后端”方案需新增                              |

### 4.2 project-2

| 变量                | 用途          | 备注                                                               |
| ------------------- | ------------- | ------------------------------------------------------------------ |
| `VITE_APP_URL`      | 主 API 基地址 | 当前 `.env.development` 中为 `http://shop-api.edu.koobietech.com/` |
| `VITE_AI_API_KEY`   | AI 提供者 key | 当前 `.env.local` 中有真实 key，必须清出仓库，改由 Vercel 注入     |
| `VITE_AI_API_BASE`  | AI 基地址     | 默认 `https://api.deepseek.com/v1`                                 |
| `VITE_AI_API_MODEL` | AI 模型名     | 默认 `deepseek-chat`                                               |

### 4.3 通用环境变量处理原则

- 所有 `VITE_` 前缀变量都会在构建时被打包到前端，**不适合放高敏感凭证**；仅用于客户端必然可见的配置。
- `.env.local`、`.env` 等含真实 key 的文件**不得迁入 monorepo**。
- 建议每个 app 保留 `.env.example` 作为模板，真实值在 Vercel dashboard 设置。

---

## 5. 迁移步骤

### 5.1 迁移前准备

1. **确认 API 部署方案**：与后端所有者确认 HTTPS / CORS / 是否允许 Vercel 域名调用，或决定采用 Vercel rewrites/Serverless Function。
2. **轮换已泄露密钥**：
   - project-1 的 AMap Key / Security Key（原 `.env` 已提交到 git）。
   - project-2 的 `VITE_AI_API_KEY`（原 `.env.local` 含真实 key）。
3. **清理源码垃圾**：
   - project-1：删除 `src/pages/AI.tsx.bak-20260818`、`src/store/slice/userSlice.ts`（死代码）、`.playwright-cli/`。
   - project-2：删除 `src/views/` 下所有 `*.vue.bak`、`.DS_Store`、已提交的 `dist/` 目录。
4. **修正小毛病**：
   - project-1：`pages/Login.tsx` 和 `pages/Register.tsx` 中 `import { authService } from '@/api/auth.js'` 改为 `.ts`。
   - project-2：建议移除 `amfe-flexible`，因为已有自定义 `utils/rem.ts`；`index.html` 的 `lang=""` 改为 `lang="zh-CN"`，`<title>` 改为项目真实名称。

### 5.2 物理迁入

1. 在 monorepo 创建 `apps/project-1` 与 `apps/project-2`。
2. 将源码、配置文件、`public/`、`index.html` 等复制到对应目录，排除：
   - `node_modules/`
   - `dist/`
   - `package-lock.json`
   - 含真实密钥的 `.env` / `.env.local`
3. 更新两个 app 的 `package.json`：
   - 删除 `package-lock.json` 相关残留。
   - 脚本无需大改，`npm run` 改为 `pnpm --filter project-1` 调用。
   - 可适当调整 `name` 字段为 `@personal/project-1` / `@personal/project-2`（与现有 `site` 命名风格一致）。
4. 从根目录执行 `pnpm install`，生成统一 `pnpm-lock.yaml`。

### 5.3 构建与路由配置

1. 为每个 app 新增 `vercel.json`：
   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   ```
   这是 SPA 路由回退所必需。
2. 根据第 3 节确定的 API 方案，配置生产环境 API 基地址：
   - 若直接调用后端：新增 `VITE_API_BASE` / `VITE_APP_URL` 环境变量，并在 axios 实例中使用 `import.meta.env`。
   - 若用 Vercel rewrite：在 `vercel.json` 中追加 `/api/:path*` → `http://116.62.230.90/api/:path*`；不要指向仅提供文档的 `:9999`。
3. 分别在 Vercel dashboard 为两个项目设置环境变量，并绑定 Root Directory 为 `apps/project-1`、`apps/project-2`。

### 5.4 验证

1. 本地验证：
   ```bash
   pnpm --filter project-1 build
   pnpm --filter project-1 preview
   pnpm --filter project-2 build
   pnpm --filter project-2 preview
   ```
2. project-1 额外跑测试：
   ```bash
   pnpm --filter project-1 test
   ```
3. 部署到 Vercel 预览环境，确认：
   - 首页可访问。
   - 直接访问 `/dashboards`、`/cart`、`/myorder` 等深层路由不 404。
   - 登录 / 数据列表等涉及后端接口的功能可正常调用。

---

## 6. 风险与建议

| 风险                                              | 影响 | 建议                                                               |
| ------------------------------------------------- | ---- | ------------------------------------------------------------------ |
| Vite proxy 无法用于生产                           | 高   | 提前确定 API 方案（CORS 直调 / Vercel rewrite / Serverless proxy） |
| 后端使用 HTTP，Vercel 使用 HTTPS                  | 高   | 要求后端上 HTTPS，或走服务端代理避免混合内容                       |
| AMap / DeepSeek 等密钥已泄露                      | 中   | 立即在控制台轮换，不在仓库保留真实值                               |
| React 19 / TS 6 / AntD 6 等版本较新               | 中   | 首次 `pnpm install` 后仔细检查 peer-dep 告警与构建错误             |
| project-2 `*.vue.bak` 与 `dist/` 已入 git         | 中   | 清理后再迁入，避免污染 monorepo                                    |
| project-2 `cryptojs.ts` 硬编码 AES 密钥           | 中   | 当前实现可用但安全性弱，建议后续改用环境变量管理密钥               |
| project-1 含大量教学文档与 `.playwright-cli` 日志 | 低   | 不迁入 monorepo，留在原仓库即可                                    |

---

## 7. 验收标准

- [ ] `docs/MIGRATION_PLAN.md` 已包含两个项目的技术栈、依赖、第三方 API、迁移步骤、环境变量需求。
- [ ] `apps/project-1` 与 `apps/project-2` 目录结构正确，无 `node_modules`/`dist`/`package-lock.json`。
- [ ] 两个 app 分别可执行 `pnpm --filter <app> build` 并通过。
- [ ] Vercel 上两个 project 的 Root Directory 设置正确，预览环境可访问首页及深层路由。
- [ ] 第三方 API 在预览环境中调用正常（依赖后端 CORS/HTTPS/代理方案落地）。
- [ ] `docs/TASKS.md` 与 `docs/PROGRESS.md` 已同步更新。
