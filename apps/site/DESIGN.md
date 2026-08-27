# apps/site 视觉设计规范 (DESIGN.md)

> 版本：v1.0.0  
> 适用范围：`apps/site`（Astro 个人空间与博客站）  
> 视觉方向：现代化极客官网质感、克制优雅动效、高质感排版、深色太空黑（Obsidian Glass）

---

## 1. 设计哲学与参考站提炼

本规范融合并提炼了以下优秀站点的前沿设计语言：
1. **idle.space**：浮动悬浮药丸（Floating Glass Pill）、微高光边框（Specular 0.5px Highlight）、超椭圆圆角与高级投影层级。
2. **vestris.ai**：极致的排版韵律、紧致的字间距控制（Tight Letter-Spacing）、多层级表面深度（Layered Surfaces）与极简分割线。
3. **lukevoidx.com/zh**：深邃的宇宙质感暗底（Cosmic Obsidian）、优雅的流光与径向微光弥散、中英文混排的高质量字阶匹配。
4. **chirpy.cotes.page**：技术博客高信息密度的双栏阅读体验、精准的目录索引（TOC Scrollspy）与清晰的代码块层级。

---

## 2. 颜色系统 (Color System & Tokens)

站点采用纯粹沉浸的深色体系（Obsidian & Slate），配合电光紫罗兰（Electric Iris / Violet）与薄荷天青（Aurora Cyan）作为视觉焦点与交互引导。

### 2.1 基础与表面层级 (Background & Surface Tokens)
- `--color-bg-base`: `#080B11`（页面最底层背景，深邃宇宙黑）
- `--color-bg-subtle`: `#0D111A`（次级容器底色，微弱明度递进）
- `--color-bg-surface`: `#121722`（标准卡片与容器底色）
- `--color-bg-surface-elevated`: `#18202F`（悬停与浮层提升背景）
- `--color-bg-glass`: `rgba(13, 17, 26, 0.72)`（浮动导航与毛玻璃容器，配合 `backdrop-filter: blur(20px) saturate(180%)`）
- `--color-bg-glass-card`: `rgba(18, 23, 34, 0.65)`（文章与项目卡片半透明毛玻璃）

### 2.2 边框与微光 (Borders & Highlights)
- `--color-border-subtle`: `rgba(255, 255, 255, 0.07)`（静止卡片与弱分割线）
- `--color-border-medium`: `rgba(255, 255, 255, 0.14)`（激活项、悬停外框）
- `--color-border-strong`: `rgba(255, 255, 255, 0.25)`（高光强调边框）
- `--color-border-specular`: `rgba(255, 255, 255, 0.18)`（顶部 1px 模拟光照边框）
- `--color-border-glow-primary`: `rgba(99, 102, 241, 0.35)`（主焦点光晕）
- `--color-border-glow-secondary`: `rgba(56, 189, 248, 0.35)`（辅焦点光晕）

### 2.3 文本与前景色 (Typography & Neutral Tokens)
- `--color-text-primary`: `#F8FAFC`（主要标题、高亮文字，对比度 15.5:1）
- `--color-text-secondary`: `#94A3B8`（正文描述、次要信息，对比度 7.2:1）
- `--color-text-muted`: `#64748B`（时间戳、辅助注释、占位符，对比度 4.6:1）
- `--color-text-dim`: `#475569`（极弱装饰文字、小标签文字）

### 2.4 主题主色与渐变 (Accents & Gradients)
- `--color-accent-primary`: `#6366F1`（主交互蓝紫，Electric Indigo）
- `--color-accent-primary-hover`: `#4F46E5`
- `--color-accent-primary-subtle`: `rgba(99, 102, 241, 0.12)`
- `--color-accent-secondary`: `#38BDF8`（辅助青蓝，Sky Cyan）
- `--color-accent-secondary-subtle`: `rgba(56, 189, 248, 0.12)`
- `--color-accent-emerald`: `#10B981`（在线状态、成功、发布标记）
- `--color-accent-amber`: `#F59E0B`（注意、提醒）

