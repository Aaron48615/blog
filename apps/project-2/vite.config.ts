import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
// import vueDevTools from 'vite-plugin-vue-devtools'
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { VantResolver } from "@vant/auto-import-resolver";
import pxtorem from "postcss-pxtorem";

// https://vite.dev/config/
export default defineConfig({
  // Only public settings are exposed, even if an old VITE_AI_API_KEY is present.
  envPrefix: ["VITE_APP_URL", "VITE_AI_API_BASE", "VITE_AI_API_MODEL"],
  server: {
    proxy: {
      "/api": {
        target: "http://shop-api.edu.koobietech.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api(?=\/|\?|$)/, ""),
      },
    },
  },
  plugins: [
    vue(),
    // vueDevTools(),
    AutoImport({
      resolvers: [VantResolver()],
    }),
    Components({
      resolvers: [VantResolver()],
    }),
  ],
  css: {
    postcss: {
      plugins: [
        pxtorem({
          rootValue: 75, // 这里写设计稿的宽度/10即可，例如设计稿宽度是750px就写75
          // vant默认是37.5，如果是使用了vant的话可以像下面这样写
          // rootValue(res) {
          //   return res.file.indexOf("vant") !== -1 ? 37.5 : 75;
          // },
          propList: ["*"], // 需要转换的属性，默认转换所有属性
          selectorBlackList: [], // CSS选择器黑名单，防止部分选择器被转换
          exclude: /\/node_modules\//i, // 忽略包文件转换rem
          replace: true, // 替换px为rem
          mediaQuery: false, // 在媒体查询的条件下也转换px为rem
        }),
      ],
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
