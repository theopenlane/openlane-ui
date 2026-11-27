import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

export const PACKAGE_ROOT = fileURLToPath(new URL('..', import.meta.url))
export const DIST = join(PACKAGE_ROOT, 'dist')
export const SELF = '@theopenlane/ui'

export const UNPUBLISHED_EXPORTS = new Set(['./data-table', './pinned-columns', './table-key', './table-types', './lib/markdown-joiner-transform'])

export type SourceManifest = {
  exports: Record<string, string>
  dependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  peerDependenciesMeta?: Record<string, { optional?: boolean }>
}

export type PublishedEntry = {
  subpath: string
  name: string
  source: string
}

export type ImportSpecifier = {
  specifier: string
  start: number
  end: number
}

export const readSourceManifest = (): SourceManifest => JSON.parse(readFileSync(join(PACKAGE_ROOT, 'package.json'), 'utf8')) as SourceManifest

export const publishedScriptEntries = (): PublishedEntry[] =>
  Object.entries(readSourceManifest().exports)
    .filter(([subpath, target]) => !subpath.includes('*') && !UNPUBLISHED_EXPORTS.has(subpath) && /\.tsx?$/.test(target))
    .map(([subpath, target]) => ({ subpath, name: subpath.slice(2), source: target.slice(2) }))

export const importSpecifiers = (text: string): ImportSpecifier[] =>
  ts.preProcessFile(text, true, true).importedFiles.map(({ fileName, pos }) => ({ specifier: fileName, start: pos + 1, end: pos + 1 + fileName.length }))
