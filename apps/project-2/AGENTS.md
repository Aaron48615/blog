所有开发前提：一般都在iPhone6/7/8/SE尺寸下做调试，除非特殊要求。如果涉及到css排版，界面都使用响应式单位rem。
代码修改要求：在原代码的基础上做最小修改，可以在代码中做注释以标明代码段的作用
可能需要查看的接口文档：http://shop-api.edu.koobietech.com/swagger-ui/index.html

## Gotchas

- 桌面手机容器使用 `--shop-viewport-width: 10rem`，与 `rem.ts` 的 375px 封顶配套，最大实际宽度为 375px。不要直接在样式里写 `max-width: 375px`：`postcss-pxtorem`（rootValue 75）会转成 5rem，导致宽度缩到 187.5px。`main.css` 已启用，但不要重新引入闲置的 Vue 模板 `base.css`，其字号、暗色模式和全局重置会改变现有移动端效果；固定栏需单独居中，子元素用容器相对宽度而不是 `100vw`。
