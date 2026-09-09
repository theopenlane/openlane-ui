import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative as relativePath, resolve } from 'node:path'
import type { Options } from 'tsup'
import { defineConfig } from 'tsup'

const ROOT = new URL('.', import.meta.url).pathname
const SRC = join(ROOT, 'src')
const LIB = join(ROOT, 'lib')

const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8')) as {
  exports: Record<string, string>
}

// Recursively collects .ts/.tsx source files under dir, skipping stories and test files
// (those are not part of the published exports surface).
function collectSourceFiles(dir: string): string[] {
  if (!existsSync(dir)) return []

  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) return collectSourceFiles(full)
    if (!/\.(ts|tsx)$/.test(entry.name)) return []
    if (/\.(stories|test)\.(ts|tsx)$/.test(entry.name)) return []
    return [full]
  })
}

// A handful of components under src/components/** import bare `console/...` specifiers, which
// only resolve via the workspace symlink node_modules/console -> apps/console (apps/console's
// package.json name is the unscoped "console", with no `exports` field restricting deep imports,
// so Node's default resolution allows it). That import works inside console's own Next.js build,
// but it is a circular coupling - the shared library reaching back into the one app that consumes
// it - that a standalone package build cannot resolve, since apps/console's own `@/*` alias only
// resolves within console's tsconfig/webpack context, not this package's.
//
// Rather than hand-maintain a list, this walks the same local-import graph tsup would bundle and
// taints every file that depends (directly or transitively) on a bare `console/...` import, so the
// exclusion stays correct as the editor/component tree changes. Excluded files stay reachable via
// the raw-source `./components/*` wildcard export for internal (console) consumption exactly as
// before; they are simply left out of the compiled dist output. See report for the current list.
function consoleCoupledFiles(files: string[]): Set<string> {
  const fileSet = new Set(files)
  const importRe = /(?:from|import)\s+['"]([^'"]+)['"]/g

  function resolveLocal(fromFile: string, spec: string): string | null {
    let base: string
    if (spec.startsWith('.')) {
      base = resolve(dirname(fromFile), spec)
    } else if (spec.startsWith('@/')) {
      base = resolve(SRC, spec.slice(2))
    } else if (spec.startsWith('@theopenlane/ui/lib/')) {
      base = resolve(LIB, spec.slice('@theopenlane/ui/lib/'.length))
    } else if (spec.startsWith('@theopenlane/ui/components/')) {
      base = resolve(SRC, 'components', spec.slice('@theopenlane/ui/components/'.length))
    } else {
      return null
    }
    for (const candidate of [base, `${base}.tsx`, `${base}.ts`, join(base, 'index.tsx'), join(base, 'index.ts')]) {
      if (fileSet.has(candidate)) return candidate
    }
    return null
  }

  const graph = new Map<string, Set<string>>()
  const tainted = new Set<string>()

  for (const file of files) {
    const content = readFileSync(file, 'utf-8')
    const deps = new Set<string>()
    let match: RegExpExecArray | null
    importRe.lastIndex = 0
    while ((match = importRe.exec(content))) {
      const spec = match[1]
      if (spec.startsWith('console/')) {
        tainted.add(file)
        continue
      }
      const resolved = resolveLocal(file, spec)
      if (resolved) deps.add(resolved)
    }
    graph.set(file, deps)
  }

  let changed = true
  while (changed) {
    changed = false
    for (const [file, deps] of graph) {
      if (tainted.has(file)) continue
      for (const dep of deps) {
        if (tainted.has(dep)) {
          tainted.add(file)
          changed = true
          break
        }
      }
    }
  }

  return tainted
}

// Pre-existing, isolated source bugs unrelated to this build-wiring pass: unresolvable bare
// specifiers with nothing else in the ui package depending on the file, so each is excluded on its
// own rather than fixed (fixing would mean editing component source content beyond build wiring).
// See report.
const KNOWN_BROKEN_FILES = new Set<string>([
  // imports `from 'src/dialog'` (missing `./`; not a real bare specifier) - unresolvable outside
  // any bundler's happenstance root-relative fallback resolution.
  'src/components/ui/command.tsx',
])

// Derives tsup entry points from the package's public `exports` map so dist output stays
// one-to-one with the published subpath exports, instead of a blanket glob that would also sweep
// up .stories.tsx, non-exported internal files, and console-app-coupled files (see above).
function entriesFromExports(): string[] {
  const files = new Set<string>()
  const missing: string[] = []

  for (const target of Object.values(pkg.exports)) {
    if (target.endsWith('.css') || target.endsWith('.mjs')) continue

    const relative = target.replace(/^\.\//, '')

    if (relative.includes('*')) {
      for (const file of collectSourceFiles(join(ROOT, relative.replace(/\/\*(\.tsx)?$/, '')))) {
        if (KNOWN_BROKEN_FILES.has(relativePath(ROOT, file))) continue
        files.add(file)
      }
      continue
    }

    const absolute = join(ROOT, relative)
    if (!existsSync(absolute)) {
      missing.push(relative)
      continue
    }
    if (KNOWN_BROKEN_FILES.has(relative)) continue
    files.add(absolute)
  }

  if (missing.length > 0) {
    // Pre-existing stale exports map entries (target file doesn't exist, e.g. a typo'd filename).
    // Not fixed here since that changes package content beyond build wiring; see report.
    console.warn(`[tsup.config] skipping ${missing.length} exports map entr${missing.length === 1 ? 'y' : 'ies'} with no matching source file:`, missing)
  }

  const excluded = consoleCoupledFiles(Array.from(files))
  return Array.from(files).filter((file) => !excluded.has(file))
}

export default defineConfig((options: Options) => ({
  treeshake: true,
  splitting: true,
  entry: entriesFromExports(),
  format: ['esm'],
  // The package's tsconfig (via @repo/typescript-config/react-library.json) declares
  // `lib: ["ES2015", ...]`, which predates dts generation ever running against this codebase (there
  // was no build script before this change) and doesn't cover ES2019 String methods (e.g. trimEnd)
  // already used in source. Overriding lib for the dts step only - not touching the shared base
  // config package or this package's own tsconfig, which affect more than just this build.
  // `types: ["node"]` is needed because @types/node is only hoisted to the repo root's
  // node_modules, and tsup's isolated dts worker doesn't walk up for ambient type packages the way
  // a normal tsc invocation does (used for NodeJS.Timeout in src/chart/chart.tsx).
  dts: { compilerOptions: { lib: ['ES2019', 'DOM', 'DOM.Iterable'], types: ['node'] } },
  minify: true,
  clean: true,
  external: ['react'],
  ...options,
}))
