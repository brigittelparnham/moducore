import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'ModucoreEmbeds',
      fileName: 'journal',
      formats: ['iife'],
    },
    // Bundle everything — React is included so the embed is self-contained
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
})
