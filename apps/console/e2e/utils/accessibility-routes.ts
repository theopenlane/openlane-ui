import { dashboardWelcome, heading, type ReadyLocator } from './accessibility'
import { discoverAppRoutes, fillRouteParams, routeParamNames, type AppRoute } from './app-routes'
import { LOGIN_EMAIL_INPUT, SIGNUP_EMAIL_INPUT } from './constants'
import { isRecord } from '@/utils/type-guards'

export const SEEDED_RECORD_KEYS = [
  'control',
  'subcontrol',
  'mappedControl',
  'policy',
  'procedure',
  'program',
  'risk',
  'finding',
  'vulnerability',
  'personnel',
  'platform',
  'vendor',
  'standard',
  'campaign',
  'assessment',
  'questionnaireTemplate',
  'workflowDefinition',
] as const

export type SeededRecords = Record<(typeof SEEDED_RECORD_KEYS)[number], string>

export const isSeededRecords = (value: unknown): value is SeededRecords => isRecord(value) && SEEDED_RECORD_KEYS.every((key) => typeof value[key] === 'string' && value[key] !== '')

export type RouteSuite = 'app' | 'public' | 'trust-center' | 'records'

export type ScanCase = { name: string; path: string; ready?: ReadyLocator }

export type RecordScanCase = { name: string; href: (records: SeededRecords) => string; ready?: ReadyLocator }

type RouteScan = { ready?: ReadyLocator; query?: string; params?: Readonly<Record<string, string>> }

type RecordScan = {
  params?: (records: SeededRecords) => Readonly<Record<string, string>>
  query?: (records: SeededRecords) => string
  ready?: ReadyLocator
  tabs?: readonly string[]
}

const noImplementations: ReadyLocator = (page) => page.getByText(/^No Implementations found for this/)

const ROUTE_SCANS: Readonly<Record<string, RouteScan>> = {
  '/dashboard': { ready: dashboardWelcome },
  '/import': { query: 'type=control' },
  '/programs': { ready: heading(/^Programs$/) },
  '/controls': { ready: heading(/^Controls$/) },
  '/standards': { ready: heading(/^Standards Catalog$/) },
  '/standards/template-controls': {
    ready: (page) =>
      page
        .getByRole('navigation', { name: /breadcrumb/i })
        .getByText(/^Template Controls$/)
        .or(page.getByText('Template controls are not available yet'))
        .first(),
  },
  '/policies': { ready: heading(/^Internal Policies$/) },
  '/procedures': { ready: heading(/^Procedures$/) },
  '/evidence': { ready: heading(/^Evidence Center/) },
  '/exposure/triage': { ready: (page) => page.getByPlaceholder('Search vulnerabilities…') },
  '/exposure/risks': { ready: heading(/^Risks$/) },
  '/registry/vendors': { ready: heading(/^Vendors$/) },
  '/automation/tasks': { ready: heading(/^Tasks$/) },
  '/organization-settings/general-settings': { ready: heading(/^General$/) },
  '/user-settings/profile': { ready: heading(/^My profile$/) },

  '/login': { ready: (page) => page.locator(LOGIN_EMAIL_INPUT) },
  '/signup': { ready: (page) => page.locator(SIGNUP_EMAIL_INPUT) },
  '/forgot-password': { ready: (page) => page.locator(SIGNUP_EMAIL_INPUT) },
  '/password-reset': { ready: (page) => page.getByText(/^Choose a new password$/) },
  '/verify': { ready: (page) => page.getByText(/Thank you for signing up/) },
  '/questionnaire': { ready: (page) => page.getByText(/unable to load questionnaire/i) },
  '/orgs/[slug]/sso': { params: { slug: 'e2e-a11y' } },
}

const control = (r: SeededRecords) => ({ id: r.control })
const subcontrol = (r: SeededRecords) => ({ id: r.control, subcontrolId: r.subcontrol })
const recordId = (key: keyof SeededRecords) => (r: SeededRecords) => ({ id: r[key] })

