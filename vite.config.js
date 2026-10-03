import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { purgeCSSPlugin as purgeCSS } from '@fullhuman/postcss-purgecss'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  css: {
    postcss: {
      plugins: command === 'build' ? [purgeCSS({
        content: ['./index.html', './src/**/*.{js,jsx}'],
        safelist: ['collapsing', /^swiper/, /^bar-/, /animate/, /is-visible/, /stagger/, /fade/, /^playing/, /^paused/],
      })] : [],
    },
  },
  server: {
    proxy: {
      '/api/v1/portfolio': {
        target: 'https://saxmusic.site',
        changeOrigin: true,
        secure: true,
      },
    },
  },
}))