### 2.5 功能渐变 (Functional Gradients)
- `--gradient-brand`: `linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #38BDF8 100%)`
- `--gradient-brand-subtle`: `linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.1) 50%, rgba(56, 189, 248, 0.15) 100%)`
- `--gradient-text-hero`: `linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 45%, #93C5FD 100%)`
- `--gradient-glow-line`: `linear-gradient(90deg, transparent 0%, #6366F1 50%, transparent 100%)`

---

## 3. 字体与排版系统 (Typography System)

### 3.1 字体族 (Font Families)
```css
/* 无衬线主字体（现代几何 + 优雅中文字体回退） */
--font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", "PingFang SC", "Hiragino Sans GB", "Noto Sans CJK SC", "Microsoft YaHei", sans-serif;

/* 等宽字体（代码块、技术标签、时间戳、徽章） */
--font-mono: ui-monospace, SFMono-Regular, "Geist Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
```

### 3.2 字阶层级表 (Type Scale & Hierarchy)

| 层级 Token | 像素值 (rem / clamp) | 字重 (Weight) | 行高 (Line Height) | 字间距 (Letter Spacing) | 应用场景 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display** | `clamp(2.5rem, 5.5vw, 3.75rem)` (40~60px) | 800 (Bold) | 1.15 | `-0.038em` | 首页 Hero 主标 |
| **H1** | `clamp(2rem, 4.5vw, 2.75rem)` (32~44px) | 750 (SemiBold) | 1.22 | `-0.035em` | 各页面主标题、文章标题 |
| **H2** | `clamp(1.35rem, 3vw, 1.75rem)` (21.6~28px) | 700 (Bold) | 1.3 | `-0.025em` | 区块标题、文章正文二级标题 |
| **H3** | `clamp(1.15rem, 2.2vw, 1.35rem)` (18.4~21.6px) | 650 (Medium) | 1.35 | `-0.015em` | 卡片标题、文章正文三级标题 |
| **Body Lead** | `1.125rem` (18px) | 400 / 500 | 1.7 | `-0.01em` | 首页导语、文章 Lead 引言 |
| **Body** | `1rem` (16px) | 400 (Regular) | 1.75 | `-0.005em` | 标准正文段落 |
| **Caption / Meta** | `0.875rem` (14px) | 450 | 1.5 | `0` | 辅助文字、作者信息、侧边栏内容 |
| **Micro / Tag** | `0.75rem` (12px) | 600 | 1.4 | `0.04em` | 徽章、技术栈 Pill、时间标签 |

---

## 4. 间距与尺寸系统 (Spacing & Radius Scale)

基于 **4px / 8px** 栅格倍率系统，确保全站对齐精密。

### 4.1 间距 Token
- `--space-1`: `4px` (0.25rem)
- `--space-2`: `8px` (0.5rem)
- `--space-3`: `12px` (0.75rem)
- `--space-4`: `16px` (1rem)
- `--space-5`: `20px` (1.25rem)
- `--space-6`: `24px` (1.5rem)
- `--space-8`: `32px` (2rem)
- `--space-10`: `40px` (2.5rem)
- `--space-12`: `48px` (3rem)
- `--space-16`: `64px` (4rem)
- `--space-20`: `80px` (5rem)
- `--space-24`: `96px` (6rem)

### 4.2 圆角 Token
- `--radius-xs`: `4px` (标签、小代码块)
- `--radius-sm`: `8px` (输入框、次级按钮、小图标容器)
- `--radius-md`: `14px` (普通卡片、导航容器)
- `--radius-lg`: `20px` (主卡片、名言轮播盒、侧边栏)
- `--radius-xl`: `28px` (大模态、Hero 视觉面板)
- `--radius-full`: `9999px` (胶囊按钮、Status 药丸徽章)

---

## 5. 动效与微交互规范 (Motion System)

强调 **克制、自然、灵动、零运行时库依赖**（纯 CSS 实现）。

### 5.1 缓动曲线 (Easing Curves)
- `--ease-out-spring`: `cubic-bezier(0.16, 1, 0.3, 1)`（自然回弹缓出，用于入场与悬停）
- `--ease-in-out-smooth`: `cubic-bezier(0.4, 0, 0.2, 1)`（平滑中速过度）
- `--ease-bounce`: `cubic-bezier(0.22, 1, 0.36, 1)`（弹性质感）

