import { defineConfig } from 'vite';
import path from 'path';

/**
 * Vite 配置
 * 用于构建 EagleRive 插件的前端资源
 */
export default defineConfig({
  // 构建配置
  build: {
    outDir: 'viewer/dist',
    emptyOutDir: true,
    // 不生成 sourcemap（生产环境）
    sourcemap: false,
    // 压缩配置
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // 保留 console 用于调试
        drop_debugger: true,
      },
    },
    // Rollup 选项
    rollupOptions: {
      input: {
        // 入口文件
        main: path.resolve(__dirname, 'viewer/riv.html'),
      },
      output: {
        // 输出文件命名
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
        // 模块格式
        format: 'es',
      },
      // 外部依赖（不打包的库）
      external: [],
    },
  },

  // 开发服务器配置（可选，用于本地开发）
  server: {
    port: 3000,
    open: true,
  },

  // 路径别名
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'viewer/js'),
      '@css': path.resolve(__dirname, 'viewer/css'),
    },
  },

  // 优化依赖预构建
  optimizeDeps: {
    // 排除不需要优化的依赖
    exclude: [],
  },
});
