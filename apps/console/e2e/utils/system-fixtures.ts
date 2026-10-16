import { OPENLANE_TRUST_CENTER_STANDARD } from '@/constants/system-standards'
import { SOC_2_FRAMEWORK_NAME, TRUST_SERVICES_CATEGORY_NAMES, type TTrustServicesCategoryName } from '@/constants/trust-services-category-names'

import { createStandard, gqlData, loginViaApi, seedEntity, type ApiSession } from './api'
import { isolatedEmailFor } from './constants'
import { registerAndVerify } from './registerUser'
import { grantSystemAdmin } from './system-admin'

interface TCatalogCategory {
  name: string
  refPrefix: string
}

interface TCatalogFixture {
  name: string
  shortName: string
  framework: string
  categories: TCatalogCategory[]
  controlsPerCategory: number
}

interface TCatalogStandard {
  id: string
  shortName: string
  framework: string | null
  controlCount: number
}

interface TCatalogControl {
  refCode: string
  title: string
  description: string
  category: string
  subcategory: string
  controlQuestions: string[]
}

const SEED_SYSTEM_FIXTURES = process.env.E2E_SEED_SYSTEM_FIXTURES === '1'

const TRUST_CENTER_CNAME_TARGET = process.env.E2E_TRUST_CENTER_CNAME_TARGET ?? 'cname.demo-dns.com'

const SOC_2_REF_PREFIXES: Record<TTrustServicesCategoryName, string> = {
  Security: 'CC',
  Availability: 'A',
  Confidentiality: 'C',
  'Processing Integrity': 'PI',
  Privacy: 'P',
}

const CONTROLS_PER_CATEGORY = 11

const SUBCONTROLS_PER_FIXTURE = 2

const GOVERNING_BODY = 'Openlane E2E'

const CATALOG_FIXTURES: TCatalogFixture[] = [
  {
    name: 'E2E Synthetic Standard',
    shortName: 'E2E Standard',
    framework: 'e2e-synthetic',
    categories: [
      { name: 'Governance', refPrefix: 'GOV' },
      { name: 'Operations', refPrefix: 'OPS' },
    ],
    controlsPerCategory: CONTROLS_PER_CATEGORY,
  },
  {
    name: 'SOC 2 (E2E synthetic)',
    shortName: SOC_2_FRAMEWORK_NAME,
    framework: 'e2e-soc2',
    categories: TRUST_SERVICES_CATEGORY_NAMES.map((name) => ({ name, refPrefix: SOC_2_REF_PREFIXES[name] })),
    controlsPerCategory: CONTROLS_PER_CATEGORY,
  },
  {
    name: 'Openlane Trust Center Standard (E2E synthetic)',
    shortName: OPENLANE_TRUST_CENTER_STANDARD.shortName,
    framework: OPENLANE_TRUST_CENTER_STANDARD.framework,
    categories: [{ name: 'Trust Center', refPrefix: 'TC' }],
    controlsPerCategory: 3,
  },
]

const REQUIRED_STANDARDS = [SOC_2_FRAMEWORK_NAME, OPENLANE_TRUST_CENTER_STANDARD.shortName]

const fixtureControls = (fixture: TCatalogFixture): TCatalogControl[] =>
  fixture.categories.flatMap((category) =>
    Array.from({ length: fixture.controlsPerCategory }, (_, index) => {
      const refCode = `${category.refPrefix}${index + 1}`
      return {
        refCode,
        title: `${category.name} control ${index + 1}`,
        description: `Synthetic ${fixture.shortName} control for e2e runs.`,
        category: category.name,
        subcategory: `${category.name} practices`,
        controlQuestions: [`Is ${refCode} implemented and evidenced?`],
      }
    }),
  )

const findCatalogStandards = async (sess: ApiSession, where: Record<string, unknown>): Promise<TCatalogStandard[]> => {
  const data = await gqlData<{ standards: { edges: Array<{ node: { id: string; shortName: string; framework: string | null; controls: { totalCount: number } } }> } }>(
    sess,
    'catalog standards',
    `query($where: StandardWhereInput){ standards(where: $where){ edges { node { id shortName framework controls { totalCount } } } } }`,
    { where: { systemOwned: true, isPublic: true, ...where } },
  )
  return data.standards.edges.map(({ node }) => ({ id: node.id, shortName: node.shortName, framework: node.framework, controlCount: node.controls.totalCount }))
}

const standardControls = async (sess: ApiSession, standardId: string): Promise<Array<{ id: string; refCode: string; subcontrolRefCodes: string[] }>> => {
  const data = await gqlData<{ standard: { controls: { edges: Array<{ node: { id: string; refCode: string; subcontrols: { edges: Array<{ node: { refCode: string } }> } } }> } } }>(
    sess,
    `standard ${standardId} controls`,
    `query($id: ID!){ standard(id: $id){ controls(first: 100){ edges { node { id refCode subcontrols { edges { node { refCode } } } } } } } }`,
    { id: standardId },
  )
  return data.standard.controls.edges.map(({ node }) => ({ id: node.id, refCode: node.refCode, subcontrolRefCodes: node.subcontrols.edges.map((edge) => edge.node.refCode) }))
}

