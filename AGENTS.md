# 项目维护规范（所有 AI 开工前必读）

## 当前维护方式

自 2026-10-21 起，按用户明确要求，本仓库的网站维护默认由 **Codex** 统一承担，涵盖 `apps/site`、`apps/project-1`、`apps/project-2` 的内容、视觉、样式、动效、功能、结构、测试、文档及部署相关工作。Codex 负责理解需求、检查前提、实施、验收、自审和汇报；获得本次任务的合并或发布授权后，也由 Codex 完成合并与上线核验。用户直接向 Codex 提出维护需求，无需经过 OpenCode 派活、Claude Code 固定审查或在多个 AI 之间转发提示词。

原来的 AI 地盘划分和固定交接流程已归档，不再限制 Codex 修改视觉、内容或其他维护文件。其他 AI 仅在用户明确安排时参与，并以当次任务范围为准。历史任务、审计和进度中的负责人记录保留原样，不能据此推断仍有文件被占用或有任务需要自动执行；接续旧任务时应核实当前状态。

用户当前明确指令优先；仓库内的现行约束以本文件及 `docs/DECISIONS.md` 中后续已确认的相关决策为准。历史协作分工由 2026-10-21 的决策替代，原有技术、产品和部署决策继续保留；如需变更尚未获用户授权的既定决策，先记录提议并确认。

## 原约束备份与恢复

原协作约束完整保存在 [`docs/archive/collaboration-policy/2026-10-21/`](docs/archive/collaboration-policy/2026-10-21/README.md)，包含本次修改前的 `AGENTS.md`、`docs/PROMPTS.md`、`docs/MEMORY_INDEX.md` 和 `.claude/agents/reviewer.md` 原文，以及来源提交和 SHA-256 校验清单。`.original` 文件仅作归档参考，不是现行指令，不得格式化或覆盖这些原始备份。

以后用户明确说 **“恢复原来的协作约束”** 或同义要求时，默认按该目录的恢复说明还原原协作规则，并同步现行入口、决策和任务/进度记录。恢复只调整协作约束，保留之后的网站代码、技术决策和历史记录；不得用整仓回滚代替约束恢复。用户的恢复要求已授权执行这次约束调整，不必再次确认是否恢复；合并及生产发布仍按当次授权处理。

## 这是什么

个人网站 + 两个旧项目的 monorepo，pnpm workspace 管理。

- `apps/site` — 个人网站（Astro）
- `apps/project-1` — 旧项目 1（前端 + 第三方后端 API）
- `apps/project-2` — 旧项目 2（前端 + 第三方后端 API）

## 技术栈与命令

- 包管理：**只用 pnpm**，不要用 npm/yarn。
- 安装依赖：`pnpm install`。
- 开发：`pnpm --filter <app名> dev`。
- 构建：`pnpm --filter <app名> build`。
- 前端构建产物必须能纯静态部署，业务后端使用第三方 API。例外：project-2 按用户 2026-08-27 的部署及 AI 任务要求允许 Vercel Serverless 商城/图片/共享 AI 代理，范围见 `docs/DECISIONS.md`。

## 部署与授权

- 平台：Vercel。每个 app 对应一个 Vercel project，Root Directory 指向 `apps/<app名>`。
- `main` 分支 push 即部署生产环境；feature 分支自动生成预览环境。
- Codex 统一维护是职责安排，合并到 `main`、推送 `main` 或主动触发生产重部署仍需用户对当前任务的明确授权。用户已在当前任务中授权的步骤直接执行，不重复请求确认；“仅本地”“不推送”“先看效果”等限制必须遵守。
- 获得发布授权后，由 Codex 检查部署状态和目标页面/接口，区分构建通过、部署成功与线上业务验收，不以其中一项代替全部结果。

## 开工与分支规则

1. 先读取 `AGENTS.md`、`docs/TASKS.md`、`docs/DECISIONS.md`、`docs/GOTCHAS.md` 和最近的 `docs/PROGRESS.md`；修改 app 前还要读取该目录的 `AGENTS.md` 及相关说明。
2. 先检查任务的关键前提、目标和证据。发现错误假设、范围冲突或重要信息缺失时直接说明；能在现有授权下确定的实现细节自行处理，只有影响结果的关键信息缺失时才询问。
3. **任何切分支、pull 或修改之前，先执行 `git status --short` 和 `git branch --show-current`。** 来源不明或属于其他任务的未提交改动不得提交、丢弃或自行 stash；如果无法隔离当前任务，先说明具体冲突并询问归属。继续本次任务时可保留已确认属于自己的改动。
4. 代码和文档改动都必须在独立的 `feature/<任务名>` 分支完成，严禁在 `main` 上直接修改或提交。工作区干净且开始新任务时执行：

   ```bash
   git checkout main
   git pull --ff-only origin main
   git checkout -b feature/<任务名>
   ```

   接续已存在的任务时使用该任务分支，不重复创建分支或强行切回 `main`。只读检查无需新建分支。

