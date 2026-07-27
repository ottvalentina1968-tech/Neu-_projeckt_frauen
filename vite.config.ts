import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Нужно для GitHub Pages: https://ottvalentina1968-tech.github.io/Neu-_projeckt_frauen/
  base: '/Neu-_projeckt_frauen/',
  plugins: [react()],
})
