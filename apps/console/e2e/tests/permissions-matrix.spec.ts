import type { Locator, Page } from '@playwright/test'

import { test, expect, readManifest, type Role } from '../fixtures/auth'
import { createCampaign, createSubscriber, deleteSubscriber, gql, loginViaApi, type ApiSession } from '../utils/api'
import { EMAIL_DOMAIN } from '../utils/constants'
import { uniqueRef } from '../utils/unique'
import { PERMISSION_GATES_ENABLED, PERMISSION_GATES_SKIP_REASON } from '../utils/permission-gating'

test.skip(!PERMISSION_GATES_ENABLED, PERMISSION_GATES_SKIP_REASON)

const ROLES: Role[] = ['owner', 'superadmin', 'admin', 'member', 'readonly']

const withSuperAdmin = (granted: Role[]): Role[] => (granted.includes('owner') ? [...granted, 'superadmin'] : granted)

interface Gate {
  permission: string
  affordanceLabel: string
  granted: Role[]
  url: string
  ready: (page: Page) => Locator
  affordance: (page: Page) => Locator
}

const shell = (page: Page): Locator => page.getByTestId('user-menu-trigger')
const createButton = (page: Page): Locator => page.getByRole('button', { name: /^Create$/ })

const ORG_LEVEL_GATES: Gate[] = [
  {
    permission: 'CanCreateGroup',
    affordanceLabel: 'the Create group button',
    granted: ['owner', 'admin'],
    url: '/user-management/groups',
    ready: (page) => page.getByRole('heading', { name: /^Groups$/ }),
    affordance: createButton,
  },
  {
    permission: 'CanCreatePlatform',
    affordanceLabel: 'the Create platform affordance',
    granted: ['owner', 'admin'],
    url: '/registry/platforms',
    ready: shell,
    affordance: (page) => page.getByRole('button', { name: /^Create Platform$/ }),
  },
  {
    permission: 'CanCreateContact',
    affordanceLabel: 'the Create contact button',
    granted: ['owner', 'admin'],
    url: '/registry/contacts',
    ready: shell,
    affordance: createButton,
  },
  {
    permission: 'CanCreateReview',
    affordanceLabel: 'the Create review button',
    granted: ['owner', 'admin', 'readonly'],
    url: '/exposure/reviews',
    ready: shell,
    affordance: createButton,
  },
  {
    permission: 'CanCreateRemediation',
    affordanceLabel: 'the Create remediation button',
    granted: ['owner', 'admin'],
    url: '/exposure/remediations',
    ready: shell,
    affordance: createButton,
  },
  {
    permission: 'CanCreateTemplate',
    affordanceLabel: 'the questionnaire template create affordance',
    granted: ['owner', 'admin'],
    url: '/automation/questionnaires/templates',
    ready: shell,
    affordance: createButton,
  },
  {
    permission: 'CanCreateCustomTypeEnum',
    affordanceLabel: 'the custom enum create affordance',
    granted: ['owner', 'admin'],
    url: '/organization-settings/custom-data?tab=enums',
    ready: shell,
    affordance: (page) => page.getByRole('button', { name: /^Create Enum$/ }),
  },
  {
    permission: 'CanCreateControl',
    affordanceLabel: 'the control create affordance',
    granted: ['owner', 'admin'],
    url: '/controls',
    ready: shell,
    affordance: (page) => page.getByRole('button', { name: /^Create control$/ }),
  },
  {
    permission: 'CanEditTrustCenter (subprocessors)',
    affordanceLabel: 'the subprocessor create affordance',
    granted: ['owner', 'admin'],
    url: '/trust-center/subprocessors',
    ready: shell,
    affordance: createButton,
  },
  {
    permission: 'CanInviteMembers',
    affordanceLabel: 'the Invite member button',
    granted: ['owner', 'admin', 'member'],
    url: '/user-management/members',
    ready: shell,
    affordance: (page) => page.getByRole('button', { name: /^invite member$/i }),
  },
  {
    permission: 'CanCreateCampaign',
    affordanceLabel: 'the Create campaign button',
    granted: ['owner', 'admin'],
    url: '/automation/campaigns',
    ready: shell,
    affordance: (page) => page.getByRole('button', { name: /^Create Campaign$/ }),
  },
  {
    permission: 'CanCreateFinding',
    affordanceLabel: 'the Create finding affordance',
    granted: ['owner', 'admin', 'readonly'],
    url: '/exposure/findings',
    ready: shell,
    affordance: createButton,
  },
  {
    permission: 'CanCreateVulnerability',
    affordanceLabel: 'the Create vulnerability affordance',
    granted: ['owner', 'admin'],
    url: '/exposure/vulnerabilities',
    ready: shell,
    affordance: createButton,
  },
  {
    permission: 'CanCreateAsset',
    affordanceLabel: 'the Create asset affordance',
    granted: ['owner', 'admin'],
    url: '/registry/assets',
    ready: shell,
    affordance: createButton,
  },
  {
    permission: 'CanCreateScan',
    affordanceLabel: 'the Create scan affordance',
    granted: ['owner', 'admin'],
    url: '/exposure/scans',
    ready: shell,
    affordance: createButton,
  },
  {
    permission: 'CanCreateSystemDetail',
    affordanceLabel: 'the Create system detail affordance',
    granted: ['owner', 'admin'],
    url: '/registry/system-details',
    ready: shell,
    affordance: createButton,
  },
  {
    permission: 'CanCreateIdentityHolder',
    affordanceLabel: 'the Create personnel affordance',
    granted: ['owner', 'admin'],
    url: '/registry/personnel',
    ready: shell,
    affordance: createButton,
  },
  {
    permission: 'CanCreateEntity',
    affordanceLabel: 'the Create vendor affordance',
    granted: ['owner', 'admin'],
    url: '/registry/vendors',
    ready: shell,
    affordance: createButton,
  },
  {
    permission: 'CanEdit (trust center NDAs)',
    affordanceLabel: 'an NDA template affordance',
    granted: ['owner', 'admin'],
    url: '/trust-center/NDAs',
    ready: shell,
    affordance: (page) => page.getByRole('button', { name: /^(Upload|Replace)$/ }),
  },
  {
    permission: 'CanCreateAssessment',
    affordanceLabel: 'the questionnaire create affordance',
    granted: ['owner', 'admin'],
    url: '/automation/questionnaires',
    ready: shell,
    affordance: createButton,
  },
]

