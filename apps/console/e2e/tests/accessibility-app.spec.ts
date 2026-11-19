import { test } from '../fixtures/auth'
import { A11Y_TAG, COLOR_SCHEMES, expectNoA11yViolations, heading, waitForPageToSettle, type ScannedRoute } from '../utils/accessibility'

const APP_ROUTES: ScannedRoute[] = [
  { path: '/dashboard', ready: (page) => page.getByText(/^Welcome,/) },
  { path: '/auditor-dashboard' },
  { path: '/notifications' },
  { path: '/onboarding' },
  { path: '/import?type=control' },

  { path: '/programs', ready: heading(/^Programs$/) },
  { path: '/programs/create' },
  { path: '/programs/create/advanced-setup' },
  { path: '/programs/create/framework-based' },
  { path: '/programs/create/from-existing' },
  { path: '/programs/create/generic-program' },
  { path: '/programs/create/risk-assessment' },
  { path: '/programs/create/soc2' },

  { path: '/controls', ready: heading(/^Controls$/) },
  { path: '/controls/create-control' },
  { path: '/controls/create-subcontrol' },
  { path: '/standards', ready: heading(/^Standards Catalog$/) },
  { path: '/standards/create' },
  {
    path: '/standards/template-controls',
    ready: (page) =>
      page
        .getByRole('navigation', { name: /breadcrumb/i })
        .getByText(/^Template Controls$/)
        .or(page.getByText('Template controls are not available yet'))
        .first(),
  },

  { path: '/policies', ready: heading(/^Internal Policies$/) },
  { path: '/policies/create' },
  { path: '/procedures', ready: heading(/^Procedures$/) },
  { path: '/procedures/create' },
  { path: '/evidence', ready: heading(/^Evidence Center/) },

  { path: '/exposure/overview' },
  { path: '/exposure/triage', ready: (page) => page.getByPlaceholder('Search vulnerabilities…') },
  { path: '/exposure/risks', ready: heading(/^Risks$/) },
  { path: '/exposure/risks/create' },
  { path: '/exposure/findings' },
  { path: '/exposure/vulnerabilities' },
  { path: '/exposure/remediations' },
  { path: '/exposure/reviews' },
  { path: '/exposure/scans' },
  { path: '/exposure/scans/domain-scan' },

  { path: '/registry/assets' },
  { path: '/registry/contacts' },
  { path: '/registry/personnel' },
  { path: '/registry/platforms' },
  { path: '/registry/system-details' },
  { path: '/registry/vendors', ready: heading(/^Vendors$/) },

  { path: '/automation/tasks', ready: heading(/^Tasks$/) },
  { path: '/automation/campaigns' },
  { path: '/automation/email-templates' },
  { path: '/automation/email-templates/editor' },
  { path: '/automation/exposure' },
  { path: '/automation/integrations' },
  { path: '/automation/questionnaires' },
  { path: '/automation/questionnaires/questionnaire-editor' },
  { path: '/automation/questionnaires/questionnaire-viewer' },
  { path: '/automation/questionnaires/questionnaire-viewer/draft' },
  { path: '/automation/questionnaires/templates' },
  { path: '/automation/questionnaires/templates/template-editor' },
  { path: '/automation/questionnaires/templates/template-viewer' },
  { path: '/automation/workflows' },
  { path: '/automation/workflows/editor' },
  { path: '/automation/workflows/inbox' },
  { path: '/automation/workflows/instances' },
  { path: '/automation/workflows/templates' },
  { path: '/automation/workflows/wizard' },

  { path: '/reports/custom' },
  { path: '/reports/saved' },

  { path: '/organization' },
  { path: '/organization-settings' },
  { path: '/organization-settings/general-settings', ready: heading(/^General$/) },
  { path: '/organization-settings/authentication' },
  { path: '/organization-settings/billing' },
  { path: '/organization-settings/custom-data' },
  { path: '/organization-settings/logs' },
  { path: '/organization-settings/subscribers' },
  { path: '/user-management/members' },
  { path: '/user-management/groups' },
  { path: '/developers/api-tokens' },
  { path: '/developers/personal-access-tokens' },
  { path: '/user-settings' },
  { path: '/user-settings/profile', ready: heading(/^My profile$/) },
]

test.describe.configure({ retries: 0 })

for (const colorScheme of COLOR_SCHEMES) {
  test.describe(`accessibility — app pages (${colorScheme})`, { tag: A11Y_TAG }, () => {
    test.use({ colorScheme })

    for (const { path, ready } of APP_ROUTES) {
      test(`${path} has no WCAG 2.2 AA violations`, async ({ page }, testInfo) => {
        test.slow()
        await page.goto(path, { waitUntil: 'domcontentloaded' })
        await waitForPageToSettle(page, ready)

        await expectNoA11yViolations(page, testInfo)
      })
    }
  })
}
