const fs = require('fs')
const path = require('path')

const baseDir = path.join(__dirname, '../src/app/(protected)')

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

const routes: { route: string; name: string }[] = []

function walk(currentPath: string, routePrefix = '') {
  const entries = fs.readdirSync(currentPath, { withFileTypes: true })

  for (const entry of entries) {
    if (entry.isDirectory()) {
      walk(path.join(currentPath, entry.name), `${routePrefix}/${entry.name}`)
    } else if (entry.name.startsWith('page.tsx') && !routePrefix.includes('[')) {
      routes.push({
        route: routePrefix || '/',
        name: toNameFromPath(routePrefix),
      })
    }
  }
}

walk(baseDir)

fs.writeFileSync(path.join(__dirname, '../src/route-list.json'), JSON.stringify(routes, null, 2))

console.log('✅ Route list generated:', routes)
