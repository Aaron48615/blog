# 任务看板

状态符号：`[ ]` 待认领 ｜ `[~]` 进行中 ｜ `[x]` 完成
格式：`- [ ] 任务 | owner: <AI名/人> | 验收: <怎么算完成>`

## 待用户确认（当前阻塞，新会话接手先看这里）

> apps/site DESIGN.md v3 规范制定与全站样式重构已全部完成，pnpm --filter site build 与 19 条注释逐条验收通过；待交 Claude Code review 并由用户/OpenCode 合并 feature/site-design-v3。

## Phase 1 — 脚手架与部署管线

- [x] apps/site Astro 脚手架 + 基础布局（首页/关于/项目列表） | owner: OpenCode Go | 验收: `pnpm --filter site dev` 可跑，三页可访问
- [x] 根目录格式化与 lint 配置（Prettier + 各 app 自带 lint） | owner: Codex | 验收: 全仓库 `pnpm format` 通过
- [x] Vercel 绑定：site 先上线（Hello World 即可） | owner: Codex | 验收: push main 自动部署，域名可访问

## Phase 2 — 旧项目迁移

- [x] 旧项目迁移评估（技术栈/依赖/第三方 API/迁移步骤/环境变量） | owner: OpenCode Go | 验收: `docs/MIGRATION_PLAN.md` 已包含全部信息
- [x] 旧项目 1 迁入 `apps/project-1`（来源：`/Users/aaron/LoveCoding/21_React/高阶/data-pilot`） | owner: Codex | 依赖: docs/MIGRATION_PLAN.md、API 路由方案确认（方案 B：Vercel rewrites） | 验收: build/test/lint 通过，Vercel 预览首页与深层路由可访问，`/api/auth/captcha` 调用正常
- [x] 旧项目 2 基础迁移至 `apps/project-2`（来源：`/Users/aaron/LoveCoding/20_Vue3/mobile-shop`） | owner: Codex | 范围: 源码清理、pnpm workspace 依赖整合与本地构建；不含 API 代理和部署 | 验收: 根目录冻结锁文件安装、强制类型检查、`pnpm --filter project-2 build` 通过，无真实 AI 密钥与垃圾文件入库；project-1 build/22 项测试及 site build 回归通过 | 分支: `feature/migrate-project-2-base`（待 Claude Code 审查）
- [x] 旧项目 2 API 代理与 Vercel 部署（第二段） | owner: Codex | 范围: 商城/图片代理、SPA 回退、首页失败隔离与重试；共享 AI 服务端代理未在本轮实现 | 验收: Vercel 预览首页与深层路由可访问、图片正常，第三方 API 调用正常，无真实 AI 密钥打入前端产物 | 分支: `feature/migrate-project-2-deploy`（已合并）
- [x] 旧项目 2 共享 AI 服务端代理 | owner: Codex | 依赖: project-2 部署已合并、用户已明确本轮匿名 IP 限流范围 | 验收: `/api/ai` 服务端代理、前端无 key、双窗口基础限流/输入限制/头过滤/错误脱敏及本地兜底已实现；63 项测试、build、92 文件假密钥产物检查通过；Claude Code 审查通过并已合并至 main；Vercel Preview 配置真实 key 与 `deepseek-v4-flash` 后，搜索联想与卖点生成功能联调通过 | 分支: `feature/project-2-ai-proxy`（已合并）
- [x] 两个项目各自的 Vercel project 绑定 | owner: 用户 | 进度: project-1/project-2 均已绑定 | 验收: push main 自动部署
- [x] project-2 桌面端 375px 手机比例展示 | owner: Codex | 范围: rem 封顶、全局居中容器及固定栏宽度，保留业务逻辑/路由与 postcss rootValue | 验收: build/类型检查、71 项测试与改动文件格式检查通过；首页/分类/购物车/我的在 1280/376/375/320px 四种视口下内容与 Tabbar 对齐、无横向滚动；首页图片正常，桌面与 375×667 元素尺寸一致 | 边界: 购物车仅验空态，非空结算栏及真机/线上布局待补验，详见 project-2 README | 分支: `feature/project-2-desktop-mobile-ratio`（已合并，main@8cbe0ac）
- [x] project-2 页面注释驱动的样式微调 | owner: Codex（用户本轮指定） | 范围: 仅调整用户标注的 apps/project-2 样式与布局，不改业务逻辑/API/路由，不扩大至未点名页面或组件 | 结果: 登录/注册移除桌面缩窄与厚边框，购买弹窗适配手机容器且保留动画，首页底色改为米色；用户已确认“样式没有问题了” | 验收: 71 项测试、build/类型检查及改动文件格式检查通过；首页/分类/购物车/我的在 1018×779、375×667、320×568 共 12 组浏览器几何断言通过，内容和 Tabbar 对齐、无横向滚动；登录/注册及购买弹窗的三档视口与动画复验记录见本任务及进度日志；任务/进度文档和 app Gotcha 已同步 | 边界: 购物车只验空态，未加购/下单；未验真机 Safari/软键盘及本分支线上 Preview | 分支: `feature/project-2-visual-polish`（用户目检通过，待 Claude Code review，再交 OpenCode/用户合并）
  - 登录页 Comment 1：线上 main@8cbe0ac 的 `/login`，1018×779，标记 `.auth-shell`；按用户要求同步注册页。删除两页 768px 桌面样式覆盖，主体在 1018/375/320px 视口下宽度为 375/375/320px，登录↔注册入口正常，用户目检通过。
  - 商品详情 Comment 1：`http://127.0.0.1:5173/prodinfo?ids=78`，1018×779，标记 `.purchase-sheet .content`。修复前真实浏览器几何断言失败（弹窗 1018px、内容区 375px）；只为 `.purchase-sheet` 增加宽度上限与左右自动居中后，同一断言通过。1018×779、375×667、320×568 下弹窗宽度分别为 375/375/320px，商品卡片/规格/数量/双按钮无横向溢出，开关动画采样保持水平位置不变。布局回归由真实浏览器断言验证，现有 Node 测试不覆盖浏览器布局；保留全屏遮罩及未标记的分类弹窗，不执行加购或下单。
  - 首页 Comment 1：`http://127.0.0.1:5173/home`，1018×779，标记 `.home-page`。核对源码历史与实际颜色，首页原为暖灰 `#f7f5f2`，不是前面几轮改成白色；按用户优先方案将首页局部背景变量改为项目已有米色 `#f3eee6`，保留白色卡片、两侧 `#f5f5f5` 留白及其他页面配色。桌面与 375/320px 手机视口实测新色生效、宽度正常且无横向滚动；71 项测试与 build/类型检查通过，用户目检通过。

