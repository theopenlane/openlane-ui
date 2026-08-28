import { test } from '../fixtures/auth'
import { uniqueName } from '../utils/unique'
import { bulkEditAndSave, selectFirstMatchingRow } from '../utils/mutations'
import {
  createActionPlan,
  createAsset,
  createControl,
  createContact,
  createFinding,
  createIdentityHolder,
  createRemediation,
  createReview,
  createRisk,
  createSystemDetail,
  createVendor,
  createVulnerability,
  getOwnerApi,
  type ApiSession,
} from '../utils/api'

interface BulkEditCase {
  slug: string
  route: string
  operationName: string
  entityLabel: string
  seed: (sess: ApiSession, name: string) => Promise<string>
}

const CASES: BulkEditCase[] = [
  { slug: 'assets', route: '/registry/assets', operationName: 'UpdateBulkAsset', entityLabel: 'asset', seed: (s, n) => createAsset(s, n) },
  { slug: 'contacts', route: '/registry/contacts', operationName: 'UpdateBulkContact', entityLabel: 'contact', seed: (s, n) => createContact(s, n) },
  { slug: 'findings', route: '/exposure/findings', operationName: 'UpdateBulkFinding', entityLabel: 'finding', seed: (s, n) => createFinding(s, n) },
  {
    slug: 'personnel',
    route: '/registry/personnel',
    operationName: 'UpdateBulkIdentityHolder',
    entityLabel: 'personnel',
    seed: (s, n) => createIdentityHolder(s, n, `${n.replace(/[^a-z0-9]/gi, '').toLowerCase()}@e2e-openlane.dev`),
  },
  { slug: 'remediations', route: '/exposure/remediations', operationName: 'UpdateBulkRemediation', entityLabel: 'remediation', seed: (s, n) => createRemediation(s, n) },
  { slug: 'reviews', route: '/exposure/reviews', operationName: 'UpdateBulkReview', entityLabel: 'review', seed: (s, n) => createReview(s, n) },
  { slug: 'system-details', route: '/registry/system-details', operationName: 'UpdateBulkSystemDetail', entityLabel: 'system detail', seed: (s, n) => createSystemDetail(s, n) },
  { slug: 'vendors', route: '/registry/vendors', operationName: 'UpdateBulkEntity', entityLabel: 'vendor', seed: (s, n) => createVendor(s, n) },
  {
    slug: 'vulnerabilities',
    route: '/exposure/vulnerabilities',
    operationName: 'UpdateBulkVulnerability',
    entityLabel: 'vulnerability',
    seed: (s, n) => createVulnerability(s, n, `CVE-${Date.now().toString(36)}`),
  },
]

let ownerApi: ApiSession

test.beforeAll(async () => {
  ownerApi = await getOwnerApi()
})

test.describe('bulk edit — every generic table dialog actually saves', () => {
  for (const entity of CASES) {
    test(`bulk editing a ${entity.slug} record saves the change`, async ({ page }) => {
      test.slow()
      const name = uniqueName(`E2E BulkEdit ${entity.slug}`)
      await entity.seed(ownerApi, name)

      await page.goto(entity.route, { waitUntil: 'domcontentloaded', timeout: 180_000 })
      await selectFirstMatchingRow(page, name)

      await bulkEditAndSave({
        page,
        operationName: entity.operationName,
        expectToast: `Successfully bulk updated selected ${entity.entityLabel}.`,
      })
    })
  }
})

test.describe('bulk edit — action plans on the risk Mitigation tab', () => {
  test('bulk editing an action plan saves the change', async ({ page }) => {
    test.slow()
    const riskId = await createRisk(ownerApi, uniqueName('E2E BulkEdit ap risk'))
    const name = uniqueName('E2E BulkEdit actionplan')
    await createActionPlan(ownerApi, name, { riskIDs: [riskId] })

    await page.goto(`/exposure/risks/${riskId}?tab=mitigation`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await selectFirstMatchingRow(page, name)

    await bulkEditAndSave({
      page,
      operationName: 'UpdateBulkActionPlan',
      expectToast: 'Successfully bulk updated selected action plan.',
    })
  })
})

test.describe('bulk edit — bespoke dialogs', () => {
  test('bulk editing a control saves the change', async ({ page }) => {
    test.slow()
    const refCode = uniqueName('E2E-BULKEDIT-CTRL').replace(/\s+/g, '-')
    await createControl(ownerApi, refCode)

    await page.goto('/controls', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await page.locator('.lucide-table').first().click()
    await selectFirstMatchingRow(page, refCode)

    await bulkEditAndSave({ page, field: 'Status', operationName: 'UpdateBulkControl' })
  })

  test('bulk editing a risk saves the change', async ({ page }) => {
    test.slow()
    const name = uniqueName('E2E BulkEdit risk')
    await createRisk(ownerApi, name)

    await page.goto('/exposure/risks', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await selectFirstMatchingRow(page, name)

    await bulkEditAndSave({ page, operationName: 'UpdateBulkRisk' })
  })
})
