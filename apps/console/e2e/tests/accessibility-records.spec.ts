import { closeSync, existsSync, openSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import { test as authTest } from '../fixtures/auth'
import {
  createControl,
  createFinding,
  createIdentityHolder,
  createInternalPolicy,
  createMappedControl,
  createPlatform,
  createProcedure,
  createProgram,
  createRisk,
  createStandard,
  createSubcontrol,
  createVendor,
  createVulnerability,
  getOwnerApi,
} from '../utils/api'
import { createAssessment, createAutomationCampaign, createQuestionnaireTemplate, createWorkflowDefinition } from '../utils/api-automation'
import { A11Y_TAG, COLOR_SCHEMES, expectNoA11yViolations, waitForPageToSettle, type ReadyLocator } from '../utils/accessibility'
import { AUTH_DIR, readManifest } from '../utils/manifest'
import { uniqueName, uniqueRef } from '../utils/unique'

type SeededRecords = {
  control: string
  subcontrol: string
  mappedControl: string
  policy: string
  procedure: string
  program: string
  risk: string
  finding: string
  vulnerability: string
  personnel: string
  platform: string
  vendor: string
  standard: string
  campaign: string
  assessment: string
  questionnaireTemplate: string
  workflowDefinition: string
}

type RecordRoute = { route: string; href: (records: SeededRecords) => string; ready?: ReadyLocator }

const seedRecords = async (): Promise<SeededRecords> => {
  const api = await getOwnerApi()
  const name = (prefix: string) => uniqueName(`E2E A11y ${prefix}`)
  const personnelName = name('Personnel')

  const control = await createControl(api, uniqueRef('A11Y-CTRL'))
  const mappedTo = await createControl(api, uniqueRef('A11Y-MAP'))
  const assessment = await createAssessment(api, name('Questionnaire'))

  return {
    control,
    subcontrol: await createSubcontrol(api, uniqueRef('A11Y-SUB'), control),
    mappedControl: await createMappedControl(api, control, mappedTo),
    policy: await createInternalPolicy(api, name('Policy')),
    procedure: await createProcedure(api, name('Procedure')),
    program: await createProgram(api, name('Program')),
    risk: await createRisk(api, name('Risk')),
    finding: await createFinding(api, name('Finding')),
    vulnerability: await createVulnerability(api, name('Vulnerability'), uniqueRef('A11Y-CVE')),
    personnel: await createIdentityHolder(api, personnelName, `${personnelName.replace(/[^a-z0-9]/gi, '').toLowerCase()}@e2e-openlane.dev`),
    platform: await createPlatform(api, name('Platform')),
    vendor: await createVendor(api, name('Vendor')),
    standard: await createStandard(api, name('Standard')),
    assessment,
    campaign: await createAutomationCampaign(api, name('Campaign'), { assessmentID: assessment }),
    questionnaireTemplate: await createQuestionnaireTemplate(api, name('Template')),
    workflowDefinition: await createWorkflowDefinition(api, name('Workflow')),
  }
}

const SEED_LOCK_POLL_MS = 1_000 // 1s
const SEED_LOCK_ATTEMPTS = 120

const isLockHeld = (error: unknown): boolean => error instanceof Error && 'code' in error && error.code === 'EEXIST'

const tryAcquireSeedLock = (lockPath: string): boolean => {
  try {
    closeSync(openSync(lockPath, 'wx'))
    return true
  } catch (error) {
    if (isLockHeld(error)) return false
    throw error
  }
}

const loadOrSeedRecords = async (): Promise<SeededRecords> => {
  const cachePath = path.join(AUTH_DIR, `a11y-records-${readManifest().sharedOrgId}.json`)
  const lockPath = `${cachePath}.lock`

  for (let attempt = 0; attempt < SEED_LOCK_ATTEMPTS; attempt++) {
    if (existsSync(cachePath)) return JSON.parse(readFileSync(cachePath, 'utf-8')) as SeededRecords

    if (tryAcquireSeedLock(lockPath)) {
      try {
        const records = await seedRecords()
        writeFileSync(cachePath, JSON.stringify(records))
        return records
      } finally {
        rmSync(lockPath, { force: true })
      }
    }

    await new Promise((resolve) => setTimeout(resolve, SEED_LOCK_POLL_MS))
  }

  throw new Error(`a11y records were not seeded within ${SEED_LOCK_ATTEMPTS} attempts (lock: ${lockPath})`)
}

const test = authTest.extend<object, { records: SeededRecords }>({
  records: [async ({ playwright: _playwright }, provide) => provide(await loadOrSeedRecords()), { scope: 'worker' }],
})

const noImplementations: ReadyLocator = (page) => page.getByText(/^No Implementations found for this/)

const tabRoutes = (route: string, href: (records: SeededRecords) => string, tabs: string[]): RecordRoute[] =>
  tabs.map((tab) => ({ route: `${route}?tab=${tab}`, href: (r) => `${href(r)}?tab=${tab}` }))

const DETAIL_TAB_ROUTES: RecordRoute[] = [
  ...tabRoutes('/controls/[id]', (r) => `/controls/${r.control}`, [
    'implementation',
    'guidance',
    'documentation',
    'evidence',
    'linked-controls',
    'findings-risks',
    'assets-scans',
    'reviews',
    'activity',
  ]),
  ...tabRoutes('/policies/[id]/view', (r) => `/policies/${r.policy}/view`, ['procedures', 'acknowledgements', 'history']),
  ...tabRoutes('/exposure/risks/[id]', (r) => `/exposure/risks/${r.risk}`, ['risk-review', 'mitigation', 'activity']),
  ...tabRoutes('/exposure/findings/[id]', (r) => `/exposure/findings/${r.finding}`, ['remediation', 'comments', 'history']),
  ...tabRoutes('/exposure/vulnerabilities/[id]', (r) => `/exposure/vulnerabilities/${r.vulnerability}`, ['exposure-map', 'remediation', 'comments', 'history']),
  ...tabRoutes('/registry/vendors/[id]', (r) => `/registry/vendors/${r.vendor}`, ['risk-review', 'contacts', 'directory', 'documents', 'activity']),
  ...tabRoutes('/registry/personnel/[id]', (r) => `/registry/personnel/${r.personnel}`, ['linked-accounts', 'documents', 'assessments', 'campaigns', 'history']),
]

const RECORD_ROUTES: RecordRoute[] = [
  { route: '/controls/[id]', href: (r) => `/controls/${r.control}` },
  { route: '/controls/[id]/control-implementation', href: (r) => `/controls/${r.control}/control-implementation`, ready: noImplementations },
  { route: '/controls/[id]/control-objectives', href: (r) => `/controls/${r.control}/control-objectives` },
  { route: '/controls/[id]/map-control', href: (r) => `/controls/${r.control}/map-control` },
  { route: '/controls/[id]/edit-map-control', href: (r) => `/controls/${r.control}/edit-map-control?mappedControlId=${r.mappedControl}` },
  { route: '/controls/[id]/clone-control', href: (r) => `/controls/${r.control}/clone-control` },
  { route: '/controls/[id]/create-subcontrol', href: (r) => `/controls/${r.control}/create-subcontrol` },
  { route: '/controls/[id]/[subcontrolId]', href: (r) => `/controls/${r.control}/${r.subcontrol}` },
  { route: '/controls/[id]/[subcontrolId]/control-implementation', href: (r) => `/controls/${r.control}/${r.subcontrol}/control-implementation`, ready: noImplementations },
  { route: '/controls/[id]/[subcontrolId]/control-objectives', href: (r) => `/controls/${r.control}/${r.subcontrol}/control-objectives` },
  { route: '/controls/[id]/[subcontrolId]/map-control', href: (r) => `/controls/${r.control}/${r.subcontrol}/map-control` },
  { route: '/standards/[id]', href: (r) => `/standards/${r.standard}` },
  { route: '/programs/[id]', href: (r) => `/programs/${r.program}` },
  { route: '/programs/[id]/settings', href: (r) => `/programs/${r.program}/settings` },
  { route: '/policies/[id]/view', href: (r) => `/policies/${r.policy}/view` },
  { route: '/procedures/[id]/view', href: (r) => `/procedures/${r.procedure}/view` },
  { route: '/exposure/risks/[id]', href: (r) => `/exposure/risks/${r.risk}` },
  { route: '/exposure/findings/[id]', href: (r) => `/exposure/findings/${r.finding}` },
  { route: '/exposure/vulnerabilities/[id]', href: (r) => `/exposure/vulnerabilities/${r.vulnerability}` },
  { route: '/registry/personnel/[id]', href: (r) => `/registry/personnel/${r.personnel}` },
  { route: '/registry/platforms/[id]', href: (r) => `/registry/platforms/${r.platform}` },
  { route: '/registry/vendors/[id]', href: (r) => `/registry/vendors/${r.vendor}` },
  { route: '/automation/campaigns/[id]', href: (r) => `/automation/campaigns/${r.campaign}` },
  { route: '/automation/questionnaires/[id]', href: (r) => `/automation/questionnaires/${r.assessment}` },
  { route: '/automation/questionnaires/templates/template-viewer?id=', href: (r) => `/automation/questionnaires/templates/template-viewer?id=${r.questionnaireTemplate}` },
  { route: '/automation/workflows/definitions/[id]', href: (r) => `/automation/workflows/definitions/${r.workflowDefinition}` },
]

test.describe.configure({ retries: 0 })

for (const colorScheme of COLOR_SCHEMES) {
  test.describe(`accessibility — record pages (${colorScheme})`, { tag: A11Y_TAG }, () => {
    test.use({ colorScheme })

    for (const { route, href, ready } of [...RECORD_ROUTES, ...DETAIL_TAB_ROUTES]) {
      test(`${route} has no WCAG 2.2 AA violations`, async ({ page, records }, testInfo) => {
        test.slow()
        await page.goto(href(records), { waitUntil: 'domcontentloaded' })
        await waitForPageToSettle(page, ready)

        await expectNoA11yViolations(page, testInfo)
      })
    }
  })
}
