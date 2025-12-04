import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  base: '/Rastros/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})



//configuração antiga
// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// import path from 'path'

// // https://vite.dev/config/
// export default defineConfig({
//   base: '/Rastros/',
//   plugins: [react()],
//   resolve: {
//     alias: {
//       '@': path.resolve(__dirname, './src'),
//     },
//   },
//   test: {
//     environment: 'jsdom',
//     globals: true,
//     coverage: {
//       reporter: ['text', 'lcov', 'html'], // para incluir relatório
//       all: true,
//       include: ['**/*.{test,spec}.{js,jsx,ts,tsx}'],
//       exclude: ['src/**/index.*', 'src/**/main.*']
//     }
// })
