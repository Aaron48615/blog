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
6. **收工汇报格式**：每个 AI 完成当前任务后，必须口头向用户汇报三件事——**完成了什么**、**下一步可以做什么**、**建议交给谁做**。不准只写“做完了”。

## 记忆文档体系（所有 AI 共同维护）

本项目采用“一总纲 + 多分册”的正式记忆文档结构：

- **AGENTS.md（本文档）**：项目记忆总纲。任何 AI 进入项目时首先读取此文件；它包含规范、分工、命令、踩坑记录，以及下方记忆分册的索引。
- **docs/DECISIONS.md**：决策记忆。所有已经拍板的技术/产品/流程决策必须记录在此；推翻决策必须先新增条目并等人确认。
- **docs/TASKS.md**：任务记忆。当前所有任务的状态、owner、验收标准。开工前认领，收工前更新。
- **docs/PROGRESS.md**：进度记忆。按时间线记录每次谁做了什么、对应哪个分支/commit，便于回溯。
- **docs/PROMPTS.md**：派活模板记忆。给 Codex / Antigravity / Claude Code 的标准化 prompt 模板。
- **CLAUDE.md**：仅作为 AGENTS.md 的入口（`@AGENTS.md`），本身不存放新内容。

所有 AI 在修改代码的同时，必须同步维护上述文档；代码改动与记忆文档不同步视为未完成。

## Gotchas（踩坑记录，所有 AI 完工后必须补充）

- pnpm 11 的 `allowBuilds` 必须写在根目录 `pnpm-workspace.yaml`；旧版 `onlyBuiltDependencies` 与 `package.json` 里的 `allowScripts` 已失效。esbuild 等带 native binary 的包若被忽略构建脚本，会触发 `ERR_PNPM_IGNORED_BUILDS`。
- `pnpm-lock.yaml` 应加入 `.prettierignore`，锁文件交给 pnpm 序列化；Prettier 会产生数千行无语义 diff。
