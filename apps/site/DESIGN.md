# apps/site 视觉设计规范 (DESIGN.md)

> 版本：v2.0.0  
> 适用范围：`apps/site`（Astro 个人空间与博客站）  
> 视觉风格：**Vestris 人文科技雅致风（Editorial Naturalism & Modern Tech）**，融合温润亚麻骨白、深松墨绿、浮动药丸导航与两侧自然动态枝叶景深遮罩。

---

## 1. 设计灵感与参考站解构

1. **配色灵魂 — vestris.ai**：
   - 告别千篇一律的纯黑冷色霓虹，拥抱 **温润骨白（Warm Bone `#F2EFE5`）** 与 **深松墨绿（Deep Forest `#233426`）** 的高级画册质感。
   - 高阶明度层级对比，细腻的米褐米黄弱边框（`#E7E1CE`），温润柔和的人文阅读体验。
   - **两侧动态景深植物遮盖（Ambient Botanical Foliage Overlay）**：页面左右两侧带有微风摇曳的剪影枝叶微光，创造超高质感的自然景深层。
2. **首页架构 — lukevoidx.com/zh + idle.space**：
   - **idle.space 交互精髓**：居中悬浮毛玻璃药丸导航（Floating Pill Nav）、微高光 0.5px 边框、紧凑有力的 Display 主标、极客技术栈药丸、两段式精简 CTA。
   - **lukevoidx.com/zh 内容排布**：富有哲思的 Manifesto / 名言核心区块、编号索引（01 / 02）项目卡片流与优雅的渐变分界线。
3. **文章页双栏结构 — chirpy.cotes.page 精简升级**：
   - **去除原 Chirpy 最右侧多余边栏**，纯粹保留 **左侧粘性边栏（Sticky Sidebar） + 右侧核心阅读区（Main Content）**。
   - 文章列表页：左侧放置个人 Profile 名片（头像、在线状态、联系方式、文章统计），右侧为文章列表流。
   - 文章详情页：左侧放置返回导航 + **滚动目录索引（TOC Scrollspy）** + 更多文章推荐；右侧为主文章 Markdown 精美排版。

---

## 2. 颜色系统 (Color Palette & Design Tokens)

基于 `vestris.ai` 提取的温润人文大地色系与深松墨绿色调，兼备高对比度阅读性与艺术画册美感。

### 2.1 基础与表面层级 (Surfaces & Backgrounds)

- `--color-bg-base`: `#F2EFE5`（主页面基底，温润骨白 / 亚麻暖白）
- `--color-bg-subtle`: `#EBE6DA`（次级容器、输入框、浅底分割）
- `--color-bg-surface`: `#FAF8F3`（卡片基础表面白）
- `--color-bg-surface-elevated`: `#FFFFFF`（悬浮提升卡片、纯净白）
- `--color-bg-dark`: `#233426`（深松墨绿，用于名言核心卡片、深色强调块）
- `--color-bg-dark-elevated`: `#1A281D`（深色块内更深层级）
- `--color-bg-glass`: `rgba(242, 239, 229, 0.82)`（浮动导航毛玻璃，配合 `backdrop-filter: blur(16px)`）
- `--color-bg-glass-dark`: `rgba(35, 52, 38, 0.88)`（深色容器毛玻璃）

### 2.2 边框与微光分割 (Borders & Dividers)

- `--color-border-subtle`: `#E5DFC9`（浅色卡片微弱边框）
- `--color-border-medium`: `#D5CDB5`（悬停与交互强调外框）
- `--color-border-dark`: `rgba(255, 255, 255, 0.12)`（深色容器内部边框）
- `--color-border-dark-specular`: `rgba(255, 255, 255, 0.22)`（深色卡片顶部 1px 模拟光照边框）
- `--color-divider`: `rgba(35, 52, 38, 0.08)`（内容弱分割线）

### 2.3 文本与排版前景色 (Typography Colors)

- `--color-text-primary`: `#1D1D1D`（主要标题与正文字，对比度 13.8:1）
- `--color-text-forest`: `#233426`（深松墨绿主题文字）
- `--color-text-secondary`: `#556157`（正文次要描述，对比度 6.5:1）
- `--color-text-muted`: `#7E8A80`（时间戳、辅助注释、占位符，对比度 4.6:1）
- `--color-text-dim`: `#A0ABA2`（极弱装饰文字）
- `--color-text-on-dark-primary`: `#F8FAF6`（深色卡片上的主标题）
- `--color-text-on-dark-secondary`: `#C4D1C6`（深色卡片上的次级文字）
- `--color-text-on-dark-muted`: `#8E9E91`（深色卡片上的弱化文字）

