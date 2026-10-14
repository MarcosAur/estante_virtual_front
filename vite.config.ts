import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const rootDir = fileURLToPath(new URL('../', import.meta.url))
  const rootEnv = loadEnv(mode, rootDir, '')
  const localEnv = loadEnv(mode, process.cwd(), '')
  const env = { ...rootEnv, ...localEnv }

  // Base path para GitHub Pages (ex: /estante_virtual/) ou configurável via VITE_BASE_URL
  const basePath = env.VITE_BASE_URL || (process.env.GITHUB_REPOSITORY ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/` : '/')

  return {
    base: basePath,
    define: {
      'import.meta.env.VITE_ENABLE_REGISTER': JSON.stringify(env.VITE_ENABLE_REGISTER ?? 'true'),
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL ?? '/api/v1'),
      'import.meta.env.VITE_BACKEND_URL': JSON.stringify(env.VITE_BACKEND_URL ?? 'http://127.0.0.1:8000'),
    },
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: env.VITE_BACKEND_URL || 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
      },
    },
  }
})
