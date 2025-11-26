import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_REPOSITORY
    ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/`
    : '/editor/', // Replace 'editor' with your actual repository name for local development
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})

