# 任务看板

状态符号：`[ ]` 待认领 ｜ `[~]` 进行中 ｜ `[x]` 完成
格式：`- [ ] 任务 | owner: <AI名/人> | 验收: <怎么算完成>`

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

## project-2 功能修复（迁移后回归）

- [x] 旧项目 2 迁移后功能回归修复 | owner: Codex | 范围: 本轮用户注释对应的搜索清空、AI 建议兜底、地址列表顶栏限宽，以及另行授权的首页/两侧底色与 Production 服务端 AI 配置（见 DECISIONS）；不改路由/API 代理、不扩大至未标注组件 | 结果: 用户确认暂时没有新修改，要求提交收尾；清空按钮、过期建议保护、未知分类兜底、375px 地址顶栏及指定颜色均已实现，Production AI 接口已实测 200 和真实建议 | 验收: 最终 80 项测试、build/类型检查、改动文件格式检查通过；本地首页/分类/商品详情/购物车/我的/登录/注册已完成下述安全冒烟检查 | 边界: 完成标记表示本轮注释实现收尾，不代表全站所有按钮或真实交易链路均已验收；真机触屏、地址栏手机尺寸、有效账号登录/注册、非空购物车及提交订单、功能分支 Preview 待补验 | 分支: `feature/project-2-function-fix`（Claude Code 审查通过，已合并到 main）
  - 收尾本地复验（1018×779）：首页搜索入口正常，输入“茶叶”出现五条本地建议，鼠标点击清空后输入为空且建议面板消失；分类切换到美妆护肤后列表更新，商品可进入详情；购买弹窗可打开、切换 150ml/100ml、数量改为 2 并关闭，未加购/下单；购物车空态“去逛逛”返回首页；“我的 → 收货地址”入口正常，地址顶栏与内容同为 375px、左边界 321.5px，保持 fixed/top=0 且无横向溢出；登录/注册空表单提交均显示用户名/密码必填提示，两页往返正常。未创建账号、修改地址或执行真实交易；不是未标注按钮的全覆盖验收。
  - 用户另行指定的首页颜色例外（见 DECISIONS）：`https://project-2-liard-mu.vercel.app/home`，1018×779，首页 Comment 1 标记 `.home-page`，要求底色 `#F7F4F2`；首页 Comment 2 标记 `body`，两侧颜色以随后的“换成纯白”更正为准。仅将 Home.vue 的页面背景变量改为 `#f7f4f2`、main.css 的 body 背景改为 `#fff`，保留卡片、导航栏及其他页面内部配色。本地 1018×779 实测首页/两侧分别为 `rgb(247, 244, 242)` / `rgb(255, 255, 255)`，白色卡片保留，内容与 Tabbar 均为 375px，无横向溢出；80 项测试、build/类型检查通过。未发布此颜色改动。
  - 地址页 Comment 1：`https://project-2-liard-mu.vercel.app/address`，1018×779，`.addr-list > .van-nav-bar--fixed` 顶栏未匹配手机容器。线上几何断言复现顶栏宽 1018px、内容宽 375px；仅在 Address.vue 给列表固定顶栏添加共享宽度上限及左右自动居中，本地同一断言通过：顶栏与内容均为 375px、左边界均为 321.5px，保持 fixed/top=0，无横向溢出，三个标题/操作文本均在栏内。模板、业务逻辑、配色及新增/编辑页顶栏未改，未操作地址数据；80 项测试、build/类型检查通过。视口切换未实际生效，本条手机尺寸待补验；尚未合并或发布生产。
  - 搜索页 Comment 1：`https://project-2-s68heljei-aaronsblog.vercel.app/search`，1018×779，搜索框最右侧清空图标（截图区域 x=609.02、y=63.63、24.05×23.90）。真实鼠标点击后输入未清空；当前 Vant 原生图标只绑定 `touchstart`。仅在 Search.vue 为该图标补充捕获阶段的鼠标/笔 pointerdown，保留 Vant 触屏处理；清空时取消待发送 AI 防抖、重置建议，过期请求不可回填。本地同一鼠标断言及 375×667 视口通过，真机触屏尚未验证，不推广到其他页面。
  - 搜索页 Comment 2：同 URL、1018×779，`.search .ai-suggestion`。原部署 `/api/ai` 返回 503 / `AI service is not configured`；页面另有丢弃通用 fallback 的缺陷，已保留分类规则并接回通用建议，本地“茶叶”“输入”均显示五条可点击词条。用户随后授权 Production 配置，后台确认服务端变量原仅覆盖 Preview；已仅将 `DEEPSEEK_API_KEY`（Secret、不读取或重填明文）与 `DEEPSEEK_API_MODEL=deepseek-v4-flash` 扩展至 Production + Preview，不含 Development。Production 保留代码默认官方地址及每 IP 10 次/分钟、50 次/小时的实例内基础限流，未修改其余变量或代理。重部署已合并的 main@1b59883（`dpl_Gk2PesW98eGP3AsS9fwdiz5QGj7W`）Ready，新独立地址 `https://project-2-nemp0dxq6-aaronsblog.vercel.app`；生产域名 `https://project-2-liard-mu.vercel.app/api/ai` 实测 200、`error:null`、五条真实生成建议及 `no-store`。旧独立部署地址不自动获得新配置；新生产搜索页待用户登录后复验，清空/兜底代码仍在功能分支，未随此次生产重部署发布。

