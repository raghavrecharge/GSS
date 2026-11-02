export default {
  esbuild: { jsx: 'automatic' },
  server: {
    port: 5173,
    proxy: { '/api': { target: 'http://127.0.0.1:8099', changeOrigin: false } },
  },
}
