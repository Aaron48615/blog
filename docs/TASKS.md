# 任务看板

状态符号：`[ ]` 待认领 ｜ `[~]` 进行中 ｜ `[x]` 完成
格式：`- [ ] 任务 | owner: <AI名/人> | 验收: <怎么算完成>`

## 待用户确认（当前阻塞，新会话接手先看这里）

> Phase 1 的 site 上线与 Phase 3 视觉打磨已完成；project-2 部署验收存在以下待确认项。

> project-2 部署验收待用户协助：预览已成功构建，但 `/api/indexImgs` 被 Vercel Deployment Protection 以 302 转到 SSO；需要在已登录的浏览器完成访问验证。Production 环境变量尚未设置，真实 `VITE_AI_API_KEY` 与密钥安全验收冲突，待确认本轮 AI 先保留兜底、服务端共享 AI 代理另做。

## Phase 1 — 脚手架与部署管线

- [x] apps/site Astro 脚手架 + 基础布局（首页/关于/项目列表） | owner: OpenCode Go | 验收: `pnpm --filter site dev` 可跑，三页可访问
- [x] 根目录格式化与 lint 配置（Prettier + 各 app 自带 lint） | owner: Codex | 验收: 全仓库 `pnpm format` 通过
- [x] Vercel 绑定：site 先上线（Hello World 即可） | owner: Codex | 验收: push main 自动部署，域名可访问

## Phase 2 — 旧项目迁移

- [x] 旧项目迁移评估（技术栈/依赖/第三方 API/迁移步骤/环境变量） | owner: OpenCode Go | 验收: `docs/MIGRATION_PLAN.md` 已包含全部信息
- [x] 旧项目 1 迁入 `apps/project-1`（来源：`/Users/aaron/LoveCoding/21_React/高阶/data-pilot`） | owner: Codex | 依赖: docs/MIGRATION_PLAN.md、API 路由方案确认（方案 B：Vercel rewrites） | 验收: build/test/lint 通过，Vercel 预览首页与深层路由可访问，`/api/auth/captcha` 调用正常
- [x] 旧项目 2 基础迁移至 `apps/project-2`（来源：`/Users/aaron/LoveCoding/20_Vue3/mobile-shop`） | owner: Codex | 范围: 源码清理、pnpm workspace 依赖整合与本地构建；不含 API 代理和部署 | 验收: 根目录冻结锁文件安装、强制类型检查、`pnpm --filter project-2 build` 通过，无真实 AI 密钥与垃圾文件入库；project-1 build/22 项测试及 site build 回归通过 | 分支: `feature/migrate-project-2-base`（待 Claude Code 审查）
- [~] 旧项目 2 API 代理与 Vercel 部署（第二段） | owner: Codex | 进度: Serverless 商城代理、同源 `/api`、SPA 回退已推送；11 项测试、build、假密钥注入后的产物检查通过；`d1740b5` 的 Vercel 预览构建成功，但在线验收被 SSO 访问保护阻断，Production 环境变量与 AI 安全替代范围待确认 | 验收: Vercel 预览首页与深层路由可访问，第三方 API 调用正常，无真实 AI 密钥打入前端产物 | 分支: `feature/migrate-project-2-deploy`
- [~] 两个项目各自的 Vercel project 绑定 | owner: 用户 | 进度: project-1 已绑定，project-2 基础迁移完成，待 API 代理与部署 | 验收: push main 自动部署

## Phase 3 — 个人站内容施工

- [x] 首页视觉打磨（Hero、动效、配色定案） | owner: antigravity | 验收: 用户目检通过，Lighthouse 性能 ≥ 90
- [x] 项目展示页：嵌入 project-1 / project-2 的链接与介绍 | owner: OpenCode Go | 验收: 从个人站可跳转两个项目
  - [x] 关于页 + 联系方式 | owner: 用户 | 验收: 内容真实可发布

## Phase 3.5 — 博客结构改造

- [x] Site 博客结构改造（内容模型/路由/项目信息/名言数据） | owner: OpenCode | 验收: 四页路由 /,/posts,/posts/[slug],/projects 可访问、Content Collections 正常、项目页双按钮无内部路径、build 通过
- [x] Site 视觉重设计与动效实现（官网风居中Hero、名言3.5s渐变轮播、项目双卡片独立跳转、文章双栏与动态目录） | owner: Antigravity | 验收: 四页视觉现代精致、名言淡入淡出轮播正常、移动端响应良好、build 通过

## Phase 3.6 — 网站视觉规范与重做（待启动）

- [ ] Site 视觉规范制定与基于 DESIGN.md 重做 | owner: Antigravity | 方法: 先按参考站（idle.space / vestris.ai / lukevoidx.com/zh / chirpy.cotes.page/）输出 DESIGN.md（配色板、字体层级、间距系统、动效规范、布局描述），用户确认后再按规范重写样式；禁止直接复用旧 CSS 变量 | 验收: DESIGN.md 通过用户确认，最终首页/项目页/文章页与参考站视觉方向一致，无旧配色残留，build 通过

## Phase 4 — 收尾

- [ ] 全站 Lighthouse 走查（性能/SEO/无障碍） | owner: claude-code review + 用户拍板 | 验收: 四项 ≥ 90
- [ ] 各 AI 把踩坑写进 AGENTS.md 的 Gotchas | owner: 全体 | 验收: 至少各 1 条