for (const role of ROLES) {
  test.describe(`permissions matrix — ${role}`, () => {
    test.use({ authProfile: role })

    for (const gate of ORG_LEVEL_GATES) {
      const granted = withSuperAdmin(gate.granted).includes(role)

      test(`${gate.permission}: ${role} ${granted ? 'sees' : 'does not see'} ${gate.affordanceLabel}`, async ({ page }) => {
        test.slow()
        await page.goto(gate.url, { waitUntil: 'domcontentloaded', timeout: 180_000 })
        await expect(gate.ready(page)).toBeVisible({ timeout: 90_000 })

        if (granted) {
          await expect(gate.affordance(page).first()).toBeVisible({ timeout: 45_000 })
        } else {
          await expect(gate.affordance(page)).toHaveCount(0, { timeout: 30_000 })
        }
      })
    }
  })
}

const PROTECTED_AREA = /protected area/i

interface CreateRouteGate {
  permission: string
  entity: string
  granted: Role[]
  url: string
  present?: (page: Page) => Locator
}

const CREATE_ROUTE_GATES: CreateRouteGate[] = [
  { permission: 'CanCreateProgram', entity: 'program', granted: ['owner', 'admin'], url: '/programs/create', present: (page) => page.getByRole('heading', { name: /^Create New Program$/ }) },
  { permission: 'CanCreateInternalPolicy', entity: 'policy', granted: ['owner', 'admin'], url: '/policies/create' },
  { permission: 'CanCreateProcedure', entity: 'procedure', granted: ['owner', 'admin'], url: '/procedures/create' },
  { permission: 'CanCreateRisk', entity: 'risk', granted: ['owner', 'admin'], url: '/exposure/risks/create' },
  { permission: 'CanCreateSubcontrol', entity: 'subcontrol', granted: ['owner', 'admin'], url: '/controls/create-subcontrol' },
]