## site 后续调整（待 project-2 功能修复完成后启动）

- [x] Site 样式进一步调整 | owner: Codex（用户本轮指定） | 范围: 本轮点名的首页布局和样式，以及用户明确授权的介绍末尾去句号；不改内容模型、路由、文章数据或功能逻辑 | 结果: 用户要求按当前结果提交收尾；首屏名言/固定导航、滚动三角、收窄介绍区、三行右对齐/Aaron 放大、分隔线/纵排按钮、逐项入场及署名右下对齐已实现 | 验收: 最终 build 与改动文件格式检查通过；本地四页可访问，其他三页页头及主体留白未受影响；桌面/窄屏与动画采样见下方记录 | 边界: 完成标记仅表示本轮注释实现收尾，不代表真机、所有浏览器、减少动态效果模式或线上 Preview 已验收；本地字体和未确认措辞另行处理 | 分支: `feature/site-style-polish-round2`（已合并到 main@4a79e62）
- [~] Site 样式第三轮注释驱动微调 | owner: Codex（用户本轮指定） | 范围: 仅按用户在线注释调整 `apps/site` 的样式与布局；不改内容模型、路由、文章数据、功能逻辑、字体加载策略与全局设计决策 | 验收: `pnpm --filter site build` 与改动文件格式检查通过；本地 `/`、`/projects`、`/posts`、`/posts/hello-blog` 四页可访问，用户标注的视口/页面回归通过，未标注页面与组件不受影响 | 边界: 仅实现用户明确标注的注释，不擅自扩大至未点名页面、组件或文案；真机、线上 Preview、减少动态效果模式待补验 | 分支: `feature/site-style-polish-round3`
  - 首页口述需求 1：线上 `https://aaron-site-4unei3wci-aaronsblog.vercel.app/`，用户要求首屏只显示名言与底部倒三角，下滑后个人介绍从左、双按钮从右进入并左右排列，替代 v3 单屏要求（见 DECISIONS）。仅修改 index.astro 与 Hero.astro 的布局包装和 CSS，首页导航按用户后续纠正始终 fixed 于视口顶部，首屏与下滑 728.5px 时均实测 top=16px；CSS 视图时间线控制左右入场，保留现有名言轮播脚本、文案、数据与链接。桌面 1280×720 / 1066×779 下已核对首屏边界、滚动中间态的相反方向位移及最终左右排列；375×667 / 320×568 首屏完整、第二段上下排列且无横向溢出。最终 build 与改动文件格式检查通过；本地 `/projects`、`/posts`、`/posts/hello-blog` 可访问，共享页头仍为 sticky、主体留白未受首页覆盖影响。减少动态效果与不支持滚动时间线时采用静态展示；未实测这些浏览器/系统模式，也未验真机 Safari 或本分支线上 Preview。用户尚未确认效果，不标记整轮完成。
  - 首页浏览器 Comment 1–3：`http://localhost:4323/`，1066×779，依次标记 `.hero-intro`、`.hero-desc`、`.hero-actions`。介绍容器收窄为最大 880px 并居中，桌面实测左右外边距各 89px；原文先拆成三个纵向文本块，Aaron 放大至 42.64px（其余文字 19.2px）；双按钮改为等宽上下排列。375×667 / 320×568 下外边距各 24px，按钮同宽对齐且无横向溢出，导航仍固定顶部；轮播脚本、名言数据与链接未改，build/格式检查通过。Comment 2 的完整新文案替换涉及内容变更，依开工约定已询问确认；用户后续明确要求去句号，已仅删除三处句号，“一个计算机新人”的措辞替换仍未确认。
  - 首页倒三角 Comment 1（后续批次）：`http://localhost:4323/`，1066×779，截图区域 x=513.52/y=714.76/34.88×32.99 对应 `.scroll-cue`。原三角随页面正常滚动，但第二段较短，滑到底仍露在顶部；仅为三角增加基于首屏退出进度的上移 64px 与淡出，不改页面高度、导航或介绍区。实测首屏 opacity=1/位移=0，下滑 150px 时处于上移淡出中间态，到底 728.5px 时 opacity=0 且底边为 -41.5px，返回首屏恢复；build 与格式检查通过。减少动态效果时只淡出、不额外位移；不支持视图时间线的浏览器保留原静态提示，未做跨浏览器复验。
  - 首页右对齐/分隔线 Comment 1–2（后续批次）：`http://localhost:4323/`，1066×779，分别标记 `.hero-desc` 与 `.hero-intro`。按明确新注释删除介绍三句末尾句号，其余措辞保留；介绍右对齐，纵排双按钮与文字分别距 1×160px 细竖线约 32px，内容组合在 880px 容器内居中。768×800 保留双栏，窄屏上下排列并用 1px 横线分隔；320×568 按钮等宽、无横向溢出。保留固定导航、Aaron 字号与入场/倒三角动画；轮播脚本、名言数据、目标链接未改，build 与格式检查通过，用户目检待确认。
  - 首页入场/署名 Comment 1–3（后续批次）：`http://localhost:4323/`，1066×779，标记 `.hero-desc`、`.hero-actions`、`.quote-author`。将整组入场拆为各文本行与按钮的 CSS 视图时间线动画，第一项/第二项/第三项依次使用 entry 30–65% / 42–77% / 54–89%，保留文字从左、按钮从右。下滑 230px 时第一项已开始而后续仍透明；330px 时三句透明度为 0.656/0.313/0，两个按钮为 0.656/0.313；630px 时五项均完全显示。入场改用 translate 属性，实测悬停的 transform 上移 2px 仍生效，键盘聚焦显示保护已同步到子项。名言块按文字宽度居中，署名放在其右下角；桌面与 320px 下七条署名右边界均与各自名言块对齐，未溢出。build/格式检查通过，轮播脚本、数据、链接未改，仍待用户目检及整轮收尾。
