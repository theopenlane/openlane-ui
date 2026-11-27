import { closeSync, openSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import { test as authTest } from '../fixtures/auth'
import {
  createAsset,
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
  getDemoApi,
} from '../utils/api'
import { createAssessment, createAutomationCampaign, createQuestionnaireTemplate, createWorkflowDefinition } from '../utils/api-automation'
import { A11Y_TAG, COLOR_SCHEMES, expectNoA11yViolations, waitForPageToSettle } from '../utils/accessibility'
import { isSeededRecords, RECORD_SCAN_CASES, type SeededRecords } from '../utils/accessibility-routes'
import { AUTH_DIR, readManifest } from '../utils/manifest'
import { uniqueName, uniqueRef } from '../utils/unique'

const seedRecords = async (): Promise<SeededRecords> => {
  const api = await getDemoApi()
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
    asset: await createAsset(api, name('Asset')),
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

const hasErrorCode = (error: unknown, code: string): boolean => error instanceof Error && 'code' in error && error.code === code

const tryAcquireSeedLock = (lockPath: string): boolean => {
  try {
    closeSync(openSync(lockPath, 'wx'))
    return true
  } catch (error) {
    if (hasErrorCode(error, 'EEXIST')) return false
    throw error
  }
}

const readCachedRecords = (cachePath: string): SeededRecords | null => {
  try {
    const cached: unknown = JSON.parse(readFileSync(cachePath, 'utf-8'))
    return isSeededRecords(cached) ? cached : null
  } catch (error) {
    if (hasErrorCode(error, 'ENOENT')) return null
    throw error
  }
}

const loadOrSeedRecords = async (): Promise<SeededRecords> => {
  const cachePath = path.join(AUTH_DIR, `a11y-records-${readManifest().demoEmail.replace(/[^a-z0-9]/gi, '-')}.json`)
  const lockPath = `${cachePath}.lock`

  for (let attempt = 0; attempt < SEED_LOCK_ATTEMPTS; attempt++) {
    const cached = readCachedRecords(cachePath)
    if (cached) return cached

    if (tryAcquireSeedLock(lockPath)) {
      try {
        const seededMeanwhile = readCachedRecords(cachePath)
        if (seededMeanwhile) return seededMeanwhile

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

test.describe.configure({ retries: 0 })

for (const colorScheme of COLOR_SCHEMES) {
  test.describe(`accessibility — record pages (${colorScheme})`, { tag: A11Y_TAG }, () => {
    test.use({ colorScheme, authProfile: 'demo' })

    for (const { name, href, ready } of RECORD_SCAN_CASES) {
      test(`${name} has no WCAG 2.2 AA violations`, async ({ page, records }, testInfo) => {
        test.slow()
        await page.goto(href(records), { waitUntil: 'domcontentloaded' })
        await waitForPageToSettle(page, ready)

        await expectNoA11yViolations(page, testInfo)
      })
    }
  })
}