## Phase 3 — 个人站内容施工

- [x] 首页视觉打磨（Hero、动效、配色定案） | owner: antigravity | 验收: 用户目检通过，Lighthouse 性能 ≥ 90
- [x] 项目展示页：嵌入 project-1 / project-2 的链接与介绍 | owner: OpenCode Go | 验收: 从个人站可跳转两个项目
  - [x] 关于页 + 联系方式 | owner: 用户 | 验收: 内容真实可发布

## Phase 3.5 — 博客结构改造

- [x] Site 博客结构改造（内容模型/路由/项目信息/名言数据） | owner: OpenCode | 验收: 四页路由 /,/posts,/posts/[slug],/projects 可访问、Content Collections 正常、项目页双按钮无内部路径、build 通过
- [x] Site 视觉重设计与动效实现（官网风居中Hero、名言3.5s渐变轮播、项目双卡片独立跳转、文章双栏与动态目录） | owner: Antigravity | 验收: 四页视觉现代精致、名言淡入淡出轮播正常、移动端响应良好、build 通过

## Phase 3.6 — 网站视觉规范与重做（v3 已完成）

- [x] Site 视觉规范制定与基于 DESIGN.md 重做 (v2) | owner: Antigravity | 验收: DESIGN.md 经用户确认，重构为 Vestris 调色板与精简双栏 | 分支: feature/site-design-system
- [x] Site 视觉规范 DESIGN.md v3 制定与全站重构 | owner: Antigravity | 范围: 基于 VISUAL_AUDIT.md 19 条注释制定 v3 规范、复制头像入库、重写四页样式与动效 | 验收: 得意黑艺术字+楷宋兜底、1.2s淡入淡出+4s停留、头像素材复用、四页样式重写与单屏例外落实，pnpm --filter site build 通过，19 条注释逐条验收 | 分支: feature/site-design-v3

## Phase 4 — 收尾

- [x] Site 生产视觉审计与用户注释整理 | owner: Codex | 范围: 覆盖 `/`、`/projects`、`/posts`、`/posts/hello-blog`，整理为 `apps/site/docs/VISUAL_AUDIT.md`，供 Antigravity 制定 DESIGN.md v3；未改样式、组件、页面代码或 DESIGN.md | 结果: 四页 19 条注释全部整理，含原话/定位/事实/优先级/建议/验收口径、跨页边界与交接提示词；头像源文件已只读核验，复制留给 Antigravity；同步任务/进度与审计 Gotcha | 交接: 本审计分支提交推送后交 Claude Code 文档审查，再由 Antigravity 制定 v3、用户确认后实施；不代表改版验收完成 | 分支: `feature/site-visual-audit`
- [ ] 全站 Lighthouse 走查（性能/SEO/无障碍） | owner: claude-code review + 用户拍板 | 验收: 四项 ≥ 90
- [ ] 各 AI 把踩坑写进 AGENTS.md 的 Gotchas | owner: 全体 | 验收: 至少各 1 条
