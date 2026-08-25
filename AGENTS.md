# 项目总规范（所有 AI 开工前必读）

## 这是什么
个人网站 + 两个旧项目的 monorepo，pnpm workspace 管理。

- `apps/site` — 个人网站（Astro，暂定）
- `apps/project-1` — 旧项目 1（前端 + 第三方后端 API）
- `apps/project-2` — 旧项目 2（前端 + 第三方后端 API）

## 技术栈与命令
- 包管理：**只用 pnpm**，不要用 npm/yarn
- 安装依赖：`pnpm install`
- 开发：`pnpm --filter <app名> dev`
- 构建：`pnpm --filter <app名> build`
- 构建产物必须能纯静态部署（后端是第三方 API，本仓库不含服务端）

## 部署
- 平台：Vercel。每个 app 对应一个 Vercel project，Root Directory 指向 `apps/<app名>`
- main 分支 push 即部署生产环境；feature 分支自动生成预览环境

## 协作规则（违反 = 返工）
1. 开工前必读 `docs/TASKS.md`（认领任务、标 owner）和 `docs/DECISIONS.md`（遵守已定决策）
2. 一个任务一个分支：`feature/<任务名>`，不直接推 main
3. 同一时间一个文件只允许一个 AI 修改。默认地盘划分：
   - 视觉/样式（components、styles、动效）→ Antigravity (Gemini)
   - 逻辑/结构/部署 → Codex (GPT)
   - 内容页/迁移/杂活 → OpenCode Go
   - Claude Code 只做 review，不写新功能
4. 收工前必须更新：`docs/TASKS.md` 任务状态 + `docs/PROGRESS.md` 追加一行（日期、AI 名、做了什么、分支/commit）
5. 已定决策不允许私自推翻；要改，先在 DECISIONS.md 提新条目并等人确认

## Gotchas（踩坑记录，所有 AI 完工后必须补充）
（暂无）
