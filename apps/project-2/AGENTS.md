## Gotchas

- 桌面手机容器使用 `--shop-viewport-width: 10rem`，与 `rem.ts` 的 375px 封顶配套，最大实际宽度为 375px。不要直接在样式里写 `max-width: 375px`：`postcss-pxtorem`（rootValue 75）会转成 5rem，导致宽度缩到 187.5px。`main.css` 已启用，但不要重新引入闲置的 Vue 模板 `base.css`，其字号、暗色模式和全局重置会改变现有移动端效果；固定栏需单独居中，子元素用容器相对宽度而不是 `100vw`。
- Vant 底部 ActionSheet 使用 `transform` 实现纵向进出动画，限宽时可用 `left: 0; right: 0; margin: 0 auto` 居中，不要用横向 transform 覆盖动画。按用户注释只限制指定浮层（如 `.purchase-sheet`），不扩大到所有 Popup；布局需在真实浏览器中测量并检查开关过程，Node 单测和静态截图不能替代动画验收。
- 当前 Vant Field 清空图标只绑定 `touchstart`，桌面端即使看见图标也可能点击无效；Search.vue 在图标失焦隐藏前补充局部 pointerdown 捕获，触屏仍走原生事件。搜索 AI 的“本地”标签不等于未接入模型：需区分线上配置缺失、请求失败与页面丢失 fallback；Preview 已配置不代表 Production 已配置。未知分类也需显示通用建议，清空/离页后旧请求不得回填；只按用户注释修指定页面，不全局替换 Vant 行为。
- Vercel 环境变量保存后需要新部署才会生效；旧的部署独立 URL 不会自动更新，生产复验优先使用 `project-2-liard-mu.vercel.app` 或新部署地址。Secret 可只扩展环境范围而不读取/重填原值；保存前关闭环境选择弹层，复核 Production/Preview/Development 的实际选中状态，并以成功提示和更新后的列表确认保存。生产重新部署需核对源为已审查合并的 main，不能顺带发布未审查的本地功能分支。
- Vant `fixed` 顶栏的宽度基于浏览器视口，不会自动继承 `#app` 的手机限宽；地址页仅对 `.addr-list > .van-nav-bar--fixed` 使用共享宽度上限和左右自动居中，避免影响新增/编辑地址页。浏览器视口切换后须核对实际 `innerWidth`，不能仅凭工具返回成功就宣称手机尺寸已验证。