- [x] 首页名言得意黑本地托管 | owner: OpenCode | 依赖: `feature/site-style-polish-round2` 合并且工作区干净 | 范围: 官方 WOFF2 与许可证入库，首页专用字体加载，不扩散到作者、介绍、按钮或其他页面；不改轮播机制 | 结果: SmileySans-Oblique v2.0.1 WOFF2（1.1MB）与 SIL OFL 1.1 许可证、来源 README 入库 `public/fonts/`；global.css 新增本地 @font-face（`font-weight: 400 800`、`font-display: swap`），Hero.astro 新增首页专用 `--font-quote-home` 仅作用于 `.quote-text`，全局 `--font-quote`、CDN 声明、轮播机制、名言数据、署名/介绍/按钮均未改 | 验收: `pnpm --filter site build` 通过；Playwright 实测首页唯一字体请求为站内 `/fonts/SmileySans-Oblique.woff2`、无 jsdelivr 请求，document.fonts 显示本地字体 loaded 且全局 CDN 字体保持 unloaded；320×568 下 7 条名言全部无溢出（最长名言块 272px、两侧各留 24px）、无内部换行溢出、署名右边界与名言块偏差 0、页面无横向滚动；375×667 特写目检确认为得意黑右倾斜体字形，署名/介绍计算字体仍为系统字体；/projects、/posts、/posts/hello-blog 三页均 200、无横向溢出、`Smiley Sans Oblique` 元素引用为 0 且字体未下载，首页字体未泄漏 | 边界: 未验真机 Safari、线上 Preview、减少动态效果模式及全部浏览器；/projects 的 jsdelivr CDN 字体在本地沙箱网络受限下请求失败回退楷体，属原有声明的环境现象，与本次改动无关 | 分支: `feature/site-local-smiley-sans`（已合并到 main@df5326b）
- [x] Site Hero 入场动画兼容性修复 | owner: zcode (GLM 5.3 Flash) | 范围: 仅 `apps/site/src/components/Hero.astro`，把介绍/按钮入场从 CSS 视图时间线改为 IntersectionObserver + 等效 delay 的 CSS 时间动画；不动其他页面/组件/global.css | 结果: 保留三句从左、双按钮从右方向与 `--entry-offset`，按原 entry 30–65%/42–77%/54–89% 节奏换算为 0.7s/项 + 0.24s 错开 delay；组件内联脚本在解析期给 `<html>` 标记 `hero-js`，`.hero-intro` 进入视口约 25%（rootMargin 底部 -25%）时 observer 加 `is-entered` 播放一次并断开，`focusin` 提前触发；无 JS、减少动态效果、键盘提前聚焦（`:not(.is-entered):focus-within`）三条静态兜底保留；倒三角 scroll-away 时间线与名言轮播脚本未改 | 验收: `pnpm --filter site build` 通过；preview 构建 Chrome 146 实测——初始 5 项 opacity 0，滚动触发后采样证实 span -180px→0、btn +180px→0、240ms 错开、约 1.2s 全部到位且终态保持；移除 `hero-js` 即静态可见；聚焦按钮瞬间可见、随后动画接管完成；375×667 动画完成后无横向溢出（scrollWidth 367≤375），轮播切换、固定导航、倒三角浮动截图正常；`/projects` `/posts` `/posts/hello-blog` 均 200 | 边界: 未验真机 Safari/Firefox 及系统"减少动态效果"模式（降级由 `no-preference` media 门控 + JS 提前返回 + 全局 reduce kill-switch 三重结构保证，IAB 无法模拟系统偏好）；发现既有问题——生产构建的 CSS 压缩把倒三角 `animation-timeline: --home-quote` 合并进 `animation` 简写致 Chrome 丢弃该声明（dev 正常；main 产物与本分支逐字一致，非本次引入），已记入 AGENTS.md Gotchas，留待后续任务修复 | 分支: `feature/site-hero-entry-animation`（已合并到 main@1463712）
- [x] Site 首页倒三角 scroll-away 生产构建修复 | owner: zcode (GLM 5.3 Flash) | 范围: 仅 `apps/site/src/components/Hero.astro` 的 `.scroll-cue` 倒三角淡出块；不改名言轮播、Hero 入场动画、布局或响应式 | 结果: 采用方向 1（IntersectionObserver + CSS 时间动画，与 Hero 入场同款）：删除 `@supports` 内 `--home-quote` 视图时间线、`animation-range` 与 `cue-scroll-away` 滚动关键帧及 reduce 块失效的 `--cue-scroll-offset`，新增 `setupScrollCue()`（观察 `.quote-screen`、threshold 0.9、跨阈值 toggle `.is-away`），`.scroll-cue` 在既有 `no-preference` 媒体块内用 0.5s opacity/transform 过渡实现上移 4rem 淡出并随回顶自动反向恢复；方向 2（仅调整声明写法躲压缩器）未采用，压缩器未来换合并路径会静默复发，结构性移除滚动时间线才能根除 | 验收: `pnpm --filter site build` 通过；产物 `dist/_astro/*.css` 无任何 `animation-timeline`/`view-timeline` 声明、不存在简写合并风险，`transition`、`.is-away`、`cue-float`、`intro-enter`、`hero-js` 预隐藏声明全部存活且 `.is-away` 位于 `no-preference` 块内；基线构建先复现了 Gotcha 所述合并产物 `animation:linear both cue-scroll-away --home-quote`；preview 构建（4324，Chrome 146）滚动采样——顶部 opacity 1/无位移，150px（ratio 0.807）触发后 opacity 0、translateY -64px，过渡中间态 opacity 0.667/-21px 证实真动画，400px 与页底 728.5px 持续隐藏，回顶恢复 opacity 1/无位移；新起 dev（4321，陈旧 dev 进程已重启）同一套采样与生产一致（fixed header、qsTop 0、maxScroll 728.5）；无 JS（移除 hero-js 模拟）cue 静态可见且 `cue-float` 保留、介绍文字可见；名言轮播 4.5s 间隔采样 active 2→3→4 正常，入场五项 630px 处 opacity 1/translate 0 不受影响；改动文件 Prettier 检查通过 | 边界: 不扩大至未点名动画/组件；真机 Safari/Firefox 及系统"减少动态效果"模式未实测（降级由 JS 提前返回 + `no-preference` 媒体门控 + global.css reduce kill-switch 三重结构保证）；倒三角由 scroll-linked 渐隐改为阈值触发的时间过渡（首屏约 10% 退出触发、0.5s 播放、可逆），装饰元素（aria-hidden）行为近似可接受；首次加载曾在页底采到一次过渡中 opacity 0.588 的瞬态，带观测复现两轮未再现、终态始终正确 | 分支: `feature/site-triangle-scrollaway-fix`（已合并到 main@df5a90f）
- [x] Site projects 页补充 project-2 在线预览链接 | owner: Codex（用户指定） | 范围: 仅 `apps/site/src/pages/projects.astro` 中拾光集移动商城卡片的 `previewLink`；不改卡片样式、布局、首页 FeaturedProjects 或其他页面 | 结果: `previewLink` 由 null 改为 `https://project-2-liard-mu.vercel.app`，复用现有双按钮模板 | 验收: `pnpm --filter site build` 与改动文件 Prettier 检查通过；本地 dev `http://localhost:4321/projects` 两张卡片均显示在线预览/查看源码，project-2 预览 href 正确且 `target="_blank"`、`rel="noopener noreferrer"`，点击后新标签页打开生产 `/home`（标题“拾光集 · Mobile Shop”）；project-1 双按钮及链接保持原样；`/`、`/posts`、`/posts/hello-blog` 均 HTTP 200，1280×720 浏览器目检布局正常，四页均无横向溢出 | 边界: 本轮仅验链接与桌面页面回归，不含商城业务链路、真机或本分支线上 Preview | 分支: `feature/site-project2-preview-link`（已合并到 main@53b019e）
- [x] Site 功能小改动 | owner: OpenCode | 依赖: project-2 功能修复完成 | 范围: 首页名言随机起始并按顺序循环、首屏 1.2s 淡入、预加载本地得意黑并等待字体就绪后再显示，避免楷体 fallback 闪切；不改视觉样式与内容模型 | 验收: `pnpm --filter site build` 通过，改动文件格式检查通过，无回归 | 分支: `feature/site-quote-random-fade-font`