for (const role of ROLES) {
  test.describe(`permissions matrix — ${role} create routes`, () => {
    test.use({ authProfile: role })

    for (const gate of CREATE_ROUTE_GATES) {
      const granted = withSuperAdmin(gate.granted).includes(role)

      test(`${gate.permission}: ${role} ${granted ? 'reaches' : 'is blocked from'} the ${gate.entity} create page`, async ({ page }) => {
        test.slow()
        await page.goto(gate.url, { waitUntil: 'domcontentloaded', timeout: 180_000 })
        await expect(shell(page)).toBeVisible({ timeout: 90_000 })

        if (granted) {
          const present = gate.present ? gate.present(page) : page.locator('form button[type="submit"]')
          await expect(async () => {
            if (
              !(await present
                .first()
                .isVisible()
                .catch(() => false))
            ) {
              await page.reload({ waitUntil: 'domcontentloaded' })
            }
            await expect(present.first()).toBeVisible({ timeout: 20_000 })
          }).toPass({ timeout: 120_000 })
          await expect(page.getByText(PROTECTED_AREA)).toHaveCount(0)
        } else {
          await expect(page.getByText(PROTECTED_AREA).first()).toBeVisible({ timeout: 60_000 })
        }
      })
    }
  })
}

const EVIDENCE_GRANTED: Role[] = ['owner', 'admin', 'readonly']

for (const role of ROLES) {
  test.describe(`permissions matrix — ${role} evidence`, () => {
    test.use({ authProfile: role })

    const granted = withSuperAdmin(EVIDENCE_GRANTED).includes(role)

    test(`CanCreateEvidence: ${role} ${granted ? 'sees' : 'does not see'} the Submit Evidence CTA`, async ({ page }) => {
      test.slow()
      await page.goto('/evidence', { waitUntil: 'domcontentloaded', timeout: 180_000 })
      await expect(page.getByRole('heading', { name: /^Evidence Center$/ })).toBeVisible({ timeout: 90_000 })

      const cta = page.getByRole('button', { name: /^submit evidence$/i })
      if (granted) {
        await expect(cta).toBeVisible({ timeout: 45_000 })
      } else {
        await expect(cta).toHaveCount(0, { timeout: 30_000 })
      }
    })
  })
}

interface TrustCenterGate {
  permission: string
  affordanceLabel: string
  granted: Role[]
  url: string
  affordance: (page: Page) => Locator
}

const TRUST_CENTER_GATES: TrustCenterGate[] = []

for (const role of ROLES) {
  test.describe(`permissions matrix — ${role} trust center`, () => {
    test.use({ authProfile: role })

    for (const gate of TRUST_CENTER_GATES) {
      const granted = withSuperAdmin(gate.granted).includes(role)

      test(`${gate.permission}: ${role} ${granted ? 'sees' : 'does not see'} ${gate.affordanceLabel}`, async ({ page }) => {
        test.slow()
        await page.goto(gate.url, { waitUntil: 'domcontentloaded', timeout: 180_000 })
        await expect(shell(page)).toBeVisible({ timeout: 90_000 })

        if (granted) {
          await expect(gate.affordance(page).first()).toBeVisible({ timeout: 45_000 })
        } else {
          await expect(gate.affordance(page)).toHaveCount(0, { timeout: 30_000 })
        }
      })
    }
  })
}

const COMPLIANCE_TOGGLE_ENABLED: Role[] = ['owner', 'admin']

