import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import { EVIDENCE_EXTENSION_ID, EVIDENCE_EXTENSION_PUBLIC_KEY } from '@repo/evidence-capture/connect'
import { buildManifest } from './manifest.ts'
import packageJson from './package.json' with { type: 'json' }

const DEFAULT_CONSOLE_URL = 'http://localhost:3001'
const DEFAULT_API_URL = 'http://localhost:17608'

const extensionIdFromPublicKey = (publicKey: string) =>
  Array.from(createHash('sha256').update(Buffer.from(publicKey, 'base64')).digest('hex').slice(0, 32), (hex) => String.fromCharCode(97 + parseInt(hex, 16))).join('')

const emitManifest = (manifest: chrome.runtime.ManifestV3): Plugin => ({
  name: 'openlane-extension-manifest',
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: 'manifest.json', source: JSON.stringify(manifest, null, 2) })
  },
})

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, import.meta.dirname, 'OPENLANE_')
  const consoleOrigin = new URL(env.OPENLANE_CONSOLE_URL || DEFAULT_CONSOLE_URL).origin
  const apiOrigin = new URL(env.OPENLANE_API_URL || DEFAULT_API_URL).origin

  if (extensionIdFromPublicKey(EVIDENCE_EXTENSION_PUBLIC_KEY) !== EVIDENCE_EXTENSION_ID) {
    throw new Error('EVIDENCE_EXTENSION_ID does not match EVIDENCE_EXTENSION_PUBLIC_KEY')
  }

  return {
    plugins: [react(), tailwindcss(), emitManifest(buildManifest({ version: packageJson.version, consoleOrigin, apiOrigin }))],
    define: {
      __OPENLANE_CONSOLE_ORIGIN__: JSON.stringify(consoleOrigin),
      __OPENLANE_API_ORIGIN__: JSON.stringify(apiOrigin),
      'process.env': {},
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: mode === 'development',
      chunkSizeWarningLimit: 1024,
      rolldownOptions: {
        input: {
          popup: resolve(import.meta.dirname, 'popup.html'),
          background: resolve(import.meta.dirname, 'src/background.ts'),
        },
        output: {
          entryFileNames: '[name].js',
        },
      },
    },
  }
})