### 5.2 交互时长 (Durations)
- **微交互 (Micro-transitions)**: `150ms ~ 200ms`（按钮按下、链接变色、图标位移）
- **悬停动效 (Hover Lift & Glow)**: `250ms ~ 300ms`（卡片浮起、光晕放大）
- **入场动效 (Fade In & Up)**: `500ms ~ 700ms`（页面初次加载、级联延迟）
- **轮播过渡 (Quote Carousel Crossfade)**: `600ms` 淡入淡出 + `3500ms` 停留周期

### 5.3 关键动画
1. **FadeInUp 入场**：`transform: translateY(16px)` -> `translateY(0)`，配合 `opacity: 0` -> `1`。
2. **Ambient Float 背景弥散**：缓慢无规则漂移（`18s` 无限往复），营造深邃空间感。
3. **Card Specular Glow 悬停**：卡片上移 `3px ~ 4px`，顶层微光边框透明度提高，外发光柔和扩散。
4. **Reduced Motion 降级**：在 `prefers-reduced-motion: reduce` 下强制将时长归零，禁止大幅度位移。

---

## 6. 布局与响应式网格 (Layout & Breakpoints)

### 6.1 容器宽度
- `--container-max`: `1080px`（标准页面主容器）
- `--container-narrow`: `760px`（单栏聚焦阅读容器）
- `--container-wide`: `1200px`（全景展示）

### 6.2 断点系统 (Breakpoints)
- **Mobile (`< 640px`)**：单列自适应，侧边栏下沉或折叠，内边距 `16px ~ 20px`，按钮全宽化。
- **Tablet (`640px ~ 899px`)**：双列项目网格，适度内边距 `24px ~ 32px`。
- **Desktop (`900px ~ 1199px`)**：标准双栏布局（左侧边栏 280px / 290px，右侧内容区 1fr），顶部固定毛玻璃导航。
- **Wide Desktop (`>= 1200px`)**：居中对齐，大空间留白，极致排版体验。

---

## 7. 四大核心页面与组件规范

### 7.1 首页 (`/`)
- **Header**: 居中浮动玻璃药丸（Floating Pill Header），支持当前路由微高亮胶囊。
- **Hero**:
  - 顶部状态微徽章（带有脉冲绿点的探索领域说明）。
  - 800 字重的主标题 + 品牌渐变词组。
  - 精炼且富有感染力的自我介绍。
  - 双主操作按钮（主行动点：项目作品，次行动点：阅读文章）。
  - 极客技术栈药丸群。
  - **名言轮播核心卡片**：深色拟态毛玻璃盒，顶部带有激光高光流线，3.5s 周期无跳动平滑渐变切换。
- **Featured Projects**: 双卡片网格预览，带独立悬浮发光与直接路由引导。

### 7.2 项目页 (`/projects`)
- **Page Header**: 标题 + 渐变斜杠装饰 + 清晰的项目定位导语。
- **Project Detail Cards**:
  - 顶部发光微流线（区分 React 项目蓝青色与 Vue 3 项目紫靛色）。
  - 项目名称 + 一句话标语。
  - 项目详细架构与业务价值阐述。
  - 技术栈标签（等宽字体，高对比度微底色）。
  - 真实双按钮：在线预览（外链带新标签图标）+ 查看源码（GitHub 图标）。

### 7.3 文章列表页 (`/posts`)
- **双栏现代结构**:
  - **左侧个人名片 (Profile Sidebar)**：头像徽章、在线状态绿点、自我定位、联系邮箱（点击发送邮件）、GitHub 链接、已发布文章数计数。
  - **右侧文章流 (Posts Feed)**：卡片式文章条目，包含发布日期、标签药丸、悬浮变色标题与滑动箭头。

### 7.4 文章详情页 (`/posts/[slug]`)
- **双栏阅读体验**:
  - **左侧粘性导航 (Sticky Article Sidebar)**：返回上一页导航、**动态生成文章目录（TOC）**（基于滚动位置高亮当前章节）、**更多文章推荐卡片**。
  - **移动端自适应**：折叠式目录手风琴组件（Details/Summary），底部追加更多文章。
  - **正文排版 (Markdown Typography)**：优雅的二级/三级标题下划虚线、引用块左侧高光条、等宽代码块高对比度黑底与代码内联药丸。
