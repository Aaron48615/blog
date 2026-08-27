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
- 2026-08-26 | project-1 采用 Vercel rewrites：`/api/:path*` 转发至 `http://116.62.230.90/api/:path*`，SPA 路由回退至 `/index.html` | 实测 `:9999` 提供 API 文档且业务路径返回 404；端口 80 的 `/api/auth/captcha` 返回正常 JSON，并已在 Vercel 预览中验证 | 用户 + Codex
- 2026-08-27 | project-2 按用户本轮明确要求采用 Vercel Serverless Function 转发商城 `/api/*` 至 `http://shop-api.edu.koobietech.com/*`；作为“仓库不含服务端”的限定例外，仅增加代理，前端仍静态构建，商城业务后端仍为第三方 | 用户明确指定 Serverless 代理方案；不影响 project-1 与 site 的既有方案 | 用户
- 2026-08-27 | 提议（待确认）：本轮不向 `VITE_AI_API_KEY` 写入真实共享密钥，AI 保留现有无配置兜底；共享 AI 服务改用不含 `VITE_` 前缀的服务端密钥及鉴权/限流代理另行实施 | 现有前端读取该变量，Vite 会将真实 key 打入前端产物，与本轮验收冲突 | Codex 提议
- 2026-08-27 | 用户已明确派发共享 AI 代理任务：确认前条服务端密钥方向，project-2 增加 Vercel `/api/ai`，仅服务端读取 `DEEPSEEK_API_KEY`；匿名调用按 IP 默认每分钟 10 次/每小时 50 次，保留本地兜底，不复用商城 Authorization | 限定扩展 Serverless 例外；本轮用实例内存滚动窗口实现基础保护，不承诺跨实例全局配额或费用硬上限；更强鉴权/共享存储另行决策 | 用户（任务范围）+ Codex（实现及边界说明）
