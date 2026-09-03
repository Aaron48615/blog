# 踩坑记录

所有 AI 开工前必须读取本文件。完成任务后如发现新的可复用踩坑，追加在末尾；不要再把高频记录写回根 `AGENTS.md`。

- pnpm 11 的 `allowBuilds` 必须写在根目录 `pnpm-workspace.yaml`；旧版 `onlyBuiltDependencies` 与 `package.json` 里的 `allowScripts` 已失效。esbuild 等带 native binary 的包若被忽略构建脚本，会触发 `ERR_PNPM_IGNORED_BUILDS`。
- `pnpm-lock.yaml` 应加入 `.prettierignore`，锁文件交给 pnpm 序列化；Prettier 会产生数千行无语义 diff。
- Astro 构建时如遇到 `~/Library/Preferences/astro/config.json` 权限问题（沙箱/CI 环境），可设置环境变量 `ASTRO_TELEMETRY_DISABLED=1` 禁用遥测配置写入。
- Vercel 首次导入 GitHub 仓库时需安装 GitHub App；应选“Only select repositories”限制到目标仓库，并在 Deploy 前复核 monorepo Root Directory（如 `apps/site`）。
- project-1 的 `http://116.62.230.90:9999` 是 API 文档服务，不是业务 API；配置代理前应以实际接口（如验证码）验证目标，当前业务请求需保留 `/api` 前缀并转发到端口 80。
- project-1 外部 HTTP rewrite 曾出现超时观测，但 2026-08-29 用户用线上部署对照确认：旧部署 934c3a2 的 rewrite 可刷新验证码并登录，Serverless `api/[...path].ts` 版本在 main Branch URL 与自定义域名无法刷新验证码，因此已回滚为 `/api/:path*` → `http://116.62.230.90/api/:path*`。后续若再出现超时，应先保留可用 rewrite，并分别量化直连上游与同源代理，不要未经 Branch Preview 在线登录验证就替换生产代理。
- project-2 迁移需保留 `vue-tsc --build` 验收：旧项目混用 JS API 与 TS 视图，要启用 `allowJs` 并显式标注空数组/对象状态类型；`postcss-pxtorem` 需配套类型声明，Sass 引入的 `@parcel/watcher` 安装脚本需在根 `allowBuilds` 单独许可。Vite 自动生成的声明文件不做 Prettier 格式化，避免每次 build 弄脏工作区。
- project-2 的 `VITE_AI_API_KEY` 不得填写共享真实密钥，Dashboard 中的 `VITE_*` 同样可能被打包；客户端已移除该变量读取并限制 `envPrefix`。商城代理只转发业务 Authorization，不转发 Vercel Cookie/内部头，不跟随重定向且禁用缓存；Vercel 到旧后端仍是 HTTP，不能视为端到端加密。
- project-2 的 JSON 接口成功不代表图片可加载：`shop-static.edu.koobietech.com` 返回 HTTP 图片地址，2026-08-27 实测 HTTPS 证书域名不匹配；由 `/shop-images/*` 固定来源代理提供图片，禁止转发凭据或代理 SVG/HTML。首页接口需隔离失败，避免一个公告请求失败让轮播图与商品一起消失；部署验收要实际检查图片及部分接口失败场景。
- project-2 共享 AI 的 `/api/ai` rewrite 必须在商城 `/api/:path*` 之前；Vite dev 不运行 Serverless，应直接兜底，不能把 prompt 发到商城。限流是实例内存计数，不是全局费用上限；真实 key 仅放服务端 `DEEPSEEK_API_KEY`。DeepSeek 已公告旧 `deepseek-chat` 名称停用，部署时显式配置有效模型，细节和验收边界见 project-2 README。
- site 视觉注释每页可能从 Comment 1 重新编号，报告需使用页面前缀并保留 URL、选择器及 CSS 视口；标记截图像素不等于 CSS 像素。删除范围以标记元素为准，不将首页技术栈/项目区或文章局部按钮的删除扩大到其他页面同名内容；静态截图也不能作为动效、移动端或改版验收通过的证据。
- site 的“首屏只展示名言”指主体内容，不默认移走顶部导航。滚动入场需按实际滚动位置采样，不能用静态终态证明先后顺序；按钮入场用独立 `translate` 属性，避免覆盖 hover 的 `transform`。不支持 CSS 视图时间线时保留可读内容；声明字体名不等于字体实际加载，本地得意黑接入需单独验证且不通过全局 `--font-quote` 扩大到未授权页面。
- Astro 7（Vite/Lightning CSS）生产构建会把 `animation-timeline` 长声明合并进 `animation` 简写（如 `animation: linear both cue-scroll-away --home-quote`），Chrome 不接受简写中的时间线组件，会整条丢弃声明导致动画静默失效，且 dev 模式不复现；滚动驱动动画必须复查构建产物中的声明是否存活，或改用 IntersectionObserver + 时间动画方案（site Hero 入场与首页倒三角 scroll-away 2026-08-28 均已按后者重写，site 内已无滚动时间线声明）。
- site 的陈旧 `astro dev` 进程可能持有过期模块图：2026-08-28 实测一个早前遗留的 dev 进程（4323）不应用 index.astro 的首页 header fixed 覆盖与 site-main padding 归零（header 仍 sticky 占位、`.quote-screen` top=98px、maxScroll 比生产多 170px），首屏几何与生产构建不一致会直接干扰动效采样结论；几何对不上时先停掉旧 dev 进程重启再对比。
- Vercel 的 monorepo `Skip deployment` 依赖 workspace 图，不是简单按 Root Directory 过滤；workspace 外的 `docs/*`、根 `AGENTS.md`、`.gitignore` 等会被视为全局变化。`docs/` 已注册为无 app 依赖的 `@personal-hub/docs` workspace，高频任务/进度/决策/Gotchas 应写入该目录；根级配置变化仍允许触发三个 app。
- project-2 的 `postcss-pxtorem` 也会转换 `index.html` 内联 `<style>`：首帧根字号写成 `37.5px` 会在构建后变成 `0.5rem`，浏览器先算出 8px、再被 `rem.ts` 改为 37.5px，导致全站约 0.16 CLS。首帧根字号应使用不会被该插件再次换算的表达式（当前为 `min(10vw, 2.34375em)`），并在改动后直接检查 `dist/index.html` 与 Lighthouse CLS。
- 首页固定中文文案不要直接预加载并等待完整 CJK 字体再显示：site 的 1.15MiB 得意黑在 Lighthouse 移动节流下把 LCP 推至 6.7s、Performance 中位数降至 73。固定文案应生成字符子集并记录字符范围；本轮 54 个 Unicode 字符的 WOFF2 约 8KiB，本地 production build 三次移动 Lighthouse 均为 100、LCP 1.1s。名言内容变化时必须同步重生成子集，并同时用字体 cmap 覆盖断言和真实浏览器 `document.fonts` 检查缺字回退；只检查字体加载状态会漏掉单字回退。
- Antigravity 视角：视觉重设计前必须把用户注释按“硬性约束 / 设计建议”分级并落进 DESIGN.md，否则执行者容易把建议当强制要求硬编码，导致过度约束（如 v3 单屏要求与短屏例外的反复修正）。实施前应让用户确认分级，避免直接按审计清单逐条无差别实现。
- Codex 视角：Vercel Deployment Protection 开启时，未登录访客访问 Branch Preview 会被 302 重定向到 Vercel SSO，Lighthouse 会误把登录页当目标页。在线验收前应先检查项目设置，必要时临时关闭保护或使用已登录会话共享 Preview；不要把 302 跳转直接归咎于代码或网络问题。
- Codex 视角：Vercel Preview 默认响应 `X-Robots-Tag: noindex` 且边缘缓存未预热，其 Lighthouse SEO 与性能结果不能代表生产域名。源码修复、CLS、语义和无障碍可在 Preview 验证，但性能基线与 SEO 抓取必须以自定义域名生产环境为准，并串行多次取中位数。
- OpenCode Go 视角：国内访问修复不要只改代码或链接，要先确认 `*.vercel.app` 在大陆网络层被屏蔽，再为每个项目绑定独立自定义域名并把 DNS CNAME 指向 `cname-china.vercel-dns.com.`。最终验收必须在无 VPN 的中国大陆环境实测所有目标域名首页，而不是以 `.vercel.app` 可访问作为通过标准。
- zcode 视角：把 CSS 滚动时间线动画改写为 IntersectionObserver + CSS 时间动画时，不能只改源码，还要在 build 产物里全局检查 `animation-timeline` / `view-timeline` 是否被压缩进 `animation` 简写而静默失效。验收时应直接查看 `dist/_astro/*.css`，确保滚动时间线声明已完全消失，且触发类、过渡声明和静态降级全部存活。
