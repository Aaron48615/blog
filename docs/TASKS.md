# 任务看板

状态符号：`[ ]` 待认领 ｜ `[~]` 进行中 ｜ `[x]` 完成
格式：`- [ ] 任务 | owner: <AI名/人> | 验收: <怎么算完成>`

## 待用户确认（当前阻塞，新会话接手先看这里）

> apps/site DESIGN.md v3 规范制定与全站样式重构已全部完成，pnpm --filter site build 与 19 条注释逐条验收通过；待交 Claude Code review 并由用户/OpenCode 合并 feature/site-design-v3。

## Phase 1 — 脚手架与部署管线

- [x] apps/site Astro 脚手架 + 基础布局（首页/关于/项目列表） | owner: OpenCode Go | 验收: `pnpm --filter site dev` 可跑，三页可访问
- [x] 根目录格式化与 lint 配置（Prettier + 各 app 自带 lint） | owner: Codex | 验收: 全仓库 `pnpm format` 通过
- [x] Vercel 绑定：site 先上线（Hello World 即可） | owner: Codex | 验收: push main 自动部署，域名可访问

## Phase 2 — 旧项目迁移

- [x] 旧项目迁移评估（技术栈/依赖/第三方 API/迁移步骤/环境变量） | owner: OpenCode Go | 验收: `docs/MIGRATION_PLAN.md` 已包含全部信息
- [x] 旧项目 1 迁入 `apps/project-1`（来源：`/Users/aaron/LoveCoding/21_React/高阶/data-pilot`） | owner: Codex | 依赖: docs/MIGRATION_PLAN.md、API 路由方案确认（方案 B：Vercel rewrites） | 验收: build/test/lint 通过，Vercel 预览首页与深层路由可访问，`/api/auth/captcha` 调用正常
- [x] 旧项目 2 基础迁移至 `apps/project-2`（来源：`/Users/aaron/LoveCoding/20_Vue3/mobile-shop`） | owner: Codex | 范围: 源码清理、pnpm workspace 依赖整合与本地构建；不含 API 代理和部署 | 验收: 根目录冻结锁文件安装、强制类型检查、`pnpm --filter project-2 build` 通过，无真实 AI 密钥与垃圾文件入库；project-1 build/22 项测试及 site build 回归通过 | 分支: `feature/migrate-project-2-base`（待 Claude Code 审查）
- [x] 旧项目 2 API 代理与 Vercel 部署（第二段） | owner: Codex | 范围: 商城/图片代理、SPA 回退、首页失败隔离与重试；共享 AI 服务端代理未在本轮实现 | 验收: Vercel 预览首页与深层路由可访问、图片正常，第三方 API 调用正常，无真实 AI 密钥打入前端产物 | 分支: `feature/migrate-project-2-deploy`（已合并）
- [x] 旧项目 2 共享 AI 服务端代理 | owner: Codex | 依赖: project-2 部署已合并、用户已明确本轮匿名 IP 限流范围 | 验收: `/api/ai` 服务端代理、前端无 key、双窗口基础限流/输入限制/头过滤/错误脱敏及本地兜底已实现；63 项测试、build、92 文件假密钥产物检查通过；Claude Code 审查通过并已合并至 main；Vercel Preview 配置真实 key 与 `deepseek-v4-flash` 后，搜索联想与卖点生成功能联调通过 | 分支: `feature/project-2-ai-proxy`（已合并）
- [x] 两个项目各自的 Vercel project 绑定 | owner: 用户 | 进度: project-1/project-2 均已绑定 | 验收: push main 自动部署

## Phase 3 — 个人站内容施工

- [x] 首页视觉打磨（Hero、动效、配色定案） | owner: antigravity | 验收: 用户目检通过，Lighthouse 性能 ≥ 90
- [x] 项目展示页：嵌入 project-1 / project-2 的链接与介绍 | owner: OpenCode Go | 验收: 从个人站可跳转两个项目
  - [x] 关于页 + 联系方式 | owner: 用户 | 验收: 内容真实可发布

## Phase 3.5 — 博客结构改造

- [x] Site 博客结构改造（内容模型/路由/项目信息/名言数据） | owner: OpenCode | 验收: 四页路由 /,/posts,/posts/[slug],/projects 可访问、Content Collections 正常、项目页双按钮无内部路径、build 通过
- [x] Site 视觉重设计与动效实现（官网风居中Hero、名言3.5s渐变轮播、项目双卡片独立跳转、文章双栏与动态目录） | owner: Antigravity | 验收: 四页视觉现代精致、名言淡入淡出轮播正常、移动端响应良好、build 通过

## Phase 3.6 — 网站视觉规范与重做（v3 已完成）

- [x] Site 视觉规范制定与基于 DESIGN.md 重做 (v2) | owner: Antigravity | 验收: DESIGN.md 经用户确认，重构为 Vestris 调色板与精简双栏 | 分支: feature/site-design-system
- [x] Site 视觉规范 DESIGN.md v3 制定与全站重构 | owner: Antigravity | 范围: 基于 VISUAL_AUDIT.md 19 条注释制定 v3 规范、复制头像入库、重写四页样式与动效 | 验收: 得意黑艺术字+楷宋兜底、1.2s淡入淡出+4s停留、头像素材复用、四页样式重写与单屏例外落实，pnpm --filter site build 通过，19 条注释逐条验收 | 分支: feature/site-design-v3

## Phase 4 — 收尾

- [x] Site 生产视觉审计与用户注释整理 | owner: Codex | 范围: 覆盖 `/`、`/projects`、`/posts`、`/posts/hello-blog`，整理为 `apps/site/docs/VISUAL_AUDIT.md`，供 Antigravity 制定 DESIGN.md v3；未改样式、组件、页面代码或 DESIGN.md | 结果: 四页 19 条注释全部整理，含原话/定位/事实/优先级/建议/验收口径、跨页边界与交接提示词；头像源文件已只读核验，复制留给 Antigravity；同步任务/进度与审计 Gotcha | 交接: 本审计分支提交推送后交 Claude Code 文档审查，再由 Antigravity 制定 v3、用户确认后实施；不代表改版验收完成 | 分支: `feature/site-visual-audit`
- [ ] 全站 Lighthouse 走查（性能/SEO/无障碍） | owner: claude-code review + 用户拍板 | 验收: 四项 ≥ 90
- [ ] 各 AI 把踩坑写进 AGENTS.md 的 Gotchas | owner: 全体 | 验收: 至少各 1 条