const hasMappableDomain = async (sess: ApiSession): Promise<boolean> => {
  const data = await gqlData<{ mappableDomains: { totalCount: number } }>(sess, 'mappableDomains', `query($where: MappableDomainWhereInput){ mappableDomains(where: $where){ totalCount } }`, {
    where: { name: TRUST_CENTER_CNAME_TARGET },
  })
  return data.mappableDomains.totalCount > 0
}

const provisionSystemAdmin = async (): Promise<ApiSession> => {
  const { id, email } = await registerAndVerify({ email: isolatedEmailFor('sysadmin', 'catalog') })
  await grantSystemAdmin(id)
  return loginViaApi(email)
}

const ensureFixture = async (admin: ApiSession, fixture: TCatalogFixture): Promise<void> => {
  const [existing] = await findCatalogStandards(admin, { shortName: fixture.shortName, framework: fixture.framework })
  const standardID =
    existing?.id ??
    (await createStandard(admin, fixture.name, fixture.framework, {
      shortName: fixture.shortName,
      governingBody: GOVERNING_BODY,
      description: `Synthetic catalog standard seeded for e2e runs (${fixture.shortName}).`,
      domains: fixture.categories.map((category) => category.name),
      version: '1.0',
      isPublic: true,
    }))

  const controls = fixtureControls(fixture)
  const present = existing ? await standardControls(admin, standardID) : []
  const missing = controls.filter((control) => !present.some((p) => p.refCode === control.refCode))
  const created =
    missing.length === 0
      ? []
      : (
          await gqlData<{ createBulkControl: { controls: Array<{ id: string; refCode: string }> } }>(
            admin,
            `createBulkControl (${fixture.shortName})`,
            `mutation($input: [CreateControlInput!]){ createBulkControl(input: $input){ controls { id refCode } } }`,
            { input: missing.map((control) => ({ ...control, standardID })) },
          )
        ).createBulkControl.controls.map((control) => ({ ...control, subcontrolRefCodes: [] }))

  const parent = [...present, ...created].find((control) => control.refCode === controls[0].refCode)
  if (!parent) throw new Error(`global-setup: ${fixture.shortName} has no ${controls[0].refCode} control to hang subcontrols on`)

  const missingSubcontrols = Array.from({ length: SUBCONTROLS_PER_FIXTURE }, (_, index) => `${parent.refCode}.${index + 1}`).filter((refCode) => !parent.subcontrolRefCodes.includes(refCode))
  if (missingSubcontrols.length === 0) return

  await gqlData(admin, `createBulkSubcontrol (${fixture.shortName})`, `mutation($input: [CreateSubcontrolInput!]){ createBulkSubcontrol(input: $input){ subcontrols { id } } }`, {
    input: missingSubcontrols.map((refCode) => ({ refCode, title: `${refCode} sub-requirement`, controlID: parent.id })),
  })
}

const seedSystemFixtures = async (viewer: ApiSession): Promise<void> => {
  const admin = await provisionSystemAdmin()
  await Promise.all([
    ...CATALOG_FIXTURES.map((fixture) => ensureFixture(admin, fixture)),
    hasMappableDomain(viewer).then((exists) =>
      exists ? undefined : seedEntity(admin, 'createMappableDomain', 'CreateMappableDomainInput', 'mappableDomain', { name: TRUST_CENTER_CNAME_TARGET, zoneID: 'e2e-zone' }),
    ),
  ])

  const visible = await findCatalogStandards(viewer, { shortNameIn: CATALOG_FIXTURES.map((fixture) => fixture.shortName) })
  const invisible = CATALOG_FIXTURES.filter(
    (fixture) => !visible.some((standard) => standard.shortName === fixture.shortName && standard.framework === fixture.framework && standard.controlCount >= fixtureControls(fixture).length),
  )
  if (invisible.length) {
    throw new Error(`global-setup: seeded ${invisible.map((fixture) => fixture.shortName).join(', ')} but an ordinary user cannot see all of its controls`)
  }
  console.log(`[global-setup] seeded system fixtures (${CATALOG_FIXTURES.map((fixture) => fixture.shortName).join(', ')}, mappable domain ${TRUST_CENTER_CNAME_TARGET})`)
}

const assertSystemFixtures = async (viewer: ApiSession): Promise<void> => {
  const [visible, mappableDomainExists] = await Promise.all([findCatalogStandards(viewer, { shortNameIn: REQUIRED_STANDARDS }), hasMappableDomain(viewer)])
  const missing = [
    ...REQUIRED_STANDARDS.filter((shortName) => !visible.some((standard) => standard.shortName === shortName && standard.controlCount > 0)).map(
      (shortName) => `a public ${shortName} standard with controls`,
    ),
    ...(mappableDomainExists ? [] : [`a mappable domain named ${TRUST_CENTER_CNAME_TARGET}`]),
  ]
  if (missing.length) {
    throw new Error(
      `global-setup: this environment lacks ${missing.join(' and ')}, which the standards, programs and trust-center specs need. Seed them (harmonize locally), or set E2E_SEED_SYSTEM_FIXTURES=1 on a disposable stack to create synthetic ones.`,
    )
  }
}

export const ensureSystemFixtures = (viewer: ApiSession): Promise<void> => (SEED_SYSTEM_FIXTURES ? seedSystemFixtures(viewer) : assertSystemFixtures(viewer))
