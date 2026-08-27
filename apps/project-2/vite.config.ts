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
  // AI configuration is server-only, including legacy VITE_AI_* settings.
  envPrefix: ["VITE_APP_URL"],
  server: {
    proxy: {
      "/shop-images": {
        target: "http://shop-static.edu.koobietech.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/shop-images(?=\/|\?|$)/, ""),
        configure: (proxy) => {
          proxy.on("proxyReq", (request) => {
            request.removeHeader("cookie");
            request.removeHeader("authorization");
          });
        },
      },
      "/api": {
        target: "http://shop-api.edu.koobietech.com",
        changeOrigin: true,
        // Vite alone does not run Serverless functions. Use local fallback and
        // never send AI prompts to the unrelated shop backend during development.
        bypass: (request) =>
          /^\/api\/ai(?:\/|\?|$)/.test(request.url || "") ? false : undefined,
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
