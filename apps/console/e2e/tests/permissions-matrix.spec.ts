import type { Locator, Page } from '@playwright/test'

import { test, expect, type SeededRole } from '../fixtures/seeded-auth'
import { createCampaign, createSubscriber, deleteSubscriber, gql, type ApiSession } from '../utils/api'
import { loginSeeded } from '../utils/seeded-users'
import { EMAIL_DOMAIN } from '../utils/constants'
import { uniqueRef } from '../utils/unique'

const ROLES: SeededRole[] = ['owner', 'admin', 'member', 'readonly']

interface Gate {
  permission: string
  affordanceLabel: string
  granted: SeededRole[]
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
    permission: 'CanCreateTrustCenterSubprocessor',
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
  // Campaigns is a list route, not an admin-only surface: can_view_campaign is
  // its own FGA relation and the nav shows the entry to every role, so a viewer
  // reaches the list and only loses the create affordance.
  {
    permission: 'CanCreateCampaign',
    affordanceLabel: 'the Create campaign button',
    granted: ['owner', 'admin'],
    url: '/automation/campaigns',
    ready: shell,
    affordance: (page) => page.getByRole('button', { name: /^Create Campaign$/ }),
  },
  {
    // PERMISSIONS.md: AUDITOR is not read-only — it creates and deletes evidence,
    // findings and reviews, which is why CanCreateReview grants readonly too.
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
    // The NDA page shows Upload before a template exists and Replace after, both
    // behind canEditTc — the same boolean that now gates the NDA request table.
    permission: 'CanEdit (trust center NDAs)',
    affordanceLabel: 'an NDA template affordance',
    granted: ['owner', 'admin'],
    url: '/trust-center/NDAs',
    ready: shell,
    affordance: (page) => page.getByRole('button', { name: /^(Upload|Replace)$/ }),
  },
  {
    // /automation/workflows renders the definitions table when the org has any,
    // and an embedded wizard when it does not. Both create surfaces gate on the
    // same relation, so match either rather than depending on org contents.
    permission: 'CanCreateWorkflowDefinition',
    affordanceLabel: 'a workflow create affordance',
    granted: ['owner', 'admin'],
    url: '/automation/workflows',
    ready: shell,
    affordance: (page) => page.getByRole('button', { name: /^(Create|Continue|Create workflow)$/ }),
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
    test.use({ seededRole: role })

    for (const gate of ORG_LEVEL_GATES) {
      const granted = gate.granted.includes(role)

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
  granted: SeededRole[]
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
    test.use({ seededRole: role })

    for (const gate of CREATE_ROUTE_GATES) {
      const granted = gate.granted.includes(role)

      test(`${gate.permission}: ${role} ${granted ? 'reaches' : 'is blocked from'} the ${gate.entity} create page`, async ({ page }) => {
        test.slow()
        await page.goto(gate.url, { waitUntil: 'domcontentloaded', timeout: 180_000 })
        await expect(shell(page)).toBeVisible({ timeout: 90_000 })

        if (granted) {
          const present = gate.present ? gate.present(page) : page.locator('form button[type="submit"]')
          await expect(present.first()).toBeVisible({ timeout: 60_000 })
          await expect(page.getByText(PROTECTED_AREA)).toHaveCount(0)
        } else {
          await expect(page.getByText(PROTECTED_AREA).first()).toBeVisible({ timeout: 60_000 })
        }
      })
    }
  })
}

const EVIDENCE_GRANTED: SeededRole[] = ['owner', 'admin', 'readonly']

