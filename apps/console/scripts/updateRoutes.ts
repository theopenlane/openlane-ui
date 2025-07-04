import fs from 'fs'
import path from 'path'

const baseDir = path.join(__dirname, '../src/app/(protected)')
const routeListPath = path.join(__dirname, '../src/route-list.json')

type RouteEntry = { route: string; name: string }

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

const existingRouteSet = new Set(existingRoutes.map((r) => r.route))
const newRoutes: RouteEntry[] = []

function walk(currentPath: string, routePrefix = '') {
  const entries = fs.readdirSync(currentPath, { withFileTypes: true })

  for (const entry of entries) {
    if (entry.isDirectory()) {
      walk(path.join(currentPath, entry.name), `${routePrefix}/${entry.name}`)
    } else if (entry.name.startsWith('page.tsx') && !routePrefix.includes('[')) {
      const route = routePrefix || '/'
      if (!existingRouteSet.has(route)) {
        newRoutes.push({
          route,
          name: toNameFromPath(route),
        })
        existingRouteSet.add(route)
      }
    }
  }
}

walk(baseDir)

const updatedRoutes = [...existingRoutes, ...newRoutes]

fs.writeFileSync(routeListPath, JSON.stringify(updatedRoutes, null, 2))
console.log(`✅ Route list updated. ${newRoutes.length} new route(s) added.`)
