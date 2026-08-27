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
- 2026-08-27 | Codex / 用户复验 | 用户在新预览反馈“现在能加载出来了”，记录缺图修复后的页面加载确认；准备交 Claude Code 审查现有代码与预览，不推断下单/支付等功能已验收；Production 环境变量与共享 AI 安全方案仍待确认，任务保持进行中，未合并 main | feature/migrate-project-2-deploy（代码 921a205，既有验收记录 3d8c061）
- 2026-08-27 | OpenCode | 经 Claude Code 审查通过，合并 feature/migrate-project-2-deploy 至 main；删除已合并分支；本轮不含共享 AI 服务端代理，该任务拆分为下阶段 | main@a1031da
- 2026-08-27 | Codex | 先单独提交 OpenCode 的任务认领改动；实现 `/api/ai` 服务端 DeepSeek 代理、前端同源调用、实例内 IP 双滚动窗口限流、输入/模型限制、超时及错误脱敏，保留本地兜底并隔离 Vite 商城代理；63 项测试、类型检查/build、格式及 92 文件双假密钥产物扫描通过，本地开发 AI 路由实测 404 兜底；代码推送后 Vercel 预览 `project-2-7gqyu3q0d-aaronsblog.vercel.app` 构建成功，线上 GET 405 / POST 503 未配置响应及 no-store 验证通过；已说明旧模型名停用、匿名服务及非全局配额边界，真实 key 的 Preview 联调及浏览器页面复验尚未完成，未修改 Production 环境或关闭部署保护 | feature/project-2-ai-proxy@f4bcf11（认领提交 813c41b）
- 2026-08-27 | OpenCode | 经 Claude Code 审查通过，按用户选择先合并 `feature/project-2-ai-proxy` 至 main；删除已合并分支；真实 key 与有效模型的 Preview 联调待用户配置后复验，任务仍保持进行中 | main@01bea21
- 2026-08-27 | 用户 / OpenCode | 在 Vercel Preview 配置 `DEEPSEEK_API_KEY` 与 `deepseek-v4-flash` 后，实测 `https://project-2-8x2btjqyq-aaronsblog.vercel.app/api/ai` 的搜索联想与卖点生成功能正常返回 AI 文案；任务验收完成 | main@4afac82
- 2026-08-27 | Antigravity | 完成 apps/site Phase 3.6 视觉规范重做：输出 DESIGN.md 经用户确认，按 Vestris.ai 温润骨白（#F2EFE5）与深松墨绿（#233426）重构 global.css、BaseLayout、Hero、FeaturedProjects 及四页，加入两侧动态微风枝叶景深遮罩（纯 CSS 零 JS），文章页精简为左侧粘性边栏（TOC Scrollspy/Profile）+右侧主体双栏结构，旧配色彻底清除，全站静态构建通过 | feature/site-design-system
- 2026-08-27 | Antigravity | 完成 apps/site Phase 3.6 审查收尾修复：清理 global.css 未使用变量与 DESIGN.md 规范说明、修复文章页 TOC Scrollspy 高亮基准、调整项目 02 按钮与 previewLink 条件渲染、优化 Hero 轮播指示器 ARIA 语义，静态构建通过 | feature/site-visual-polish
- 2026-08-28 | Codex | 从最新 main 创建视觉审计分支，核对 site 生产部署记录；将用户首页 6 条注释整理为 VISUAL_AUDIT.md 草稿，记录原话、定位、分类、建议与验收边界，保留单屏与大字体的可访问性风险；文章列表/详情及项目页待收集，未修改代码或 DESIGN.md，尚未提交推送 | feature/site-visual-audit
- 2026-08-28 | Codex | 追加文章列表 7 条注释至视觉审计草稿（累计 13 条），区分共享页头头像/品牌名与侧栏局部精简要求；只读核验指定头像 JPEG 存在及尺寸，素材复制留给 Antigravity；请求打开项目页继续收集，文章详情尚待覆盖，未改代码或复制图片，尚未提交推送 | feature/site-visual-audit
- 2026-08-28 | Codex | 追加项目页 5 条注释至视觉审计草稿（累计 18 条）：删页头徽章、标题改“练手项目”、副标题换斜体诗句、删两张卡片编号摘要行；明确保留下方技术栈与按钮，核对具体文章路由并请求打开 `/posts/hello-blog` 收集最后一页，未改代码或 DESIGN.md，尚未提交推送 | feature/site-visual-audit
- 2026-08-28 | Codex | 收齐文章详情文末双按钮删除意见，完成四页 19 条视觉审计报告，补齐跨页归并、优先级、风险边界、后续验收与 Claude Code / Antigravity 交接提示词；同步任务与审计 Gotcha，交付仅含 Markdown 文档，未改代码、DESIGN.md 或复制头像，不合并 main | feature/site-visual-audit
- 2026-08-28 | Antigravity | 完成 apps/site DESIGN.md v3.0.0 制定：基于 VISUAL_AUDIT.md 19 条用户注释明确用户硬性约束与 Antigravity 设计建议（名言艺术字选型/1.2s淡入淡出与6.0s停留/单屏极简与短屏例外/头像素材入库）；复制 /Users/aaron/avatar.jpg 至 apps/site/public/avatar.jpg；输出 implementation_plan 待用户确认后再行实施 | feature/site-design-v3
