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
- 2026-08-27 | OpenCode | 合并 feature/site-visual 至 main（含 647a15a 修复：删除未使用 Highlights 组件、修复未闭合标签与重复声明）；删除 feature/site-blog-structure、feature/site-visual 已合并分支 | main@b25c322
- 2026-08-27 | Codex | 将 mobile-shop 源码迁入 apps/project-2，排除真实 AI 密钥、旧 dist、npm 锁文件、备份与调试垃圾；统一 pnpm 依赖，补充 @parcel/watcher 构建许可和 postcss-pxtorem 类型，修复 JS/TS 混用、视图状态及 Axios 类型问题；冻结锁文件安装、强制类型检查、project-2 build、格式检查及密钥检查通过，project-1 build/22 项测试、site build 回归通过；未处理 API 代理与 Vercel 部署，待 Claude Code 审查 | feature/migrate-project-2-base
- 2026-08-27 | Codex | 开始 project-2 部署阶段：新增固定上游的 Serverless 商城代理、同源 `/api` 和 SPA 回退，移除前端共享 AI key 读取；11 项代理测试与 build 通过，旧后端 `/indexImgs` 实测成功；Vercel 预览验收与环境配置进行中，真实 AI 密钥配置因安全冲突待用户确认 | feature/migrate-project-2-deploy
- 2026-08-27 | Codex | 推送商城代理实现，Vercel 预览 `project-2-n17vpv11p-aaronsblog.vercel.app` 构建成功；11 项测试、build、格式及假密钥产物检查通过，实际代理函数本地调用成功；线上 API 被 Deployment Protection 302 重定向至 SSO，Dashboard 导航持续超时，页面/接口在线验收与 Production 环境配置未完成，未关闭保护或上传真实 key，待用户完成访问验证并确认 AI 方案 | feature/migrate-project-2-deploy@d1740b5
- 2026-08-27 | Codex | 用户确认旧预览接口正常但页面缺图；复现静态图片域名 HTTPS 证书不匹配（HTTP 可返回 JPEG），增加固定来源、无凭据、限图片格式/4 MiB 的图片代理及 axios 图片地址转换；测试复现并修复首页单接口失败拖累全部数据，增加分区错误与重试；25 项测试、build、本地 3 个真实接口与 15 张图片通过，线上页面尚未复验，Production/AI 配置仍待确认 | feature/migrate-project-2-deploy
- 2026-08-27 | Codex | 图片修复预览 `project-2-c0me2ahv2-aaronsblog.vercel.app` 部署成功；线上只读验收 `/`、`/cart`、`/myorder` 的应用 HTML、2 个入口 JS 资源、3 个首页业务接口和 15 张真实 JPEG/PNG 图片均通过；假密钥产物检查通过（92 个文件），工作区代码已推送；已请求打开新预览并保留用户标签页，登录后渲染仍待用户目检，未修改 Production 环境变量或部署保护 | feature/migrate-project-2-deploy@921a205
