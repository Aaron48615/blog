# 进度流水

格式：`日期 | AI/人 | 做了什么 | 分支/commit`

- 2026-08-25 | OpenCode | 初始化 monorepo 骨架：AGENTS.md / CLAUDE.md / docs 三件套 / pnpm-workspace.yaml | （待首次提交）
- 2026-08-25 | OpenCode | 会话从 ~/前端笔记 迁至 ~/personal-hub：知识已全部落盘 docs/，阻塞项见 TASKS.md"待用户确认" | —
- 2026-08-25 | OpenCode | 新增 docs/PROMPTS.md（四个 AI 的派活模板）+ .claude/agents/reviewer.md（CC 审查员 subagent） | （待首次提交）
- 2026-08-26 | OpenCode | 确认 Astro + 旧项目源目录；创建 apps/site Astro 脚手架；实现首页/关于/项目列表三页；验证 dev server 可访问 | feature/site-scaffold（待首次提交）
- 2026-08-26 | OpenCode Go | 评估 data-pilot 与 mobile-shop 两个旧项目，输出 `docs/MIGRATION_PLAN.md`；更新 TASKS.md Phase 2 状态；明确 API 路由/HTTPS/密钥轮换等迁移风险 | docs/migration-plan（待提交）
- 2026-08-26 | Codex | 根仓库新增 Prettier 与 Astro 插件，配置 `pnpm format` 覆盖所有 app；保留 app 自带 lint；格式化全仓并验证 Astro 静态构建 | feature/root-lint-format（待提交）
- 2026-08-26 | Antigravity | 完成 apps/site 首页 Hero、配色系统、纯 CSS 关键帧微动效与排版打磨，保持 100% 零 JS 静态输出 | feature/site-visual
- 2026-08-26 | Codex | 创建 Vercel 项目 `aaron-site`，绑定 `Aaron48615/blog` 的 `apps/site`，验证 Astro 纯静态构建、main 自动部署与生产域名 `aaron-site-chi.vercel.app` | feature/site-vercel-deploy（已合并到 main，commit 708917f）
- 2026-08-26 | OpenCode | 经 Claude Code 审查通过后，执行 `--no-ff` 合并 `feature/site-vercel-deploy` 到 main，删除已合并分支 | main@708917f
- 2026-08-26 | OpenCode | 与用户确认旧项目迁移策略：先做 project-1 试点，采用 vercel.json rewrites 方案 B；project-2 待 project-1 预览环境验证通过后再认领 | feature/tasks-project1-pilot
- 2026-08-26 | OpenCode | 用户叫停 OpenCode Go 的迁移工作；删除 feature/migrate-projects 分支及其进度；TASKS.md 中 project-1/project-2 回退为待认领，等待 API 方案最终确认后再派活 | main
- 2026-08-27 | 用户 | 验证 project-1 生产部署：Root Directory 正确、Production 环境变量已配置、`/api/auth/captcha` 返回 JSON 正常 | project-1-jade-omega.vercel.app
- 2026-08-26 | OpenCode Go | 填充 apps/site/src/pages/projects.astro：按 MIGRATION_PLAN 更新 Data Pilot / Mobile Shop 简介、技术栈、状态为迁移中，卡片整体可点击跳转 GitHub 源码占位链接；验证 site build/preview 通过 | feature/site-projects-content
- 2026-08-27 | Codex | 将 data-pilot 复制迁入 apps/project-1，清理密钥与构建残留、修正 TS import 和依赖，配置 Vercel SPA/API rewrites；完成 build/test/lint/preview 与 Vercel 预览验收，并实测确认 `:9999` 是文档服务、业务 API 为端口 80 的 `/api` | feature/migrate-project-1@308f0f1
- 2026-08-27 | OpenCode | apps/site 博客结构改造：创建 Content Collections 配置与示例文章，新增 /posts 文章列表页与 /posts/[slug] 详情页，替换项目页为拾光集/云枢双卡片+双按钮，首页 Hero 保留+7 条名言数组，删除 about.astro，导航改为首页/文章/项目，build 通过 | feature/site-blog-structure
- 2026-08-27 | Antigravity | 完成 apps/site 视觉重设计与动效：技术官网风居中首页、7 条名言 3.5s 渐变平滑淡入淡出轮播、/projects 双卡片独立双按钮跳转、/posts 左侧个人介绍粘性侧边栏+右侧文章列表、/posts/[slug] 自动生成 h2/h3 目录粘性侧边栏+更多文章推荐+移动端无缝响应，全站静态构建通过 | feature/site-visual