### 2.4 主题色与点缀色 (Brand Accents & Semantics)

- `--color-accent-forest`: `#233426`（主交互按键与强调色）
- `--color-accent-forest-hover`: `#172319`
- `--color-accent-sage`: `#4A6750`（次级鼠尾草绿）
- `--color-accent-sage-subtle`: `rgba(74, 103, 80, 0.12)`
- `--color-accent-amber`: `#9E763A`（暖金琥珀色，用于局部亮点或徽章）
- `--color-accent-emerald`: `#2E8540`（在线状态指示灯、成功标记）

### 2.5 渐变与光泽 (Gradients)

- `--gradient-hero-text`: `linear-gradient(135deg, #1D1D1D 0%, #233426 60%, #4A6750 100%)`
- `--gradient-dark-card`: `linear-gradient(180deg, #233426 0%, #1A281D 100%)`
- `--gradient-specular-bar`: `linear-gradient(90deg, transparent 0%, #829A84 50%, transparent 100%)`
- `--gradient-section-divider`: `linear-gradient(90deg, rgba(35, 52, 38, 0.25) 0%, rgba(35, 52, 38, 0.05) 50%, transparent 100%)`

---

## 3. 字体与排版层级 (Typography System)

### 3.1 字体族配置

```css
/* 主无衬线字体：紧凑现代几何 + 优质中文字体回退 */
--font-sans:
  -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", "PingFang SC",
  "Hiragino Sans GB", "Noto Sans CJK SC", "Microsoft YaHei", sans-serif;

/* 优雅衬线装饰体（用于名言、重点短语、引用符号） */
--font-serif:
  "Instrument Serif", "Georgia", "Songti SC", "Source Han Serif SC", serif;

/* 代码与元数据等宽字体 */
--font-mono:
  ui-monospace, SFMono-Regular, "Geist Mono", Menlo, Monaco, Consolas,
  "Liberation Mono", "Courier New", monospace;
```

### 3.2 字阶规范表

| 层级 Token         | 尺寸 (clamp / rem)                             | 字重 | 行高 | 字间距     | 应用场景                      |
| :----------------- | :--------------------------------------------- | :--- | :--- | :--------- | :---------------------------- |
| **Display**        | `clamp(2.5rem, 5.5vw, 3.8rem)` (40~60px)       | 800  | 1.15 | `-0.038em` | 首页 Hero 主标题              |
| **H1**             | `clamp(2rem, 4.2vw, 2.75rem)` (32~44px)        | 750  | 1.22 | `-0.035em` | 页面大标题、文章主标题        |
| **H2**             | `clamp(1.35rem, 2.8vw, 1.75rem)` (21.6~28px)   | 700  | 1.3  | `-0.025em` | 区块标题、文章二级标题        |
| **H3**             | `clamp(1.15rem, 2.2vw, 1.35rem)` (18.4~21.6px) | 650  | 1.35 | `-0.015em` | 卡片标题、文章三级标题        |
| **Body Lead**      | `1.125rem` (18px)                              | 450  | 1.75 | `-0.01em`  | 首页导言、文章前言            |
| **Body**           | `1rem` (16px)                                  | 400  | 1.8  | `-0.005em` | 标准正文段落                  |
| **Caption / Meta** | `0.875rem` (14px)                              | 450  | 1.5  | `0`        | 侧栏说明、文章日期、作者信息  |
| **Micro / Tag**    | `0.75rem` (12px)                               | 600  | 1.4  | `0.04em`   | 徽章、技术栈 Pill、TOC 状态项 |

---

## 4. 间距与圆角标尺 (Spacing & Radius Scale)

基于 **4px / 8px** 黄金比例体系：

- 间距：`--space-1: 4px`、`--space-2: 8px`、`--space-3: 12px`、`--space-4: 16px`、`--space-5: 20px`、`--space-6: 24px`、`--space-8: 32px`、`--space-10: 40px`、`--space-12: 48px`、`--space-16: 64px`、`--space-20: 80px`
- 圆角：
  - `--radius-xs`: `4px`（微型代码标签）
  - `--radius-sm`: `8px`（次级按钮、输入框、小图标底座）
  - `--radius-md`: `14px`（文章卡片、目录块容器）
  - `--radius-lg`: `20px`（大项目卡片、名言暗色核心盒、个人 Profile 侧栏）
  - `--radius-full`: `9999px`（胶囊导航栏、主按钮、状态药丸）

---