for (const role of ROLES) {
  test.describe(`permissions matrix — ${role} trust center compliance`, () => {
    test.use({ authProfile: role })

    const canToggle = COMPLIANCE_TOGGLE_ENABLED.includes(role)

    test(`CanEditTrustCenter (compliance): ${role} ${canToggle ? 'can' : 'cannot'} toggle a framework`, async ({ page }) => {
      test.slow()
      await page.goto('/trust-center/frameworks', { waitUntil: 'domcontentloaded', timeout: 180_000 })
      await expect(shell(page)).toBeVisible({ timeout: 90_000 })

      const switches = page.locator('[role="switch"]')
      await expect(switches.first()).toBeVisible({ timeout: 45_000 })

      const disabled = page.locator('[role="switch"][disabled], [role="switch"][data-disabled]')
      if (canToggle) {
        await expect(disabled).toHaveCount(0, { timeout: 30_000 })
      } else {
        await expect.poll(async () => disabled.count(), { timeout: 30_000 }).toBeGreaterThan(0)
      }
    })
  })
}

const TRUST_CENTER_EDITORS: Role[] = ['owner', 'admin']

const publishUpdateIsOperable = async (page: Page): Promise<boolean> => {
  const button = page.getByRole('button', { name: /^Publish Update$/ })
  if ((await button.count()) === 0) return false
  return button.first().evaluate((element) => {
    let node: HTMLElement | null = element as HTMLElement
    while (node) {
      if (window.getComputedStyle(node).pointerEvents === 'none') return false
      node = node.parentElement
    }
    return true
  })
}

for (const role of ROLES) {
  test.describe(`permissions matrix — ${role} trust center updates`, () => {
    test.use({ authProfile: role })

    const canPublish = TRUST_CENTER_EDITORS.includes(role)

    test(`CanEditTrustCenter: ${role} ${canPublish ? 'can' : 'cannot'} operate the update composer`, async ({ page }) => {
      test.slow()
      await page.goto('/trust-center/updates', { waitUntil: 'domcontentloaded', timeout: 180_000 })
      await expect(shell(page)).toBeVisible({ timeout: 90_000 })
      await expect(page.getByRole('button', { name: /^Publish Update$/ })).toHaveCount(canPublish ? 1 : await page.getByRole('button', { name: /^Publish Update$/ }).count(), { timeout: 45_000 })

      await expect.poll(async () => publishUpdateIsOperable(page), { timeout: 45_000 }).toBe(canPublish)
    })
  })
}

const DOCUMENT_CREATORS: Role[] = ['owner', 'admin']

for (const role of ROLES) {
  test.describe(`permissions matrix — ${role} trust center documents`, () => {
    test.use({ authProfile: role })

    const granted = DOCUMENT_CREATORS.includes(role)

    test(`CanEditTrustCenter (documents): ${role} ${granted ? 'sees' : 'does not see'} the New Document button`, async ({ page }) => {
      test.slow()
      await page.goto('/trust-center/documents', { waitUntil: 'domcontentloaded', timeout: 180_000 })
      await expect(shell(page)).toBeVisible({ timeout: 90_000 })

      const button = page.getByRole('button', { name: /^New Document$/ })
      if (granted) {
        await expect(button.first()).toBeVisible({ timeout: 45_000 })
      } else {
        await expect(button).toHaveCount(0, { timeout: 30_000 })
      }
    })
  })
}

