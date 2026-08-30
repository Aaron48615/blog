# 全站 Lighthouse 审计

审计日期：2026-08-30  
执行者：Codex  
工具：Lighthouse 13.4.1、Chrome 146、Playwright CLI  
分支：`feature/lighthouse-audit`

## 口径与边界

- 分数顺序统一为 **Performance / Accessibility / Best Practices / SEO**。
- 移动端使用 Lighthouse 默认移动设备与节流；桌面端使用 Lighthouse desktop preset。
- `project-1` 使用既有测试账号登录后审计首页；`project-2` 使用既有测试账号保持登录态。报告和源码均未记录 Token、验证码或密码。
- 生产基线来自三个自定义域名。分支修复无法在合并前改变生产域名，因此先对本地 production build 复测，再以 Vercel Preview 做最终在线复测；生产域名的“修复后”复测必须在审查、合并和部署后完成。
- Lighthouse 性能分有网络波动。报告保留原始单次结果，不以多实例并发审计，避免 CPU 竞争污染结果。

## 修复前生产基线

### site — `https://www.aaronsite.top`

| 页面                | 移动端 P/A/BP/SEO | 桌面端 P/A/BP/SEO | 主要问题                              |
| ------------------- | ----------------- | ----------------- | ------------------------------------- |
| `/`                 | 93/95/100/100     | 100/95/100/100    | 次要文本对比度                        |
| `/projects`         | 80/95/96/100      | 76/95/96/100      | 无效 CDN 字体请求、关键请求链、对比度 |
| `/posts`            | 100/95/100/100    | 100/95/100/100    | 次要文本对比度                        |
| `/posts/hello-blog` | 100/95/100/100    | 100/95/100/100    | 次要文本对比度                        |

### project-1 — `https://city.aaronsite.top`

| 页面          | 移动端 P/A/BP/SEO | 桌面端 P/A/BP/SEO | 主要问题                                         |
| ------------- | ----------------- | ----------------- | ------------------------------------------------ |
| `/login`      | 93/96/100/83      | 99/96/96/83       | 缺少 meta description、密码图标点击区域偏小      |
| `/`（已登录） | 70/97/100/73      | 94/97/100/73      | 首屏提前加载 ECharts、缺少 description、不可抓取 |

### project-2 — `https://shop.aaronsite.top`

| 页面               | 移动端 P/A/BP/SEO | 桌面端 P/A/BP/SEO | 主要问题                                           |
| ------------------ | ----------------- | ----------------- | -------------------------------------------------- |
| `/home`            | 85/82/96/75       | 96/82/96/75       | 缺少 main/alt/description、禁止缩放、CLS、图片竞争 |
| `/category`        | 85/82/100/67      | 97/82/100/67      | 同上，且主内容等待商品列表接口                     |
| `/cart`            | 75/85/100/75      | 69/85/100/75      | 空态外链图片为 LCP、对比度与语义                   |
| `/mine`            | 93/91/100/83      | 72/91/100/83      | 外链头像为 LCP、对比度、缺少 description           |
| `/search`          | 64/86/100/82      | 100/86/100/82     | 主内容语义、对比度、CLS                            |
| `/prodinfo?ids=78` | 87/81/100/75      | 94/81/100/75      | 主内容等待非关键接口、图片 alt、缩放、CLS          |

## 最小化修复

### site

- 将全局弱对比文字色从 `#7e8a80` 调整为 `#5f695f`。
- 删除 `/projects` 使用的失效 jsDelivr 字体声明，非首页引文改用系统楷体/宋体栈；首页继续使用已有本地得意黑文件，不改视觉系统。

### project-1

- 增加页面 description 和 `robots.txt`。
- 将密码可见性图标的点击区域扩为 24×24 CSS px。
- Dashboard 中的 ECharts 渲染器改为按需加载，使首屏主内容不再携带约 371 KiB gzip 的图表 chunk；数据与图表逻辑不变。

