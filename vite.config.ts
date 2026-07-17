import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiHostname = env.VITE_API_HOSTNAME || 'http://127.0.0.1:8000'

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        '/sanctum': {
          target: apiHostname,
          changeOrigin: true,
        },
        '/api': {
          target: apiHostname,
          changeOrigin: true,
        },
        '/storage': {
          target: apiHostname,
          changeOrigin: true,
        },
        '/robot.gif': {
          target: apiHostname,
          changeOrigin: true,
        },
        '/broadcasting': {
          target: apiHostname,
          changeOrigin: true,
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('recharts')) return 'charts'
              if (id.includes('framer-motion')) return 'motion'
              if (id.includes('react-router') || id.includes('react-dom') || id.includes('/react/')) {
                return 'react-vendor'
              }
            }
          },
        },
      },
    },
  }
})
