import { defineConfig } from 'vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    viteReact(),
    tailwindcss(),
  ],
  server: {
    watch: {
      // File-change events don't cross the Windows -> WSL2 bind-mount
      // boundary, so poll when running inside Docker.
      usePolling: process.env.DOCKER_DEV === 'true',
      interval: 300,
    },
  },
})