### project-2

- 恢复浏览器缩放，增加 description、`robots.txt` 和各页 `<main>` 语义；为商品、轮播及头像补齐替代文本。
- 修正低对比文字；购物车改用 Vant 内置空态图，个人中心改用仓库内 logo，移除两个不稳定外链 LCP。
- 在 HTML 内联首帧根字号和应用壳，消除 JS 初始化前后的全站 rem 跳变；增加轻量启动占位以提前首次内容绘制。
- 分类页在分类接口返回后立即展示分类主内容；商品详情在核心商品接口返回后立即展示首图，不再等待收藏、评论和 AI 请求。
- 首屏轮播延长自动切换间隔并启用惰性渲染；首张图使用 `fetchpriority=high`，非首屏商品图使用 Vant Lazyload，避免下方大图争抢 LCP 带宽。

## 分支 production build 复测

以下为本地 production preview 的代表性结果；桌面端均达到目标。`project-2` 本地 preview 不运行 Vercel Serverless，因此商品图片经开发代理访问第三方源，`/api/ai` 也会本地 404；这两个差异需以 Vercel Preview 为准。

| 项目 / 页面                  | 移动端 P/A/BP/SEO                      | 桌面端 P/A/BP/SEO | 说明                                                        |
| ---------------------------- | -------------------------------------- | ----------------- | ----------------------------------------------------------- |
| site `/`                     | 生产性能 93；本地 A/BP/SEO 100/100/100 | 97/100/100/100    | 本地 HTTP/1 首次下载 1.1 MiB 首页字体导致移动性能不具代表性 |
| site `/projects`             | 100/100/100/100                        | 95/100/100/100    | 失效字体请求已消失                                          |
| site `/posts`                | 100/100/100/100                        | 100/100/100/100   | 通过                                                        |
| site `/posts/hello-blog`     | 100/100/100/100                        | 100/100/100/100   | 通过                                                        |
| project-1 `/login`           | 生产性能 93；本地 A/BP/SEO 100/100/100 | 99/100/100/100    | 本地移动单次性能 88，生产基线已为 93                        |
| project-1 `/`                | 95/97/100/91                           | 90/97/100/91      | 通过                                                        |
| project-2 `/home`            | 94/100/100/100                         | 100/100/100/100   | CLS 0                                                       |
| project-2 `/category`        | 91/100/100/92                          | 100/100/100/92    | CLS 0                                                       |
| project-2 `/cart`            | 95/100/100/100                         | 100/100/100/100   | CLS 0                                                       |
| project-2 `/mine`            | 98/100/100/100                         | 100/100/100/100   | CLS 0                                                       |
| project-2 `/search`          | 97/100/100/100                         | 100/100/100/100   | CLS 0                                                       |
| project-2 `/prodinfo?ids=78` | 76–90/100/96/100                       | 100/100/96/100    | 第三方首图单次 LCP 2.3–6.7s；本地 `/api/ai` 404 使 BP 为 96 |

## 尚待在线确认

- Vercel Preview 必须验证 `project-2 /prodinfo?ids=78` 的缓存后移动性能和 Best Practices。其本地性能波动由运行时商品接口与第三方图片源决定；若 Preview 仍低于 90，需要用户确认是否接受第三方依赖例外，或另开图片转码/CDN 基础设施任务。
- 分支合并并由 Vercel 发布后，再对三个自定义生产域名重复同一矩阵，才能把生产验收状态从“基线”更新为“修复后”。

## 工程验收

- `pnpm --filter site build`
- `pnpm --filter project-1 build`
- `pnpm --filter project-1 test -- --run`（22/22）
- `pnpm --filter project-1 lint`
- `pnpm --filter project-2 build`
- `pnpm --filter project-2 test -- --run`（81/81）
- `pnpm --filter project-2 check:ai-bundle`
- 改动文件 Prettier 检查与 `git diff --check`
