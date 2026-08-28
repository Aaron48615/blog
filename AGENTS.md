# 项目总规范（所有 AI 开工前必读）

## 核心红线（违反 = 返工）

1. **第一句先切分支**。进入仓库后先执行：
   ```bash
   git checkout main && git pull origin main && git checkout -b feature/<任务名>
   ```
   然后才读文件、才改代码。顺序不能反。
2. **严禁在 `main` 分支上直接改文件、提交、push。** 所有代码和文档改动必须在 feature 分支完成。
3. **只改自己任务范围内的文件**。默认地盘：
   - 视觉/样式/动效 → Antigravity (Gemini)
   - 逻辑/结构/部署 → Codex (GPT)
   - 内容页/迁移/杂活 → OpenCode Go（Qwen 3.7 Plus）
   - 总控/派活/合并 → OpenCode（Kimi K2.7 code）
   - 审查 → Claude Code（只 review，不写代码）
4. **收工前必须更新 `docs/TASKS.md` 任务状态 + `docs/PROGRESS.md` 追加一行**（日期、AI 名、做了什么、分支/commit）。

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
- 前端构建产物必须能纯静态部署，业务后端使用第三方 API。例外：project-2 按用户 2026-08-27 的部署及 AI 任务要求允许 Vercel Serverless 商城/图片/共享 AI 代理，范围见 `docs/DECISIONS.md`。

## 部署

- 平台：Vercel。每个 app 对应一个 Vercel project，Root Directory 指向 `apps/<app名>`
- main 分支 push 即部署生产环境；feature 分支自动生成预览环境

## 协作规则（违反 = 返工）

1. 开工前必读 `docs/TASKS.md`（认领任务、标 owner）和 `docs/DECISIONS.md`（遵守已定决策）。
2. 一个任务一个分支：`feature/<任务名>`，不直接推 main。详细流程见下节。
3. 同一时间一个文件只允许一个 AI 修改。地盘划分见【核心红线】第 3 条。
4. 已定决策不允许私自推翻；要改，先在 `docs/DECISIONS.md` 提新条目并等人确认。
5. **收工汇报格式**：每个 AI 完成当前任务后，必须口头向用户汇报三件事——**完成了什么**、**下一步可以做什么**、**建议交给谁做**。不准只写“做完了”。

## 防 AI 冲突工作流（必须严格执行）

> 历史教训：多个 AI 同时在同一个 working tree 上直接改文件，会导致改动混在一起、作者不明、难以 review。以下流程用于避免这种情况。

### 开工前（第一句就做，顺序不能反）

```bash
git checkout main
git pull origin main
git checkout -b feature/<任务名>
```

**如果你发现自己在 `main` 分支上，立刻停止，执行上面三句后再继续。**

- 开工前先看 `docs/TASKS.md`，确认任务 owner 是自己、且目标文件没有被别的 AI 占用。
- 如果发现自己的 working tree 里已经有未提交改动（`git status` 不干净），**立即停止**，先问用户这些改动属于谁，不要擅自提交。

### 工作中

- **只改自己任务范围内的文件**。
- **不要改 `main` 分支，不要在 `main` 上直接 `git add && git commit`。**
- 如果需要改记忆文档（`docs/TASKS.md`、`docs/PROGRESS.md` 等），只改自己任务相关的条目。

### 收工前

```bash
git status          # 确认只提交了自己改的文件
git diff --stat     # 确认改动范围合理
git add -A
git commit -m "<type>: <中文描述>"
git push -u origin feature/<任务名>
```

- **不允许私自 merge 到 main**。分支必须由用户或 Claude Code review 通过，再由 OpenCode 或用户执行合并。
- 如果任务涉及多个 app 或跨层改动，提交前先跑相关验收命令（如 `pnpm format`、`pnpm --filter <app> build`）。

### 合并规则

1. 用户或指定 reviewer 检查分支 diff。
2. 确认无冲突、验收通过。
3. 使用 `--no-ff` 合并到 main，保留分支历史：
   ```bash
   git checkout main
   git pull origin main
   git merge --no-ff feature/<任务名>
   git push
   git branch -d feature/<任务名>
   git push origin --delete feature/<任务名>
   ```

## Skill 使用规则

- **ponytail**：仅当用户明确说出触发词时才调用。触发词包括 `ponytail`、`lazy mode`、`be lazy`、`simplest solution`、`minimal solution`、`yagni`、`do less`、`shortest path`，或用户明确抱怨 over-engineering / bloat / boilerplate / unnecessary dependencies。
- 默认编码任务**不主动使用 ponytail**。如果用户没有给出上述任何信号，按正常工程化方式实现。

## 四 AI 协作主流程（OpenCode 总控）

本流程用于把“谁该干什么、谁审查、谁合并”规范化，避免多 AI 同时乱改同一个 working tree。

### 角色

- **OpenCode（总控）**：查看进度、审查状态、写派活提示词，由用户转发给执行者。
- **Codex / Antigravity / OpenCode Go（执行者）**：各自在独立 feature 分支上完成任务。
- **Claude Code（审查员）**：只 review，不写新功能；审查通过后代为汇报给 OpenCode。
- **用户（决策者）**：在每个关键节点确认或转发提示词。

