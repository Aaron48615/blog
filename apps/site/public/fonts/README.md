# 本地托管字体

## 得意黑 Smiley Sans Oblique

- **源文件**：`SmileySans-Oblique.woff2`（源自官方发布的 `SmileySans-Oblique.ttf.woff2`，TrueType 格式 WOFF2，约 1.1 MB）
- **网页字符子集**：`SmileySans-QuoteSubset.woff2`（仅包含 `Hero.astro` 七条固定名言所需的 54 个 Unicode 字符，约 8 KB；使用 FontTools 4.60.2 的 `subset` 命令生成并通过 `--obfuscate-names` 移除保留字体名）
- **来源**：<https://github.com/atelier-anchor/smiley-sans/releases>（官方 Releases）
- **版本**：v2.0.1（发布于 2024-02，字体内部版本 2.0；静态单字重，设计风格为 Oblique 倾斜体）
- **许可证**：SIL Open Font License 1.1（见本目录 `LICENSE`，与发布版同 tag 的仓库 `LICENSE` 文件一致）。允许自由商用、嵌入与再分发，保留名称条款（Reserved Font Name: Smiley / 得意黑）。

## 接入方式

- `@font-face` 声明位于 `apps/site/src/styles/global.css`，使用网页别名 `Aaron Quote Subset`，从站内路径 `/fonts/SmileySans-QuoteSubset.woff2` 加载，`font-display: swap`。
- 目前仅首页名言正文（`Hero.astro` 的 `.quote-text`）通过首页专用变量 `--font-quote-home` 使用该字体；作者署名、介绍、按钮及其他页面不使用。
- 全局 `--font-quote`（`projects` 等页在用）仍指向上方 CDN 声明的 `"Smiley Sans"`，本次改动未触碰。

## 更新字体时

1. 从官方 Releases 下载新版本压缩包，替换 `SmileySans-Oblique.woff2` 并同步更新本 README 的版本号。
2. 用首页七条名言正文（含中文引号和句号）的去重字符重新生成 `SmileySans-QuoteSubset.woff2`；若名言内容变化，也必须同步更新字符子集，缺字会自动回退到楷体/宋体。
3. 如许可证文件有变，同步替换本目录 `LICENSE`。
4. 字重/样式声明需与字体实际元数据核对（官方发布为静态字体时保留 `font-weight: 400 800` 范围声明以避免浏览器合成加粗）。
