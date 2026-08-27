# 拾光集 · Mobile Shop

Vue 3 + TypeScript + Vite + Vant 移动端商城，迁自 `mobile-shop`。
本目录属于根仓库的 pnpm workspace，包名为 `@personal/project-2`。

## 本地运行

在仓库根目录执行（Node.js `^22.18.0 || >=24.12.0`）：

```sh
pnpm install
pnpm --filter project-2 dev
pnpm --filter project-2 build
pnpm --filter project-2 preview
```

`build` 包含 `vue-tsc --build` 类型检查和 Vite 静态构建；产物位于本目录的 `dist/`，不提交到 Git。依赖统一记录在根目录 `pnpm-lock.yaml`。

迁移保留严格类型检查，启用 `allowJs` 以兼容现有 JS API/AI 模块，并补充视图状态类型、必要空值保护和 `postcss-pxtorem` 类型声明。API 的响应外层已有类型，旧 JS 接口的 payload 仍沿用未细化的类型，不代表已完成接口校验。原有 `::v-deep` 写法产生非阻断弃用警告，视觉调整留待后续。

## 配置与迁移边界

- `.env.development` 仅保留原项目的公开商城 API 地址；`.env.example` 提供公开配置模板。
- 未迁入原 `.env.local`、真实 AI key、`node_modules/`、`dist/`、npm 锁文件、Vue 备份、系统文件、浏览器调试记录及学习笔记；原项目文件保持不变。
- 未使用的 `amfe-flexible` 依赖已移除，继续使用原有 `src/utils/rem.ts`，不改变移动端布局逻辑。
- 本阶段只验收本地构建，不配置 API 代理、生产环境变量、SPA 部署回退或 Vercel。不代表登录、下单和 AI 功能已通过联调。
- 原 AI provider 支持浏览器配置和 `VITE_AI_API_KEY`。所有 `VITE_*` 值都可能进入前端产物，**不能用 Vercel 环境变量隐藏共享密钥**。未配置 key 时 AI provider 不可用；密钥轮换及安全调用方案留到后续确认。
- 原登录 AES 常量随协议实现保留，浏览器端常量不能视为保密措施；本次不改登录协议。
