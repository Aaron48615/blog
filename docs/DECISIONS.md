# 决策日志

已定决策，后来者必须遵守。要推翻：新增一条"提议"条目并等人确认，不许直接改代码。
格式：`日期 | 决策 | 理由 | 定下者`

- 2026-08-25 | 仓库结构：monorepo + pnpm workspace | 记忆文档只维护一份，多 AI 协作摩擦最小 | 用户 + OpenCode
- 2026-08-25 | 部署平台：Vercel，每个 app 一个 project | 免费、push 即部署、monorepo Root Directory 原生支持 | 用户
- 2026-08-25 | 记忆体系：AGENTS.md 为唯一源头，CLAUDE.md 仅一行 `@AGENTS.md` 导入 | 避免双份内容漂移 | 用户 + OpenCode
- 2026-08-25 | 分工：Codex=逻辑/结构/部署，Antigravity=视觉，OpenCode Go=内容/杂活，Claude Code=review | 按层切分，同一时间一个文件只有一个 AI 碰 | 用户 + OpenCode
- 2026-08-25 | 所有产物纯静态构建，仓库内不含服务端 | 两个旧项目的后端均为第三方 API | 用户
- 2026-08-25 | apps/site 用 Astro | 内容型个人站首选，默认零 JS | 用户确认
- 2026-08-26 | 旧项目源目录：project-1 来源 `/Users/aaron/LoveCoding/21_React/高阶/data-pilot`，project-2 来源 `/Users/aaron/LoveCoding/20_Vue3/mobile-shop` | 用户已提供，作为迁移来源 | 用户
