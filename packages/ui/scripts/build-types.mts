import { execFileSync } from 'node:child_process'
import { existsSync, globSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { DIST, PACKAGE_ROOT, importSpecifiers, publishedScriptEntries } from './publish-surface.mts'

const withRuntimeExtension = (file: string, specifier: string): string => {
  if (/\.(m?js|json)$/.test(specifier)) return specifier
  const bare = specifier.replace(/\.tsx?$/, '')
  const base = resolve(dirname(file), bare)
  if (existsSync(`${base}.d.ts`)) return `${bare}.js`
  if (existsSync(join(base, 'index.d.ts'))) return `${bare}/index.js`
  throw new Error(`[build-types] ${file} imports ${specifier}, which has no emitted declaration`)
}

const configPath = join(DIST, 'tsconfig.types.json')
mkdirSync(DIST, { recursive: true })
writeFileSync(
  configPath,
  JSON.stringify({
    extends: '../tsconfig.json',
    compilerOptions: {
      noEmit: false,
      declaration: true,
      declarationMap: false,
      emitDeclarationOnly: true,
      rootDir: '..',
      outDir: './types',
      lib: ['ES2020', 'DOM', 'DOM.Iterable'],
      types: ['node'],
      skipLibCheck: true,
    },
    include: [],
    files: publishedScriptEntries().map(({ source }) => `../${source}`),
  }),
)

const tsc = createRequire(import.meta.url).resolve('typescript/bin/tsc')
execFileSync(process.execPath, [tsc, '-p', configPath], { stdio: 'inherit', cwd: PACKAGE_ROOT })
rmSync(configPath)

for (const file of globSync(join(DIST, 'types', '**', '*.d.ts'))) {
  const source = readFileSync(file, 'utf8')
  const rewritten = importSpecifiers(source)
    .filter(({ specifier }) => specifier.startsWith('.'))
    .reduceRight((text, { specifier, start, end }) => `${text.slice(0, start)}${withRuntimeExtension(file, specifier)}${text.slice(end)}`, source)
  if (rewritten !== source) writeFileSync(file, rewritten)
}
