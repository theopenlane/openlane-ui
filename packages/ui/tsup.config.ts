import { resolve } from 'node:path'
import type { Plugin } from 'esbuild'
import { defineConfig } from 'tsup'
import { PACKAGE_ROOT, SELF, publishedScriptEntries } from './scripts/publish-surface.mts'

const entries = publishedScriptEntries()
const entrySpecifierBySource = new Map(entries.map(({ name, source }) => [resolve(PACKAGE_ROOT, source), `${SELF}/${name}`]))

const keepEntryBoundaries: Plugin = {
  name: 'keep-entry-boundaries',
  setup(build) {
    build.onResolve({ filter: /^\./ }, async (args) => {
      if (args.kind === 'entry-point' || args.pluginData?.resolvingBoundary) return undefined
      const resolved = await build.resolve(args.path, { kind: args.kind, importer: args.importer, resolveDir: args.resolveDir, pluginData: { resolvingBoundary: true } })
      const specifier = entrySpecifierBySource.get(resolved.path)
      return specifier && resolved.path !== args.importer ? { path: specifier, external: true } : undefined
    })
  },
}

export default defineConfig({
  entry: Object.fromEntries(entries.map(({ name, source }) => [name, source])),
  format: ['esm'],
  target: 'es2020',
  treeshake: false,
  clean: true,
  esbuildPlugins: [keepEntryBoundaries],
  esbuildOptions: (options) => {
    options.packages = 'external'
  },
})
