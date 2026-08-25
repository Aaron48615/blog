# 记忆总目录

> 作用：让所有 AI 快速定位项目记忆点。先看本目录，再跳转到对应分册的详细章节。
> 维护要求：新增/修改记忆点时，必须同步更新本目录。

## 项目总纲
| 主题 | 一句话摘要 | 详细位置 |
|---|---|---|
| 项目是什么 | 个人站 + 两个旧项目的 pnpm monorepo | `AGENTS.md` > 这是什么 |
| 技术栈与命令 | pnpm workspace、Astro、纯静态构建 | `AGENTS.md` > 技术栈与命令 |
| 部署方式 | Vercel，每个 app 一个 project，Root Directory 指向 `apps/<app名>` | `AGENTS.md` > 部署 |
| 四 AI 分工 | Codex=逻辑/结构/部署，Antigravity=视觉，OpenCode Go=内容/迁移/杂活，Claude Code=review | `AGENTS.md` > 协作规则 |
| 收工汇报格式 | 必须口头汇报：完成了什么、下一步可做什么、建议交给谁做 | `AGENTS.md` > 协作规则第 6 条 |
| 记忆文档体系 | AGENTS.md 为总纲，docs/ 下为分册，所有 AI 共同维护 | `AGENTS.md` > 记忆文档体系 |
| 踩坑记录 | pnpm 11 的 `allowBuilds` 必须写在根目录 `pnpm-workspace.yaml` | `AGENTS.md` > Gotchas |

## 决策记忆
| 主题 | 一句话摘要 | 详细位置 |
|---|---|---|
| monorepo + pnpm workspace | 2026-08-25 已定 | `docs/DECISIONS.md` |
| 部署平台：Vercel | 2026-08-25 已定 | `docs/DECISIONS.md` |
| AGENTS.md 为唯一记忆源 | 2026-08-25 已定 | `docs/DECISIONS.md` |
| 四 AI 分工 | 2026-08-25 已定 | `docs/DECISIONS.md` |
| 纯静态构建 | 2026-08-25 已定 | `docs/DECISIONS.md` |
| apps/site 用 Astro | 2026-08-26 用户确认 | `docs/DECISIONS.md` |
| 旧项目源目录 | project-1=data-pilot，project-2=mobile-shop | `docs/DECISIONS.md` |

## 任务记忆
| 主题 | 一句话摘要 | 详细位置 |
|---|---|---|
| Phase 1 任务列表 | site 脚手架、lint/format、Vercel 绑定 | `docs/TASKS.md` > Phase 1 |
| Phase 2 任务列表 | 两个旧项目迁移 | `docs/TASKS.md` > Phase 2 |
| Phase 3 任务列表 | 视觉打磨、项目展示、关于页 | `docs/TASKS.md` > Phase 3 |
| Phase 4 任务列表 | Lighthouse 走查、Gotchas 补充 | `docs/TASKS.md` > Phase 4 |

## 进度记忆
| 主题 | 一句话摘要 | 详细位置 |
|---|---|---|
| 初始化 monorepo 骨架 | 2026-08-25 OpenCode | `docs/PROGRESS.md` |
| site Astro 脚手架三页 | 2026-08-26 OpenCode | `docs/PROGRESS.md` |

## 派活模板
| 主题 | 一句话摘要 | 详细位置 |
|---|---|---|
| 给 Codex / Antigravity / Claude Code 的标准 prompt | 开场白 + 六段式结构 | `docs/PROMPTS.md` |
