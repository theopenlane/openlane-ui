import fs from 'fs'
import path from 'path'

const baseDir = path.join(__dirname, '../src/app/(protected)')
const routeListPath = path.join(__dirname, '../src/route-list.json')

type RouteEntry = {
  route: string
  name: string
  keywords?: string[]
  hidden?: boolean
}

function toNameFromPath(pathStr: string): string {
  return (
    pathStr
      .split('/')
      .filter(Boolean)
      .pop()
      ?.replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase()) || 'Home'
  )
}

let existingRoutes: RouteEntry[] = []
if (fs.existsSync(routeListPath)) {
  try {
    existingRoutes = JSON.parse(fs.readFileSync(routeListPath, 'utf8'))
  } catch (err) {
    console.error('❌ Failed to parse route-list.json:', err)
  }
}

const discoveredRoutes: RouteEntry[] = []

function walk(currentPath: string, routePrefix = '') {
  if (!fs.existsSync(currentPath)) return

  const entries = fs.readdirSync(currentPath, { withFileTypes: true })

  for (const entry of entries) {
    if (entry.isDirectory()) {
      let nextPrefix = routePrefix
      if (entry.name.startsWith('(') && entry.name.endsWith(')')) {
        nextPrefix = routePrefix
      } else {
        nextPrefix = `${routePrefix}/${entry.name}`
      }

      walk(path.join(currentPath, entry.name), nextPrefix)
    } else if (entry.name.startsWith('page.tsx') && !routePrefix.includes('[')) {
      const route = routePrefix || '/'

      const existing = existingRoutes.find((r) => r.route === route)

      if (existing) {
        discoveredRoutes.push({ ...existing })
      } else {
        discoveredRoutes.push({
          route,
          name: toNameFromPath(route),
        })
      }
    }
  }
}

walk(baseDir)

const uniqueRoutes = discoveredRoutes.filter((value, index, self) => index === self.findIndex((t) => t.route === value.route))

uniqueRoutes.sort((a, b) => a.route.localeCompare(b.route))

const addedCount = uniqueRoutes.filter((d) => !existingRoutes.some((e) => e.route === d.route)).length

const removedCount = existingRoutes.filter((e) => !uniqueRoutes.some((d) => d.route === e.route)).length

fs.writeFileSync(routeListPath, JSON.stringify(uniqueRoutes, null, 2))

console.log(`✅ Route list synced.`)
console.log(`   Added: ${addedCount}`)
console.log(`   Removed: ${removedCount}`)
console.log(`   Total: ${uniqueRoutes.length}`)
