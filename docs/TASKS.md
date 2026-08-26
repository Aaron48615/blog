# 任务看板

状态符号：`[ ]` 待认领 ｜ `[~]` 进行中 ｜ `[x]` 完成
格式：`- [ ] 任务 | owner: <AI名/人> | 验收: <怎么算完成>`

## 待用户确认（当前阻塞，新会话接手先看这里）
1. 首次提交：骨架尚未 commit，待用户授权

> 用户已确认 Astro、两个旧项目源目录，Phase 1 任务 1 正在执行。

## Phase 1 — 脚手架与部署管线
- [x] apps/site Astro 脚手架 + 基础布局（首页/关于/项目列表） | owner: OpenCode Go | 验收: `pnpm --filter site dev` 可跑，三页可访问
- [~] 根目录格式化与 lint 配置（Prettier + 各 app 自带 lint） | owner: Codex | 验收: 全仓库 `pnpm format` 通过
- [ ] Vercel 绑定：site 先上线（Hello World 即可） | owner: 待认领 | 验收: push main 自动部署，域名可访问

## Phase 2 — 旧项目迁移
- [~] 旧项目迁移评估（技术栈/依赖/第三方 API/迁移步骤） | owner: OpenCode Go | 验收: docs/ 下形成可执行迁移方案文档
- [ ] 旧项目 1 迁入 `apps/project-1`（来源：`/Users/aaron/LoveCoding/21_React/高阶/data-pilot`） | owner: 待认领 | 验收: build 通过，预览环境可访问，第三方 API 调用正常
- [ ] 旧项目 2 迁入 `apps/project-2`（来源：`/Users/aaron/LoveCoding/20_Vue3/mobile-shop`） | owner: 待认领 | 验收: 同上
- [ ] 两个项目各自的 Vercel project 绑定 | owner: 用户 | 验收: push main 自动部署

## Phase 3 — 个人站内容施工
- [ ] 首页视觉打磨（Hero、动效、配色定案） | owner: antigravity | 验收: 用户目检通过，Lighthouse 性能 ≥ 90
- [ ] 项目展示页：嵌入 project-1 / project-2 的链接与介绍 | owner: 待认领 | 验收: 从个人站可跳转两个项目
- [ ] 关于页 + 联系方式 | owner: 待认领 | 验收: 内容真实可发布

## Phase 4 — 收尾
- [ ] 全站 Lighthouse 走查（性能/SEO/无障碍） | owner: claude-code review + 用户拍板 | 验收: 四项 ≥ 90
- [ ] 各 AI 把踩坑写进 AGENTS.md 的 Gotchas | owner: 全体 | 验收: 至少各 1 条
