const fs = require('fs')
const path = require('path')

const CORE_REF = process.env.OPENLANE_CORE_REF || 'main'
const CATALOG_URL = `https://raw.githubusercontent.com/theopenlane/core/${CORE_REF}/fga/model/generated/permissions.json`
const OUTPUT_PATH = path.join(__dirname, '..', 'src', 'permissions.generated.ts')

const isAccessEnumRelation = (relation) => relation.startsWith('can_') || relation === 'audit_log_viewer'

const toPascalCase = (relation) =>
  relation
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')

const loadCatalog = async () => {
  const localPath = process.env.OPENLANE_PERMISSIONS_CATALOG
  if (localPath) {
    return JSON.parse(fs.readFileSync(localPath, 'utf8'))
  }

  const res = await fetch(CATALOG_URL)
  if (res.status === 404) {
    const err = new Error(`permission catalog not published at ${CATALOG_URL} (404)`)
    err.notPublished = true
    throw err
  }
  if (!res.ok) {
    throw new Error(`failed to fetch permission catalog from ${CATALOG_URL}: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

const buildOutput = (relations) => {
  const sorted = [...relations].sort()

  const enumMembers = sorted.filter(isAccessEnumRelation)

  const seen = new Map()
  for (const relation of enumMembers) {
    const key = toPascalCase(relation)
    if (seen.has(key) && seen.get(key) !== relation) {
      throw new Error(`AccessEnum name collision: "${key}" maps to both "${seen.get(key)}" and "${relation}"`)
    }
    seen.set(key, relation)
  }

  const lines = []
  lines.push('/* eslint-disable */')
  lines.push('')
  lines.push('export enum AccessEnum {')
  for (const relation of enumMembers) {
    lines.push(`  ${toPascalCase(relation)} = '${relation}',`)
  }
  lines.push('}')
  lines.push('')
  lines.push('export type TAccessRole =')
  lines.push(sorted.map((relation) => `  | '${relation}'`).join('\n'))
  lines.push('')

  return lines.join('\n')
}

;(async () => {
  let catalog
  try {
    catalog = await loadCatalog()
  } catch (err) {
    if (err.notPublished && fs.existsSync(OUTPUT_PATH)) {
      console.warn(`generate-permissions: ${err.message}; keeping existing ${path.basename(OUTPUT_PATH)}`)
      return
    }
    throw err
  }

  const relations = catalog && Array.isArray(catalog.organization) ? catalog.organization : null
  if (!relations || relations.length === 0) {
    throw new Error('permission catalog is missing a non-empty "organization" array')
  }

  fs.writeFileSync(OUTPUT_PATH, buildOutput(relations))
  console.log(`generated ${path.relative(path.join(__dirname, '..'), OUTPUT_PATH)} with ${relations.length} relation(s)`)
})().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