### 流程

1. **OpenCode 派发**
   - OpenCode 读取 `docs/TASKS.md`、`docs/PROGRESS.md` 和分支状态。
   - OpenCode 写一段派活提示词，用户复制给对应的执行者。

2. **执行者开工**
   - 执行者收到提示词后，第一句执行：
     ```bash
     git checkout main
     git pull origin main
     git checkout -b feature/<任务名>
     ```
   - 执行者读 `AGENTS.md`、`docs/TASKS.md`，开始工作。

3. **执行者收工并推送**
   - 完成任务后，执行者更新 `docs/TASKS.md` 和 `docs/PROGRESS.md`。
   - 执行者 commit、push feature 分支。
   - 执行者写一段**给 Claude Code 的审查提示词**，用户复制给 Claude Code。

4. **Claude Code 审查**
   - 同一时刻只审查一个 feature 分支。
   - 审查内容：代码质量、是否改了不该改的文件、验收是否通过、记忆文档是否同步。
   - **通过**：Claude Code 写一段**给 OpenCode 的完成汇报提示词**，用户复制给 OpenCode。
   - **不通过**：小问题退回原执行者修复；大方向问题由 OpenCode 重新评估。

5. **合并到 main**
   - OpenCode 收到完成汇报后，执行合并（或告诉用户如何合并）：
     ```bash
     git checkout main
     git pull origin main
     git merge --no-ff feature/<任务名>
     git push
     git branch -d feature/<任务名>
     git push origin --delete feature/<任务名>
     ```

6. **继续派发**
   - OpenCode 更新总进度，继续派发下一个任务。

### 并发规则

- **同一时刻尽量只让一个 AI 工作、一个 AI 审查**。
- 例如：Antigravity 在 `feature/site-visual` 工作时，Codex 不要同时开工新分支；等 Antigravity 分支进入 Claude Code 审查阶段，再派 Codex 做下一个任务。
- 如果必须并行，必须确保两个任务修改的文件完全不重叠，且各自独立分支。

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
- Astro 构建时如遇到 `~/Library/Preferences/astro/config.json` 权限问题（沙箱/CI 环境），可设置环境变量 `ASTRO_TELEMETRY_DISABLED=1` 禁用遥测配置写入。
- Vercel 首次导入 GitHub 仓库时需安装 GitHub App；应选“Only select repositories”限制到目标仓库，并在 Deploy 前复核 monorepo Root Directory（如 `apps/site`）。
- project-1 的 `http://116.62.230.90:9999` 是 API 文档服务，不是业务 API；配置代理前应以实际接口（如验证码）验证目标，当前业务请求需保留 `/api` 前缀并转发到端口 80。
- project-2 迁移需保留 `vue-tsc --build` 验收：旧项目混用 JS API 与 TS 视图，要启用 `allowJs` 并显式标注空数组/对象状态类型；`postcss-pxtorem` 需配套类型声明，Sass 引入的 `@parcel/watcher` 安装脚本需在根 `allowBuilds` 单独许可。Vite 自动生成的声明文件不做 Prettier 格式化，避免每次 build 弄脏工作区。
- project-2 的 `VITE_AI_API_KEY` 不得填写共享真实密钥，Dashboard 中的 `VITE_*` 同样可能被打包；客户端已移除该变量读取并限制 `envPrefix`。商城代理只转发业务 Authorization，不转发 Vercel Cookie/内部头，不跟随重定向且禁用缓存；Vercel 到旧后端仍是 HTTP，不能视为端到端加密。
- project-2 的 JSON 接口成功不代表图片可加载：`shop-static.edu.koobietech.com` 返回 HTTP 图片地址，2026-08-27 实测 HTTPS 证书域名不匹配；由 `/shop-images/*` 固定来源代理提供图片，禁止转发凭据或代理 SVG/HTML。首页接口需隔离失败，避免一个公告请求失败让轮播图与商品一起消失；部署验收要实际检查图片及部分接口失败场景。
- project-2 共享 AI 的 `/api/ai` rewrite 必须在商城 `/api/:path*` 之前；Vite dev 不运行 Serverless，应直接兜底，不能把 prompt 发到商城。限流是实例内存计数，不是全局费用上限；真实 key 仅放服务端 `DEEPSEEK_API_KEY`。DeepSeek 已公告旧 `deepseek-chat` 名称停用，部署时显式配置有效模型，细节和验收边界见 project-2 README。
- site 视觉注释每页可能从 Comment 1 重新编号，报告需使用页面前缀并保留 URL、选择器及 CSS 视口；标记截图像素不等于 CSS 像素。删除范围以标记元素为准，不将首页技术栈/项目区或文章局部按钮的删除扩大到其他页面同名内容；静态截图也不能作为动效、移动端或改版验收通过的证据。
- site 的“首屏只展示名言”指主体内容，不默认移走顶部导航。滚动入场需按实际滚动位置采样，不能用静态终态证明先后顺序；按钮入场用独立 `translate` 属性，避免覆盖 hover 的 `transform`。不支持 CSS 视图时间线时保留可读内容；声明字体名不等于字体实际加载，本地得意黑接入需单独验证且不通过全局 `--font-quote` 扩大到未授权页面。