for (const role of ROLES) {
  test.describe(`permissions matrix — ${role} evidence`, () => {
    test.use({ seededRole: role })

    const granted = EVIDENCE_GRANTED.includes(role)

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
  granted: SeededRole[]
  url: string
  affordance: (page: Page) => Locator
}

const TRUST_CENTER_GATES: TrustCenterGate[] = []

for (const role of ROLES) {
  test.describe(`permissions matrix — ${role} trust center`, () => {
    test.use({ seededRole: role })

    for (const gate of TRUST_CENTER_GATES) {
      const granted = gate.granted.includes(role)

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

const COMPLIANCE_TOGGLE_ENABLED: SeededRole[] = ['owner', 'admin']

for (const role of ROLES) {
  test.describe(`permissions matrix — ${role} trust center compliance`, () => {
    test.use({ seededRole: role })

    const canToggle = COMPLIANCE_TOGGLE_ENABLED.includes(role)

    test(`CanEditTrustCenterCompliance: ${role} ${canToggle ? 'can' : 'cannot'} toggle a framework`, async ({ page }) => {
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

const TRUST_CENTER_EDITORS: SeededRole[] = ['owner', 'admin']

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
    test.use({ seededRole: role })

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

const DOCUMENT_CREATORS: SeededRole[] = ['owner', 'admin']

for (const role of ROLES) {
  test.describe(`permissions matrix — ${role} trust center documents`, () => {
    test.use({ seededRole: role })

    const granted = DOCUMENT_CREATORS.includes(role)

    test(`CanCreateTrustCenterDocument: ${role} ${granted ? 'sees' : 'does not see'} the New Document button`, async ({ page }) => {
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

interface RouteGate {
  permission: string
  granted: SeededRole[]
  url: string
}

const GATED_ROUTES: RouteGate[] = [
  { permission: 'CanCreateEmailTemplate', granted: ['owner', 'admin'], url: '/automation/email-templates/editor' },
  { permission: 'CanCreateWorkflowDefinition', granted: ['owner', 'admin'], url: '/automation/workflows/editor' },
  { permission: 'CanCreateWorkflowDefinition (wizard)', granted: ['owner', 'admin'], url: '/automation/workflows/wizard' },
  { permission: 'CanEdit (org settings)', granted: ['owner', 'admin'], url: '/organization-settings/authentication' },
  { permission: 'CanCreateTrustCenterFaq', granted: ['owner', 'admin'], url: '/trust-center/faqs' },
  { permission: 'CanCreateSubscriber', granted: ['owner', 'admin'], url: '/trust-center/subscribers' },
  { permission: 'CanCreateCustomDomain', granted: ['owner', 'admin'], url: '/trust-center/domain' },
  { permission: 'CanEdit (trust center branding)', granted: ['owner', 'admin'], url: '/trust-center/branding' },
  { permission: 'CanEdit (customer logos)', granted: ['owner', 'admin'], url: '/trust-center/customer-logos' },
]

for (const role of ROLES) {
  test.describe(`permissions matrix — ${role} gated routes`, () => {
    test.use({ seededRole: role })

    for (const gate of GATED_ROUTES) {
      const granted = gate.granted.includes(role)

      test(`${gate.permission}: ${role} ${granted ? 'reaches' : 'is blocked from'} ${gate.url}`, async ({ page }) => {
        test.slow()
        await page.goto(gate.url, { waitUntil: 'domcontentloaded', timeout: 180_000 })
        await expect(shell(page)).toBeVisible({ timeout: 90_000 })

        const guard = page.getByText(PROTECTED_AREA)
        if (granted) {
          await expect(guard).toHaveCount(0, { timeout: 30_000 })
        } else {
          await expect(guard.first()).toBeVisible({ timeout: 60_000 })
        }
      })
    }
  })
}

// can_create_subscriber resolves through can_edit (owner + admin), but
// can_delete_subscriber is `[service, user] or full_access` and full_access is
// `super_admin or owner` — so a plain admin cannot delete. The two affordances
// live behind different relations on the same page.
test.describe('permissions matrix — subscribers', () => {
  let ownerApi: ApiSession
  let seededEmail: string

  test.beforeAll(async () => {
    ownerApi = await loginSeeded('owner')
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
    const canCreate = role === 'owner' || role === 'admin'
    const canDeleteSubscriber = role === 'owner'

    test.describe(role, () => {
      test.use({ seededRole: role })

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

      test(`CanDeleteSubscriber: ${role} ${canDeleteSubscriber ? 'sees' : 'does not see'} the row delete`, async ({ page }) => {
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

// The owner/delegate cells are inline editors, not buttons: without can_edit the
// cell still renders its value but stops turning into a combobox on click.
test.describe('permissions matrix — inline table editors', () => {
  for (const role of ROLES) {
    const canEditRows = role === 'owner' || role === 'admin'

    test.describe(role, () => {
      test.use({ seededRole: role })

      test(`${role} ${canEditRows ? 'can' : 'cannot'} open the control owner editor`, async ({ page }) => {
        test.slow()
        await page.goto('/controls', { waitUntil: 'domcontentloaded', timeout: 180_000 })

        // /controls opens on the dashboard tab; the toggle click is occasionally
        // swallowed while the page settles, so retry it until the table view's
        // Owner column is actually up rather than asserting against whichever
        // view happened to render.
        // The Owner column header carries no accessible name of its own; the
        // sortable button inside it does.
        const ownerHeader = page.getByRole('button', { name: 'Owner', exact: true })
        await expect(async () => {
          if (!(await ownerHeader.isVisible().catch(() => false))) {
            await page.locator('.lucide-table').first().click({ timeout: 5_000 })
          }
          await expect(ownerHeader).toBeVisible({ timeout: 5_000 })
        }).toPass({ timeout: 90_000 })

        // EditableGroupCell draws a dashed underline only when it is editable —
        // that span is the affordance, so assert on it rather than clicking a
        // guessed cell and risking a navigation to the control detail page.
        // Scope to the whole table: the owner column is fetched conditionally
        // (gqlInclude), so which row paints it first is not deterministic.
        // Count rather than assert visibility: the underline is an absolutely
        // positioned, border-only span with no real height, which Playwright's
        // visibility check treats inconsistently even when the span is there.
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

// Campaign detail actions read object-level roles on the campaign itself, not the
// org roles the rest of this file asserts, so they need a real campaign to sit on.
test.describe('permissions matrix — campaign detail', () => {
  let ownerApi: ApiSession
  let campaignId: string

  test.beforeAll(async () => {
    ownerApi = await loginSeeded('owner')
    campaignId = await createCampaign(ownerApi, uniqueRef('e2e-perm-campaign'))
  })

  test.afterAll(async () => {
    if (campaignId) {
      await gql(ownerApi, 'mutation($id: ID!){ deleteCampaign(id: $id){ deletedID } }', { id: campaignId }).catch(() => {})
    }
  })

  for (const role of ROLES) {
    const canEditCampaign = role === 'owner' || role === 'admin'

    test.describe(role, () => {
      test.use({ seededRole: role })

      test(`${role} ${canEditCampaign ? 'sees' : 'does not see'} the campaign Launch button`, async ({ page }) => {
        test.slow()
        await page.goto(`/automation/campaigns/${campaignId}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
        await expect(shell(page)).toBeVisible({ timeout: 90_000 })

        // A freshly seeded campaign is DRAFT, so Launch renders for anyone who
        // can edit it — disabled while it has no recipients, but still present.
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