test.describe('permissions matrix — subscribers', () => {
  let ownerApi: ApiSession
  let seededEmail: string

  test.beforeAll(async () => {
    const { ownerEmail, password } = readManifest()
    ownerApi = await loginViaApi(ownerEmail, password)
    seededEmail = `${uniqueRef('e2e-perm-sub').toLowerCase()}@${EMAIL_DOMAIN}`
    await createSubscriber(ownerApi, seededEmail)
  })

  test.afterAll(async () => {
    if (seededEmail) await deleteSubscriber(ownerApi, seededEmail).catch(() => {})
  })

  const openSubscribers = async (page: Page) => {
    await page.goto('/organization-settings/subscribers', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { level: 2, name: /^Subscribers$/ })).toBeVisible({ timeout: 60_000 })
  }

  for (const role of ROLES) {
    const canCreate = withSuperAdmin(['owner', 'admin']).includes(role)
    const canDeleteSubscriber = withSuperAdmin(['owner', 'admin']).includes(role)

    test.describe(role, () => {
      test.use({ authProfile: role })

      test(`CanCreateSubscriber: ${role} ${canCreate ? 'sees' : 'does not see'} Bulk Upload`, async ({ page }) => {
        test.slow()
        await openSubscribers(page)
        await page.getByRole('button', { name: 'Action', exact: true }).click()

        const bulkUpload = page.getByRole('button', { name: /^Bulk Upload$/ })
        if (canCreate) {
          await expect(bulkUpload).toBeVisible({ timeout: 15_000 })
        } else {
          await expect(bulkUpload).toHaveCount(0, { timeout: 15_000 })
        }
      })

      test(`CanEdit (subscribers): ${role} ${canDeleteSubscriber ? 'sees' : 'does not see'} the row delete`, async ({ page }) => {
        test.slow()
        await openSubscribers(page)
        await page.getByPlaceholder('Search').fill(seededEmail)

        const deleteButton = page.getByRole('button', { name: `Delete subscriber ${seededEmail}` })
        if (canDeleteSubscriber) {
          await expect(deleteButton).toBeVisible({ timeout: 30_000 })
        } else {
          await expect(deleteButton).toHaveCount(0, { timeout: 30_000 })
        }
      })
    })
  }
})

test.describe('permissions matrix — inline table editors', () => {
  for (const role of ROLES) {
    const canEditRows = withSuperAdmin(['owner', 'admin']).includes(role)

    test.describe(role, () => {
      test.use({ authProfile: role })

      test(`${role} ${canEditRows ? 'can' : 'cannot'} open the control owner editor`, async ({ page }) => {
        test.slow()
        await page.goto('/controls', { waitUntil: 'domcontentloaded', timeout: 180_000 })

        const ownerHeader = page.getByRole('button', { name: 'Owner', exact: true })
        await expect(async () => {
          if (!(await ownerHeader.isVisible().catch(() => false))) {
            await page.locator('.lucide-table').first().click({ timeout: 5_000 })
          }
          await expect(ownerHeader).toBeVisible({ timeout: 5_000 })
        }).toPass({ timeout: 90_000 })

        const editAffordance = page.locator('table span.border-dashed')
        if (canEditRows) {
          await expect.poll(() => editAffordance.count(), { timeout: 45_000 }).toBeGreaterThan(0)
        } else {
          await expect(editAffordance).toHaveCount(0, { timeout: 30_000 })
        }
      })
    })
  }
})

test.describe('permissions matrix — campaign detail', () => {
  let ownerApi: ApiSession
  let campaignId: string

  test.beforeAll(async () => {
    const { ownerEmail, password } = readManifest()
    ownerApi = await loginViaApi(ownerEmail, password)
    campaignId = await createCampaign(ownerApi, uniqueRef('e2e-perm-campaign'))
  })

  test.afterAll(async () => {
    if (campaignId) {
      await gql(ownerApi, 'mutation($id: ID!){ deleteCampaign(id: $id){ deletedID } }', { id: campaignId }).catch(() => {})
    }
  })

  for (const role of ROLES) {
    const canEditCampaign = withSuperAdmin(['owner', 'admin']).includes(role)

    test.describe(role, () => {
      test.use({ authProfile: role })

      test(`${role} ${canEditCampaign ? 'sees' : 'does not see'} the campaign Launch button`, async ({ page }) => {
        test.slow()
        await page.goto(`/automation/campaigns/${campaignId}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
        await expect(shell(page)).toBeVisible({ timeout: 90_000 })

        const launch = page.getByRole('button', { name: /^Launch$/ })
        if (canEditCampaign) {
          await expect(launch.first()).toBeVisible({ timeout: 45_000 })
        } else {
          await expect(launch).toHaveCount(0, { timeout: 30_000 })
        }
      })
    })
  }
})