## 紧急 — 国内访问修复

- [ ] Vercel 项目国内访问恢复（自定义域名方案） | owner: 用户（购买域名）+ OpenCode（配置） | 依赖: 用户购买域名、Vercel 免费部署配额恢复 | 范围: 为 site / project-1 / project-2 配置自定义域名，DNS CNAME 指向 `cname-china.vercel-dns.com.`，验证大陆网络可访问；不改动代码 | 验收: 国内无 VPN 环境下三个项目首页均可正常打开；site 最终需部署最新 main（当前因配额未更新） | 分支: 待创建

## Phase 4 — 收尾

- [x] Site 生产视觉审计与用户注释整理 | owner: Codex | 范围: 覆盖 `/`、`/projects`、`/posts`、`/posts/hello-blog`，整理为 `apps/site/docs/VISUAL_AUDIT.md`，供 Antigravity 制定 DESIGN.md v3；未改样式、组件、页面代码或 DESIGN.md | 结果: 四页 19 条注释全部整理，含原话/定位/事实/优先级/建议/验收口径、跨页边界与交接提示词；头像源文件已只读核验，复制留给 Antigravity；同步任务/进度与审计 Gotcha | 交接: 本审计分支提交推送后交 Claude Code 文档审查，再由 Antigravity 制定 v3、用户确认后实施；不代表改版验收完成 | 分支: `feature/site-visual-audit`
- [ ] 全站 Lighthouse 走查（性能/SEO/无障碍） | owner: claude-code review + 用户拍板 | 验收: 四项 ≥ 90
- [ ] 各 AI 把踩坑写进 AGENTS.md 的 Gotchas | owner: 全体 | 验收: 至少各 1 条