## 5. 动效系统与两侧植物景深遮盖 (Motion & Ambient Foliage)

### 5.1 页面两侧动态自然枝叶遮盖 (Ambient Foliage Overlay)

借鉴 `vestris.ai` 的艺术画册视觉层级：

- **布局定位**：左右两侧使用固定容器（`position: fixed; pointer-events: none; z-index: 10`），不影响页面任何点击与文字复制。
- **视觉形态**：使用纯 SVG / CSS 绘制高精度半透明水墨/松木枝叶轮廓（Sage & Forest Green 渐变剪影），在屏幕两侧形成优雅的自然边缘景深。
- **动态微风效果 (Wind Sway)**：
  - 运用纯 CSS `transform: rotate(...) translateY(...)` 关键帧，实现 `12s ~ 18s` 的自然微风无规则轻微摇曳与呼吸。
  - 在移动端（`< 768px`）自动收缩至边缘仅保留极微弱的角落点缀，避免遮挡窄屏阅读。

### 5.2 缓动曲线与核心动效

- `--ease-out-spring`: `cubic-bezier(0.16, 1, 0.3, 1)`（悬停抬起与入场）
- `--ease-smooth`: `cubic-bezier(0.4, 0, 0.2, 1)`（平滑淡入）
- **名言轮播 (3.5s Cycle)**：双层透明度渐变 + 极轻微的 `translateY(4px)` 位移，优雅无闪烁。
- **卡片悬停 (Hover Lift)**：卡片上移 `3px`，阴影柔化扩散为温润墨绿漫反射（`0 16px 36px -12px rgba(35, 52, 38, 0.15)`）。
- **无障碍降级**：`prefers-reduced-motion: reduce` 时彻底关闭摇曳与轮播位移。

---

## 6. 页面结构与交互布局规范

### 6.1 首页结构 (`/`) — 融合 lukevoidx + idle.space

- **Header**：居中浮动温润毛玻璃胶囊（Floating Glass Pill），内嵌品牌 Logo、当前路由胶囊与外链。
- **Hero**：
  - 顶部在线微徽章（探索全栈 · 前端架构 · 交互美学，带脉冲绿点）。
  - 800 字重主标题（Display 大字阶，紧凑行距）。
  - 极客技术栈药丸群（React, Vue 3, TypeScript, Astro, CSS, pnpm）。
  - 双 CTA 按钮（深松墨绿主按钮“浏览项目作品” + 温润亚麻次按钮“阅读文章”）。
  - **核心名言轮播盒**：深松墨绿（`#233426`）拟态卡片，激光高光顶边，3.5s 周期平滑轮播。
- **精选项目流 (Featured Projects)**：
  - 参考 lukevoidx 的 `01` / `02` 编号排布，双卡片网格，配有细致的渐变分界线与技术栈标签。

### 6.2 项目展示页 (`/projects`)

- **页头导言**：大标题 + 渐变分割线 + 项目实践背景概述。
- **项目卡片**：
  - 拾光集移动商城系统（Vue 3 / DeepSeek 大模型）。
  - 云枢智慧城市数据平台（React 19 / Three.js / ECharts 3D 大屏）。
  - 包含多维度技术栈标签与**真实双按钮**（在线预览 + 查看代码仓库）。

### 6.3 文章列表页 (`/posts`) — Chirpy 精简双栏

- **左侧粘性个人名片 (Sticky Profile Sidebar)**：
  - 头像微徽章、在线状态绿点、自我定位与个人简介。
  - 联系邮箱（点击调起发信）与 GitHub 链接。
  - 已发布文章数统计卡片。
- **右侧文章流 (Posts Feed)**：
  - 精致卡片式文章列表，包含发布日期、分类/标签、文章摘要、悬停滑动箭头与阅读全文引导。

### 6.4 文章详情页 (`/posts/[slug]`) — Chirpy 精简双栏 + TOC Scrollspy

- **左侧粘性目录与导航 (Left Sticky TOC & Nav)**：
  - 返回文章列表导航。
  - **文章目录 TOC**：自动解析 Markdown H2 / H3 标题，随页面滚动实时点亮当前章节（Scrollspy）。
  - **更多文章推荐卡片**：展示站内其他推荐文章快速链接。
- **右侧文章主体 (Right Main Content)**：
  - 文章 Header（发布日期、标签、大标题、导言 Lead 区块）。
  - 正文 Markdown 排版：优雅的下划线二级标题、引用块左侧松墨绿竖线、高反差深色代码高亮块。
  - 移动端自适应：顶部折叠式目录（Details/Summary 手风琴），底部追加更多文章。
