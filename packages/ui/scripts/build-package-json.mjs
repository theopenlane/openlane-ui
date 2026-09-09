// Generates dist/package.json - a self-contained manifest for the published package, rooted at
// dist/ itself.
//
// Why: npm's `publishConfig` does NOT override "exports"/"main"/"type" at publish time - it only
// overrides .npmrc-style config (registry, tag, access, provenance). An npm/cli maintainer
// confirmed this is deliberate, not a gap: "Changing the package.json during publish is the
// source of what some folks are calling 'dependency confusion' ... npm is currently not planning
// on supporting it" (npm/cli#7586). pnpm and yarn do support it; npm does not. Verified empirically
// too: `bun pm pack` (which mirrors npm's publish semantics here, not pnpm's) leaves the packed
// manifest's "exports" pointing at ./src/... even though `files` only ships dist/.
//
// So the root package.json's `exports` stays pointing at src (raw-source consumption by console,
// unchanged) and its `publishConfig.exports` documents the intended published shape, but the
// actual publish target is this generated dist/package.json, with exports relative to dist/ as
// the package root. The real publish command is `npm publish` run from packages/ui/dist (or
// `npm publish packages/ui/dist`), not from packages/ui itself.
import { readFileSync, writeFileSync } from 'node:fs'

const ROOT = new URL('..', import.meta.url).pathname
const pkg = JSON.parse(readFileSync(`${ROOT}package.json`, 'utf-8'))

const exports = Object.fromEntries(
  Object.entries(pkg.publishConfig.exports).map(([key, target]) => {
    if (typeof target === 'string') {
      return [key, target.replace(/^\.\/dist\//, './')]
    }
    return [
      key,
      Object.fromEntries(Object.entries(target).map(([condition, path]) => [condition, path.replace(/^\.\/dist\//, './')])),
    ]
  }),
)

const distPkg = {
  name: pkg.name,
  version: pkg.version,
  private: false,
  type: 'module',
  sideEffects: pkg.sideEffects,
  exports,
  peerDependencies: pkg.peerDependencies,
  dependencies: pkg.dependencies,
  overrides: pkg.overrides,
  publishConfig: { access: 'public' },
}

writeFileSync(`${ROOT}dist/package.json`, `${JSON.stringify(distPkg, null, 2)}\n`)
console.log(`[build-package-json] wrote ${ROOT}dist/package.json`)
