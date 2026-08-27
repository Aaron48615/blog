# 任务看板

状态符号：`[ ]` 待认领 ｜ `[~]` 进行中 ｜ `[x]` 完成
格式：`- [ ] 任务 | owner: <AI名/人> | 验收: <怎么算完成>`

## 待用户确认（当前阻塞，新会话接手先看这里）

> project-2 部署已合并；共享 AI 代理已实现，待审查及真实 key 预览复验；site 视觉重做待启动。

> project-2 部署分支已合并到 main。共享 AI 代码在 feature 分支完成本地验收，Preview 仍需配置服务端 key 与有效模型进行实际联调；site Phase 3.6 视觉规范重做待启动。

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

## Phase 3.6 — 网站视觉规范与重做（待启动）

- [~] Site 视觉规范制定与基于 DESIGN.md 重做 | owner: Antigravity | 方法: 先按参考站（idle.space / vestris.ai / lukevoidx.com/zh / chirpy.cotes.page/）输出 DESIGN.md（配色板、字体层级、间距系统、动效规范、布局描述），用户确认后再按规范重写样式；禁止直接复用旧 CSS 变量 | 验收: DESIGN.md 通过用户确认，最终首页/项目页/文章页与参考站视觉方向一致，无旧配色残留，build 通过

## Phase 4 — 收尾

- [ ] 全站 Lighthouse 走查（性能/SEO/无障碍） | owner: claude-code review + 用户拍板 | 验收: 四项 ≥ 90
- [ ] 各 AI 把踩坑写进 AGENTS.md 的 Gotchas | owner: 全体 | 验收: 至少各 1 条
