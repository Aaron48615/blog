import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
// 需要path进行路径的引入，node.js自带
import path from 'path'

// https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
//   // 配置代理
//   server: {
//     // 当前端口号
//     port: 5173,
//     // 前端请求 http://116.62.230.90/login => /api/login
//     proxy: {
//       "/api": {
//         // 要代理的服务端路径
//         target: "http://116.62.230.90",
//         // 是否允许重写路径
//         changeOrigin: true
//       }
//     }
//   },
//   // 解析内容
//   resolve: {
//     alias: {
//       // 将路径片段拼成绝对路径
//       // path.resolve(__dirname全局变量, 'xxx')
//       "@": path.resolve(__dirname, 'src')
//     }
//   }
// })
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  return {
    plugins: [
      react(),
      {
        name: 'inject-amap-security',
        transformIndexHtml(html) {
          return html.replace(
            '<!-- AMAP_SECURITY -->',
            `<script>window._AMapSecurityConfig={securityJsCode:'${env.VITE_AMAP_SECURITY_KEY ?? ''}'};</script>`,
          );
        },
      },
    ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://116.62.230.90:9999',
        changeOrigin: true,
      }
    }
  },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    }
  }
})
