import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'node:path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(__dirname, '../console/src'),
      'next-auth/react': resolve(__dirname, 'src/__mocks__/next-auth-react.ts'),
    },
  },
  define: {
    'process.env': {},
  },
})
