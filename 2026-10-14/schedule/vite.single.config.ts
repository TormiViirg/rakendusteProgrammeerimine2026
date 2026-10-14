import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// `npm run build:single` → dist-single/index.html with JS, CSS, fonts and images inlined.
// Handy for dropping the preview into a CMS page, an email to a designer, or a sandboxed viewer.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: { outDir: 'dist-single', assetsInlineLimit: 100_000_000 },
})
