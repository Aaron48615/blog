# Aaron's Personal Space & Blog (`apps/site`)

基于 **Astro 7** 构建的个人空间与极简博客，遵循 **Vestris 人文雅致风（DESIGN.md v3）**。

## 页面路由

- `/` — 首页：名人名言视觉中心（得意黑 Smiley Sans / 4s 停留 / 1.2s 淡入淡出）+ 个人介绍 + 单屏极简入口
- `/posts` — 文章列表页：左侧个人 Profile 名片（圆角正方形头像）+ 右侧文章列表流
- `/posts/[slug]` — 文章详情页：左侧动态目录（TOC Scrollspy）+ 正文 Markdown 渲染
- `/projects` — 练手项目展示页：独立项目卡片（云枢数据大屏、拾光集移动商城）、完整技术栈与操作按钮

## 设计规范

详见 [DESIGN.md](./DESIGN.md) v3.0.0 与视觉审计记录 [docs/VISUAL_AUDIT.md](./docs/VISUAL_AUDIT.md)。

## 开发与构建命令

```bash
# 从根目录运行
pnpm --filter site dev    # 启动本地开发服务 (localhost:4321)
pnpm --filter site build  # 执行生产静态构建并输出至 dist/
```