5. 开始实施前在 `docs/TASKS.md` 登记或更新当前任务，标明 owner、范围和验收标准。只改本次任务必要的文件，不因统一维护而扩大需求。
6. 同一工作区默认只推进一个写入任务。若用户安排其他 AI 并行，应使用独立 worktree/checkout，明确文件范围，避免共用工作区切分支及同时修改任务/进度文档；不得擅自覆盖其他人的工作。

## 验收与收工

Codex 完成实现后检查 diff、任务范围、功能回归、错误与安全问题以及文档一致性。按实际改动运行相关构建、类型检查、测试或浏览器验收；纯文档变更检查格式、链接、内容和 diff 即可。样式与动效需验证实际页面和必要的响应式/减少动态效果场景；已有规则和踩坑继续适用。自审须如实标明，不能声称已由独立 reviewer 审查。

收工前必须更新 `docs/TASKS.md` 当前任务状态，并在 `docs/PROGRESS.md` 追加日期、AI 名、实际完成内容、验证边界和分支/commit。必要时追加 `docs/GOTCHAS.md`，修改记忆入口时同步 `docs/MEMORY_INDEX.md`；只更新与本次任务有关的条目，保留历史记录。

提交前执行 `git status`、`git diff --stat` 和 `git diff --check`，确认只有本次任务的改动；用明确文件路径暂存，避免无差别收进其他改动。提交使用中文说明，例如 `git commit -m "docs: 调整网站维护约束"`。默认提交并推送 feature 分支；用户要求仅本地或暂不提交/推送时，以用户要求为准。

汇报应说明完成了什么、如何验证、尚未验证或尚待确认的内容，以及下一步。后续工作默认仍由 Codex 接续，无需为了符合旧格式而转交其他 AI。需要用户确认合并时，提供已完成的具体结果和可检查的分支/diff。

## 合并规则

Codex 自审和相关验收通过、且用户已明确授权本次任务合并后，由 Codex 执行；不再强制交给 Claude Code 或 OpenCode。若用户要求独立审查，先完成该审查。合并前检查工作区干净、远端状态和待合并差异；若 `main` 已更新，处理差异并重跑受影响的验收。

使用 `--no-ff` 保留任务分支历史：

```bash
git checkout main
git pull --ff-only origin main
git merge --no-ff feature/<任务名>
git push origin main
```

确认远端合并成功且完成必要的上线核验后，可删除本次任务已合并的本地与远端 feature 分支。遇到冲突不得用强推或覆盖其他改动处理；先定位冲突并在当前授权范围内解决。

## Skill 使用规则

- **ponytail**：仅当用户明确说出触发词时才调用。触发词包括 `ponytail`、`lazy mode`、`be lazy`、`simplest solution`、`minimal solution`、`yagni`、`do less`、`shortest path`，或用户明确抱怨 over-engineering / bloat / boilerplate / unnecessary dependencies。
- 默认编码任务**不主动使用 ponytail**。如果用户没有给出上述任何信号，按正常工程化方式实现。

## 记忆文档体系

- **`AGENTS.md`**：项目维护规范和唯一入口，记录现行职责、技术约束、分支流程和恢复入口。
- **`docs/DECISIONS.md`**：已确认的技术/产品/流程决策；后续变更追加新条目并说明替代关系，保留旧记录。
- **`docs/TASKS.md`**：任务状态、owner、范围和验收标准。
- **`docs/PROGRESS.md`**：按时间记录实际完成内容、验证边界和分支/commit。
- **`docs/GOTCHAS.md`**：已知踩坑与复用经验，开工前必读。
- **`docs/MEMORY_INDEX.md`**：现行规范和记忆分册索引。
- **`docs/PROMPTS.md`**：Codex 维护、可选独立审查和恢复原约束的提示词模板。
- **`docs/archive/collaboration-policy/2026-10-21/`**：原协作约束的只读备份、校验清单与恢复说明。
- **`CLAUDE.md`**：仅以 `@AGENTS.md` 导入现行入口，不另存一套规则。

代码改动与相关任务/进度文档必须同步。历史审计、设计文档和进度里的 AI 姓名用于记录当时事实，不覆盖本文件的现行职责安排。
