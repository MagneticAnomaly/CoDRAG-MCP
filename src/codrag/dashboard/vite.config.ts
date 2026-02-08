import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const uiSrcPath = new URL('../../../packages/ui/src', import.meta.url).pathname
const repoRootPath = new URL('../../..', import.meta.url).pathname

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@codrag/ui': uiSrcPath,
    },
  },
  server: {
    host: '0.0.0.0',
    cors: true,
    port: 5174,
    fs: {
      allow: [repoRootPath],
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8400',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('[Vite Proxy] Error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('[Vite Proxy] Request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('[Vite Proxy] Response:', proxyRes.statusCode, req.url);
          });
        },
      },
      '/projects': {
        target: 'http://127.0.0.1:8400',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('[Vite Proxy] Error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('[Vite Proxy] Request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('[Vite Proxy] Response:', proxyRes.statusCode, req.url);
          });
        },
      },
      '/health': {
        target: 'http://127.0.0.1:8400',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('[Vite Proxy] Error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('[Vite Proxy] Request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('[Vite Proxy] Response:', proxyRes.statusCode, req.url);
          });
        },
      },
      '/llm': {
        target: 'http://127.0.0.1:8400',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('[Vite Proxy] Error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('[Vite Proxy] Request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('[Vite Proxy] Response:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
})