const RECORD_SCANS: Readonly<Record<string, RecordScan>> = {
  '/controls/[id]': {
    params: control,
    tabs: ['implementation', 'guidance', 'documentation', 'evidence', 'linked-controls', 'findings-risks', 'assets-scans', 'reviews', 'activity'],
  },
  '/controls/[id]/control-implementation': { params: control, ready: noImplementations },
  '/controls/[id]/control-objectives': { params: control },
  '/controls/[id]/map-control': { params: control },
  '/controls/[id]/edit-map-control': { params: control, query: (r) => `mappedControlId=${r.mappedControl}` },
  '/controls/[id]/clone-control': { params: control },
  '/controls/[id]/create-subcontrol': { params: control },
  '/controls/[id]/[subcontrolId]': { params: subcontrol },
  '/controls/[id]/[subcontrolId]/control-implementation': { params: subcontrol, ready: noImplementations },
  '/controls/[id]/[subcontrolId]/control-objectives': { params: subcontrol },
  '/controls/[id]/[subcontrolId]/map-control': { params: subcontrol },
  '/controls/[id]/[subcontrolId]/edit-map-control': { params: subcontrol, query: (r) => `mappedControlId=${r.mappedControl}` },
  '/standards/[id]': { params: recordId('standard') },
  '/programs/[id]': { params: recordId('program') },
  '/programs/[id]/settings': { params: recordId('program') },
  '/policies/[id]/view': { params: recordId('policy'), tabs: ['procedures', 'acknowledgements', 'history'] },
  '/procedures/[id]/view': { params: recordId('procedure') },
  '/exposure/risks/[id]': { params: recordId('risk'), tabs: ['risk-review', 'mitigation', 'activity'] },
  '/exposure/findings/[id]': { params: recordId('finding'), tabs: ['remediation', 'comments', 'history'] },
  '/exposure/vulnerabilities/[id]': { params: recordId('vulnerability'), tabs: ['exposure-map', 'remediation', 'comments', 'history'] },
  '/registry/personnel/[id]': { params: recordId('personnel'), tabs: ['linked-accounts', 'documents', 'assessments', 'campaigns', 'history'] },
  '/registry/platforms/[id]': { params: recordId('platform') },
  '/registry/vendors/[id]': { params: recordId('vendor'), tabs: ['risk-review', 'contacts', 'directory', 'documents', 'activity'] },
  '/automation/campaigns/[id]': { params: recordId('campaign') },
  '/automation/questionnaires/[id]': { params: recordId('assessment') },
  '/automation/questionnaires/templates/template-viewer': { query: (r) => `id=${r.questionnaireTemplate}` },
  '/automation/workflows/definitions/[id]': { params: recordId('workflowDefinition') },
}

const EXCLUDED_ROUTES: Readonly<Record<string, string>> = {
  '/': 'client redirect to /dashboard',
  '/exposure': 'redirects to /exposure/overview',
  '/registry/vulnerabilities': 'redirects to /exposure/vulnerabilities',
  '/policies/[id]': 'redirects to /policies/[id]/view',
  '/procedures/[id]': 'redirects to /procedures/[id]/view',
  '/reports/[id]': 'redirects to the saved report (/reports/saved)',
  '/invite': 'needs a real invite token; without one it only shows the accepting state',
  '/login/sso': 'OAuth callback: redirects as soon as it reads the callback params',
  '/login/sso/enforce': 'needs the direct_oauth cookie and its query params, otherwise redirects to /login',
  '/login/support/callback': 'OAuth callback: redirects as soon as it reads the callback params',
  '/tfa': 'needs a pending two-factor session (access_token cookie)',
  '/automation/integrations/[definitionId]': 'needs an installed integration fixture; core has no createIntegration',
  '/automation/integrations/[definitionId]/health': 'needs an installed integration fixture; core has no createIntegration',
  '/automation/integrations/[definitionId]/health/runs/[runId]': 'needs an integration run fixture; core has no createIntegration',
}

const withQuery = (path: string, query?: string): string => (query ? `${path}${path.includes('?') ? '&' : '?'}${query}` : path)

