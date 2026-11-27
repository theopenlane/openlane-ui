import { copyFileSync, existsSync, globSync, readFileSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { DIST, PACKAGE_ROOT, SELF, importSpecifiers, publishedScriptEntries, readSourceManifest } from './publish-surface.mts'

const STYLESHEET = 'src/styles.css'
const CLIENT_DIRECTIVE = /^\s*["']use client["']/
const CLIENT_ONLY_AT_IMPORT = /\bcreateContext\(/
const RENDERS_WITH_HOOKS = /from\s*["']react\/jsx-runtime["'][\s\S]*\buse[A-Z]\w*\(/

const fail = (message: string): never => {
  console.error(`[build-package-json] ${message}`)
  process.exit(1)
}

const packageNameOf = (specifier: string): string =>
  specifier
    .split('/')
    .slice(0, specifier.startsWith('@') ? 2 : 1)
    .join('/')

const source = readSourceManifest()
const entries = publishedScriptEntries()
const publishedSubpaths = new Set(entries.map(({ subpath }) => subpath))
const stylesheet = readFileSync(join(PACKAGE_ROOT, STYLESHEET), 'utf8')
const problems: string[] = []

for (const { name, subpath } of entries) {
  const built = readFileSync(join(DIST, `${name}.mjs`), 'utf8')
  if (!CLIENT_DIRECTIVE.test(built) && (CLIENT_ONLY_AT_IMPORT.test(built) || RENDERS_WITH_HOOKS.test(built))) {
    problems.push(`${subpath} uses client-only React APIs but its source has no 'use client' directive`)
  }
}

const hasExportsMap = (name: string): boolean => {
  const manifestPath = join(PACKAGE_ROOT, 'node_modules', name, 'package.json')
  const hoistedPath = join(PACKAGE_ROOT, '..', '..', 'node_modules', name, 'package.json')
  const path = existsSync(manifestPath) ? manifestPath : hoistedPath
  return !existsSync(path) || 'exports' in (JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>)
}

const importedPackages = new Set<string>()
const deepImports = new Map<string, string>()
for (const file of globSync(join(DIST, '**', '*.{mjs,d.ts}'))) {
  for (const { specifier } of importSpecifiers(readFileSync(file, 'utf8'))) {
    if (specifier.startsWith('.')) continue
    if (specifier === SELF || specifier.startsWith(`${SELF}/`)) {
      if (!publishedSubpaths.has(`.${specifier.slice(SELF.length)}`)) problems.push(`${relative(DIST, file)} imports unpublished ${specifier}`)
      continue
    }
    const name = packageNameOf(specifier)
    importedPackages.add(name)
    if (file.endsWith('.mjs') && specifier !== name && !/\.[cm]?js$/.test(specifier)) deepImports.set(specifier, relative(DIST, file))
  }
}

const stylesheetPackages = [...stylesheet.matchAll(/^@(?:import|plugin)\s+['"]([^'"]+)['"]/gm)].map(([, specifier]) => packageNameOf(specifier))
const peerRanges = source.peerDependencies ?? {}
const peerMeta = source.peerDependenciesMeta ?? {}
const requiredPeers = Object.keys(peerRanges).filter((name) => !peerMeta[name]?.optional)
const dependencies: Record<string, string> = {}
const peerDependencies: Record<string, string> = {}
for (const name of [...new Set([...importedPackages, ...stylesheetPackages, ...requiredPeers])].sort()) {
  if (peerRanges[name]) peerDependencies[name] = peerRanges[name]
  else if (source.dependencies?.[name]) dependencies[name] = source.dependencies[name]
  else problems.push(`"${name}" is used by the published build but is not in packages/ui dependencies or peerDependencies`)
}

for (const [specifier, file] of deepImports) {
  const name = packageNameOf(specifier)
  if (dependencies[name] && !hasExportsMap(name)) problems.push(`${file} imports ${specifier}, which native ESM cannot resolve without a file extension`)
}

if (problems.length) fail(`the published package is not self-contained:\n  ${problems.join('\n  ')}`)

writeFileSync(join(DIST, 'styles.css'), stylesheet)
copyFileSync(join(PACKAGE_ROOT, '..', '..', 'LICENSE'), join(DIST, 'LICENSE'))
copyFileSync(join(PACKAGE_ROOT, 'README.md'), join(DIST, 'README.md'))

const manifest = {
  name: SELF,
  version: process.env.UI_VERSION || '0.0.0-local',
  description: 'Openlane design-system primitives for React and Tailwind CSS v4',
  license: 'Apache-2.0',
  repository: { type: 'git', url: 'git+https://github.com/theopenlane/openlane-ui.git', directory: 'packages/ui' },
  type: 'module',
  sideEffects: ['*.css'],
  exports: Object.fromEntries([
    ...entries.map(({ subpath, name, source: sourcePath }) => [subpath, { types: `./types/${sourcePath.replace(/\.tsx?$/, '.d.ts')}`, default: `./${name}.mjs` }]),
    ['./styles.css', './styles.css'],
    ['./package.json', './package.json'],
  ]),
  dependencies,
  peerDependencies,
  peerDependenciesMeta: Object.fromEntries(Object.entries(peerMeta).filter(([name]) => peerDependencies[name])),
  publishConfig: { access: 'public' },
}

writeFileSync(join(DIST, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`)
console.log(`[build-package-json] ${entries.length} exports, ${Object.keys(dependencies).length} dependencies, ${Object.keys(peerDependencies).length} peers → dist/package.json`)
