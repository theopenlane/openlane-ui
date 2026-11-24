import { readdirSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

import { isOneOf } from '@/utils/type-guards'

export const APP_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src', 'app')

const ROUTE_GROUPS = ['auth', 'protected', 'public'] as const

export type RouteGroup = (typeof ROUTE_GROUPS)[number] | 'root'

export type AppRoute = { template: string; group: RouteGroup; isDynamic: boolean; file: string }

const PAGE_FILE = /^page\.(tsx|ts|jsx|js)$/
const ROUTE_GROUP_SEGMENT = /^\((.+)\)$/
const DYNAMIC_SEGMENT = /^\[.+\]$/
const UNSUPPORTED_SEGMENT = /^(@|\(\.|\[\[?\.\.\.)/

const isKnownGroup = isOneOf(ROUTE_GROUPS)

const toGroup = (segment: string, file: string): RouteGroup => {
  const name = ROUTE_GROUP_SEGMENT.exec(segment)?.[1]
  if (name === undefined) return 'root'
  if (!isKnownGroup(name)) throw new Error(`Unknown route group "(${name})" at ${file}: add it to ROUTE_GROUPS in e2e/utils/app-routes.ts`)
  return name
}

const walk = (dir: string, segments: string[], routes: AppRoute[]): void => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)

    if (entry.isDirectory()) {
      if (entry.name.startsWith('_')) continue
      walk(path, [...segments, entry.name], routes)
      continue
    }

    if (!PAGE_FILE.test(entry.name)) continue

    const file = relative(APP_DIR, path)
    const unsupported = segments.find((segment) => UNSUPPORTED_SEGMENT.test(segment))
    if (unsupported) throw new Error(`Parallel, intercepting or catch-all segment "${unsupported}" in ${file} is not supported by e2e/utils/app-routes.ts`)
    const urlSegments = segments.filter((segment) => !ROUTE_GROUP_SEGMENT.test(segment))
    routes.push({
      template: `/${urlSegments.join('/')}`,
      group: segments.length > 0 ? toGroup(segments[0], file) : 'root',
      isDynamic: urlSegments.some((segment) => DYNAMIC_SEGMENT.test(segment)),
      file,
    })
  }
}

export const discoverAppRoutes = (): AppRoute[] => {
  const routes: AppRoute[] = []
  walk(APP_DIR, [], routes)
  if (routes.length === 0) throw new Error(`No page files found under ${APP_DIR}`)
  return routes.sort((a, b) => a.template.localeCompare(b.template))
}

export const routeParamNames = (template: string): string[] => [...template.matchAll(/\[([^\]]+)\]/g)].map((match) => match[1])

export const fillRouteParams = (template: string, params: Readonly<Record<string, string>> = {}): string =>
  template.replace(/\[([^\]]+)\]/g, (segment, name: string) => {
    const value = params[name]
    if (value === undefined) throw new Error(`No value for "${segment}" in ${template}`)
    return encodeURIComponent(value)
  })