const recordHref =
  (template: string, { params, query }: RecordScan) =>
  (records: SeededRecords): string =>
    withQuery(fillRouteParams(template, params?.(records)), query?.(records))

const suiteOf = (route: AppRoute): RouteSuite => {
  if (route.group === 'auth' || route.group === 'public') return 'public'
  if (route.template.startsWith('/trust-center/')) return 'trust-center'
  return route.isDynamic ? 'records' : 'app'
}

const collectProblems = (routes: AppRoute[]): string[] => {
  const byTemplate = new Map(routes.map((route) => [route.template, route]))
  const problems: string[] = []

  const checkKeys = (table: string, keys: string[]) => {
    for (const key of keys) {
      if (!byTemplate.has(key)) problems.push(`${table} has "${key}", which matches no page.tsx under src/app`)
    }
  }
  checkKeys('ROUTE_SCANS', Object.keys(ROUTE_SCANS))
  checkKeys('RECORD_SCANS', Object.keys(RECORD_SCANS))
  checkKeys('EXCLUDED_ROUTES', Object.keys(EXCLUDED_ROUTES))

  for (const route of routes) {
    const { template } = route
    const excluded = template in EXCLUDED_ROUTES
    const scanned = template in ROUTE_SCANS || template in RECORD_SCANS
    if (excluded && scanned) problems.push(`"${template}" is both excluded and scanned`)
    if (excluded || !route.isDynamic) continue

    const suite = suiteOf(route)
    if (suite === 'records' && !(template in RECORD_SCANS)) {
      problems.push(`"${template}" (${route.file}) needs a RECORD_SCANS resolver or an EXCLUDED_ROUTES reason`)
    }
    if (suite === 'records' && template in ROUTE_SCANS) problems.push(`"${template}" is a record page: move it from ROUTE_SCANS to RECORD_SCANS`)
    if (suite !== 'records') {
      const params = ROUTE_SCANS[template]?.params ?? {}
      const missing = routeParamNames(template).filter((name) => !(name in params))
      if (missing.length > 0) problems.push(`"${template}" (${route.file}) needs ROUTE_SCANS params for ${missing.join(', ')} or an EXCLUDED_ROUTES reason`)
    }
  }

  const placeholders = Object.fromEntries(SEEDED_RECORD_KEYS.map((key) => [key, key]))
  if (!isSeededRecords(placeholders)) return [...problems, 'SEEDED_RECORD_KEYS placeholders do not form a SeededRecords']
  for (const [template, scan] of Object.entries(RECORD_SCANS)) {
    try {
      recordHref(template, scan)(placeholders)
    } catch (error) {
      problems.push(`RECORD_SCANS["${template}"]: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return problems
}

const ROUTES = discoverAppRoutes()

export const ROUTE_TABLE_PROBLEMS = collectProblems(ROUTES)

const hasEveryParam = (template: string, params: Readonly<Record<string, string>> = {}): boolean => routeParamNames(template).every((name) => name in params)

export const scanCasesFor = (suite: Exclude<RouteSuite, 'records'>): ScanCase[] =>
  ROUTES.filter(
    (route) => suiteOf(route) === suite && !(route.template in EXCLUDED_ROUTES) && !(route.template in RECORD_SCANS) && hasEveryParam(route.template, ROUTE_SCANS[route.template]?.params),
  ).map(({ template }) => {
    const { ready, query, params } = ROUTE_SCANS[template] ?? {}
    const path = withQuery(fillRouteParams(template, params), query)
    return { name: path, path, ready }
  })

export const RECORD_SCAN_CASES: RecordScanCase[] = Object.entries(RECORD_SCANS).flatMap(([template, scan]) => {
  const href = recordHref(template, scan)
  return [
    { name: template, href, ready: scan.ready },
    ...(scan.tabs ?? []).map((tab) => ({ name: `${template}?tab=${tab}`, href: (records: SeededRecords) => withQuery(href(records), `tab=${tab}`) })),
  ]
})
