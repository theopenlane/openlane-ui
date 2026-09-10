import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { API_BASE, PASSWORD, RUN_ID } from './constants'

/** Raw HTTP helpers for talking to the backend (theopenlane/core) directly, bypassing the UI. */

const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME ?? 'temporary-cookie'
const CSRF_COOKIE = process.env.NEXT_PUBLIC_CSRF_COOKIE_NAME ?? 'ol.csrf-token'
const CSRF_HEADER = process.env.NEXT_PUBLIC_CSRF_HEADER ?? 'X-CSRF-Token'

export interface ApiSession {
  accessToken: string
  refreshToken: string
  session: string
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

export const loginViaApi = async (email: string, password: string = PASSWORD): Promise<ApiSession> => {
  const res = await fetch(`${API_BASE}/v1/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: email, password }),
  })
  const body = (await res.json()) as { access_token?: string; refresh_token?: string; session?: string }
  if (!body.access_token || !body.session) {
    throw new Error(`login failed for ${email}: ${res.status} ${JSON.stringify(body)}`)
  }
  return { accessToken: body.access_token, refreshToken: body.refresh_token ?? '', session: body.session }
}

const CSRF_TOKEN = `e2e-${RUN_ID}-csrf-token`

interface GqlResult<T> {
  data?: T
  errors?: Array<{ message: string }>
}

/** GraphQL against /query. Retries on 401 to absorb the dev backend's session race. */
export const gql = async <T>(sess: ApiSession, query: string, variables?: Record<string, unknown>, tries = 3): Promise<GqlResult<T>> => {
  let last: Response | undefined
  for (let i = 0; i < tries; i++) {
    const res = await fetch(`${API_BASE}/query`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${sess.accessToken}`,
        [CSRF_HEADER]: CSRF_TOKEN,
        cookie: `${SESSION_COOKIE}=${sess.session}; ${CSRF_COOKIE}=${CSRF_TOKEN}`,
      },
      body: JSON.stringify({ query, variables }),
    })
    last = res
    if (res.status === 401 && i < tries - 1) {
      await sleep(300)
      continue
    }
    return (await res.json()) as GqlResult<T>
  }
  throw new Error(`gql request failed after ${tries} tries: ${last?.status}`)
}

export const getSelf = async (sess: ApiSession): Promise<{ id: string; settingId: string }> => {
  const res = await gql<{ self: { id: string; setting: { id: string } } }>(sess, `{ self { id setting { id } } }`)
  const id = res.data?.self?.id
  const settingId = res.data?.self?.setting?.id
  if (!id || !settingId) throw new Error(`getSelf failed: ${JSON.stringify(res.errors)}`)
  return { id, settingId }
}

export const setDefaultOrg = async (sess: ApiSession, settingId: string, organizationID: string): Promise<void> => {
  const res = await gql<{ updateUserSetting: { userSetting: { id: string } } }>(
    sess,
    `mutation($id: ID!, $input: UpdateUserSettingInput!){ updateUserSetting(id: $id, input: $input){ userSetting { id } } }`,
    { id: settingId, input: { defaultOrgID: organizationID } },
  )
  if (!res.data?.updateUserSetting?.userSetting?.id) {
    throw new Error(`setDefaultOrg failed: ${JSON.stringify(res.errors)}`)
  }
}

export const getSharedOrgs = async (sess: ApiSession): Promise<Array<{ id: string; name: string }>> => {
  const res = await gql<{ self: { organizations: { edges: Array<{ node: { id: string; name: string; personalOrg: boolean } }> } } }>(
    sess,
    `{ self { organizations(first: 50) { edges { node { id name personalOrg } } } } }`,
  )
  return (res.data?.self?.organizations?.edges ?? []).map((e) => e.node).filter((o) => !o.personalOrg)
}

type CreateResult = Record<string, Record<string, { id: string }>>

export const seedEntity = async (sess: ApiSession, mutationField: string, inputType: string, payloadField: string, input: Record<string, unknown>): Promise<string> => {
  const res = await gql<CreateResult>(sess, `mutation($input: ${inputType}!){ ${mutationField}(input: $input){ ${payloadField} { id } } }`, { input })
  const id = res.data?.[mutationField]?.[payloadField]?.id
  if (!id) throw new Error(`${mutationField} failed: ${JSON.stringify(res.errors)}`)
  return id
}

export const createControl = (sess: ApiSession, refCode: string, extra: Record<string, unknown> = {}): Promise<string> =>
  seedEntity(sess, 'createControl', 'CreateControlInput', 'control', { refCode, ...extra })

export const createInternalPolicy = (sess: ApiSession, name: string): Promise<string> => seedEntity(sess, 'createInternalPolicy', 'CreateInternalPolicyInput', 'internalPolicy', { name })

export const createProcedure = (sess: ApiSession, name: string): Promise<string> => seedEntity(sess, 'createProcedure', 'CreateProcedureInput', 'procedure', { name })

export const createProgram = (sess: ApiSession, name: string): Promise<string> => seedEntity(sess, 'createProgram', 'CreateProgramInput', 'program', { name })

export const createRisk = (sess: ApiSession, name: string, extra: Record<string, unknown> = {}): Promise<string> => seedEntity(sess, 'createRisk', 'CreateRiskInput', 'risk', { name, ...extra })

export const createFinding = (sess: ApiSession, displayName: string, extra: Record<string, unknown> = {}): Promise<string> =>
  seedEntity(sess, 'createFinding', 'CreateFindingInput', 'finding', { displayName, ...extra })

export const deleteFinding = async (sess: ApiSession, id: string): Promise<void> => {
  await gql(sess, `mutation($id: ID!){ deleteFinding(id: $id){ deletedID } }`, { id })
}

export const createScan = (sess: ApiSession, target: string, extra: Record<string, unknown> = {}): Promise<string> => seedEntity(sess, 'createScan', 'CreateScanInput', 'scan', { target, ...extra })

export const deleteScan = async (sess: ApiSession, id: string): Promise<void> => {
  await gql(sess, `mutation($id: ID!){ deleteScan(id: $id){ deletedID } }`, { id })
}

export const createRemediation = (sess: ApiSession, title: string, extra: Record<string, unknown> = {}): Promise<string> =>
  seedEntity(sess, 'createRemediation', 'CreateRemediationInput', 'remediation', { title, ...extra })

export const deleteRemediation = async (sess: ApiSession, id: string): Promise<void> => {
  await gql(sess, `mutation($id: ID!){ deleteRemediation(id: $id){ deletedID } }`, { id })
}

export const createVulnerability = (sess: ApiSession, displayName: string, externalID: string, extra: Record<string, unknown> = {}): Promise<string> =>
  seedEntity(sess, 'createVulnerability', 'CreateVulnerabilityInput', 'vulnerability', { displayName, externalID, ...extra })

export const deleteVulnerability = async (sess: ApiSession, id: string): Promise<void> => {
  await gql(sess, `mutation($id: ID!){ deleteVulnerability(id: $id){ deletedID } }`, { id })
}

export const createActionPlan = (sess: ApiSession, name: string, extra: Record<string, unknown> = {}): Promise<string> =>
  seedEntity(sess, 'createActionPlan', 'CreateActionPlanInput', 'actionPlan', { name, title: name, ...extra })

export const deleteActionPlan = async (sess: ApiSession, id: string): Promise<void> => {
  await gql(sess, `mutation($id: ID!){ deleteActionPlan(id: $id){ deletedID } }`, { id })
}

export const createTask = (sess: ApiSession, title: string): Promise<string> => seedEntity(sess, 'createTask', 'CreateTaskInput', 'task', { title })

export const createGroup = (sess: ApiSession, name: string): Promise<string> => seedEntity(sess, 'createGroup', 'CreateGroupInput', 'group', { name })

export const createEvidence = (sess: ApiSession, name: string): Promise<string> => seedEntity(sess, 'createEvidence', 'CreateEvidenceInput', 'evidence', { name })

export const createAsset = (sess: ApiSession, name: string): Promise<string> => seedEntity(sess, 'createAsset', 'CreateAssetInput', 'asset', { name })

export const createContact = (sess: ApiSession, fullName: string): Promise<string> => seedEntity(sess, 'createContact', 'CreateContactInput', 'contact', { fullName })

export const createCampaign = (sess: ApiSession, name: string): Promise<string> => seedEntity(sess, 'createCampaign', 'CreateCampaignInput', 'campaign', { name })

export const createSystemDetail = (sess: ApiSession, systemName: string, extra: Record<string, unknown> = {}): Promise<string> =>
  seedEntity(sess, 'createSystemDetail', 'CreateSystemDetailInput', 'systemDetail', { systemName, ...extra })

export const deleteSystemDetail = async (sess: ApiSession, id: string): Promise<void> => {
  await gql(sess, `mutation($id: ID!){ deleteSystemDetail(id: $id){ deletedID } }`, { id })
}

export const createPlatform = (sess: ApiSession, name: string): Promise<string> => seedEntity(sess, 'createPlatform', 'CreatePlatformInput', 'platform', { name })

export const createControlObjective = (sess: ApiSession, name: string, controlIDs: string[], status?: string): Promise<string> =>
  seedEntity(sess, 'createControlObjective', 'CreateControlObjectiveInput', 'controlObjective', { name, controlIDs, ...(status ? { status } : {}) })

export const deleteControlObjective = async (sess: ApiSession, id: string): Promise<void> => {
  await gql(sess, `mutation($id: ID!){ deleteControlObjective(id: $id){ deletedID } }`, { id })
}

export const createMappedControl = (sess: ApiSession, fromControlID: string, toControlID: string, mappingType = 'EQUAL'): Promise<string> =>
  seedEntity(sess, 'createMappedControl', 'CreateMappedControlInput', 'mappedControl', {
    mappingType,
    confidence: 80,
    fromControlIDs: [fromControlID],
    toControlIDs: [toControlID],
  })

export const deleteMappedControl = async (sess: ApiSession, id: string): Promise<void> => {
  await gql(sess, `mutation($id: ID!){ deleteMappedControl(id: $id){ deletedID } }`, { id })
}

export const deleteProgram = async (sess: ApiSession, id: string): Promise<void> => {
  await gql(sess, `mutation($id: ID!){ deleteProgram(id: $id){ deletedID } }`, { id })
}

export const createSubcontrol = (sess: ApiSession, refCode: string, controlID: string): Promise<string> =>
  seedEntity(sess, 'createSubcontrol', 'CreateSubcontrolInput', 'subcontrol', { refCode, controlID })

export const deleteControl = async (sess: ApiSession, id: string): Promise<void> => {
  await gql(sess, `mutation($id: ID!){ deleteControl(id: $id){ deletedID } }`, { id })
}

export const deleteSubcontrol = async (sess: ApiSession, id: string): Promise<void> => {
  await gql(sess, `mutation($id: ID!){ deleteSubcontrol(id: $id){ deletedID } }`, { id })
}

export const createReview = (sess: ApiSession, title: string, extra: Record<string, unknown> = {}): Promise<string> =>
  seedEntity(sess, 'createReview', 'CreateReviewInput', 'review', { title, ...extra })

export const deleteReview = async (sess: ApiSession, id: string): Promise<void> => {
  await gql(sess, `mutation($id: ID!){ deleteReview(id: $id){ deletedID } }`, { id })
}

export const createTagDefinition = (sess: ApiSession, name: string): Promise<string> => seedEntity(sess, 'createTagDefinition', 'CreateTagDefinitionInput', 'tagDefinition', { name })

export const deleteTagDefinition = async (sess: ApiSession, id: string): Promise<void> => {
  await gql(sess, `mutation($id: ID!){ deleteTagDefinition(id: $id){ deletedID } }`, { id })
}

export const createCustomTypeEnum = (sess: ApiSession, name: string, field: string, objectType = ''): Promise<string> =>
  seedEntity(sess, 'createCustomTypeEnum', 'CreateCustomTypeEnumInput', 'customTypeEnum', { name, field, objectType })

export const deleteCustomTypeEnum = async (sess: ApiSession, id: string): Promise<void> => {
  await gql(sess, `mutation($id: ID!){ deleteCustomTypeEnum(id: $id){ deletedID } }`, { id })
}

export const createSubscriber = (sess: ApiSession, email: string, trustCenterID?: string): Promise<string> =>
  seedEntity(sess, 'createSubscriber', 'CreateSubscriberInput', 'subscriber', { email, ...(trustCenterID ? { trustCenterID } : {}) })

export const deleteSubscriber = async (sess: ApiSession, email: string): Promise<void> => {
  await gql(sess, `mutation($email: String!){ deleteSubscriber(email: $email){ email } }`, { email })
}

const MINIMAL_SURVEY = { pages: [{ name: 'page1', elements: [{ type: 'text', name: 'q1', title: 'Question 1' }] }] }

export const createTemplate = (sess: ApiSession, name: string): Promise<string> => seedEntity(sess, 'createTemplate', 'CreateTemplateInput', 'template', { name, jsonconfig: MINIMAL_SURVEY })

/** Create a questionnaire (Assessment) from a fresh template and return its id. */
export const createQuestionnaire = async (sess: ApiSession, name: string): Promise<string> => {
  const templateId = await createTemplate(sess, `${name} (template)`)
  return seedEntity(sess, 'createAssessment', 'CreateAssessmentInput', 'assessment', { name, templateID: templateId })
}

/** Create a vendor — an Entity created with `entityTypeName: "vendor"` (matches the console's vendor create flow). */
export const createVendor = async (sess: ApiSession, name: string, displayName?: string): Promise<string> => {
  const res = await gql<{ createEntity: { entity: { id: string } } }>(
    sess,
    `mutation($input: CreateEntityInput!, $entityTypeName: String){ createEntity(input: $input, entityTypeName: $entityTypeName){ entity { id } } }`,
    { input: { name, ...(displayName ? { displayName } : {}) }, entityTypeName: 'vendor' },
  )
  const id = res.data?.createEntity?.entity?.id
  if (!id) throw new Error(`createVendor failed: ${JSON.stringify(res.errors)}`)
  return id
}

const updateControlAssoc = async (sess: ApiSession, controlId: string, input: Record<string, unknown>): Promise<void> => {
  const res = await gql<{ updateControl: { control: { id: string } } }>(sess, `mutation($id: ID!, $input: UpdateControlInput!){ updateControl(id: $id, input: $input){ control { id } } }`, {
    id: controlId,
    input,
  })
  if (!res.data?.updateControl?.control?.id) throw new Error(`updateControlAssoc failed: ${JSON.stringify(res.errors)}`)
}

export const linkControlPolicy = (sess: ApiSession, controlId: string, policyId: string): Promise<void> => updateControlAssoc(sess, controlId, { addInternalPolicyIDs: [policyId] })

export const linkControlProcedure = (sess: ApiSession, controlId: string, procedureId: string): Promise<void> => updateControlAssoc(sess, controlId, { addProcedureIDs: [procedureId] })

export const linkControlEvidence = (sess: ApiSession, controlId: string, evidenceId: string): Promise<void> => updateControlAssoc(sess, controlId, { addEvidenceIDs: [evidenceId] })

export const linkProcedureControl = async (sess: ApiSession, procedureId: string, controlId: string): Promise<void> => {
  const res = await gql<{ updateProcedure: { procedure: { id: string } } }>(sess, `mutation($id: ID!, $input: UpdateProcedureInput!){ updateProcedure(id: $id, input: $input){ procedure { id } } }`, {
    id: procedureId,
    input: { addControlIDs: [controlId] },
  })
  if (!res.data?.updateProcedure?.procedure?.id) throw new Error(`linkProcedureControl failed: ${JSON.stringify(res.errors)}`)
}

/** The shared Owner's API session, logged in once per worker process. */
let ownerApiPromise: Promise<ApiSession> | null = null

export const getOwnerApi = (): Promise<ApiSession> => {
  if (!ownerApiPromise) {
    const manifestPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.auth', 'manifest.json')
    const { ownerEmail, password } = JSON.parse(readFileSync(manifestPath, 'utf-8')) as { ownerEmail: string; password: string }
    ownerApiPromise = loginViaApi(ownerEmail, password)
  }
  return ownerApiPromise
}

let demoApiPromise: Promise<ApiSession> | null = null

export const getDemoApi = (): Promise<ApiSession> => {
  if (!demoApiPromise) {
    const manifestPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.auth', 'manifest.json')
    const { demoEmail, demoPassword, password } = JSON.parse(readFileSync(manifestPath, 'utf-8')) as { demoEmail?: string; demoPassword?: string; password: string }
    if (!demoEmail) throw new Error('getDemoApi: manifest has no demoEmail — the trust-center org was not provisioned')
    demoApiPromise = loginViaApi(demoEmail, demoPassword ?? password)
  }
  return demoApiPromise
}

export const createSharedOrg = async (sess: ApiSession, name: string): Promise<string> => {
  const res = await gql<{ createOrganization: { organization: { id: string } } }>(sess, `mutation($input: CreateOrganizationInput!){ createOrganization(input: $input){ organization { id } } }`, {
    input: { name },
  })
  const id = res.data?.createOrganization?.organization?.id
  if (!id) throw new Error(`createSharedOrg failed: ${JSON.stringify(res.errors)}`)
  return id
}

/** Mark every onboarding suggested-task in the caller's org COMPLETED. */
export const completeOnboardingTasks = async (sess: ApiSession): Promise<number> => {
  const res = await gql<{ tasks: { edges: Array<{ node: { id: string; status: string } }> } }>(
    sess,
    `query($where: TaskWhereInput){ tasks(where: $where, first: 100){ edges { node { id status } } } }`,
    { where: { isSuggested: true, source: 'openlane_onboarding' } },
  )
  const pending = (res.data?.tasks?.edges ?? []).map((e) => e.node).filter((t) => t.status !== 'COMPLETED')
  for (const task of pending) {
    await gql(sess, `mutation($id: ID!, $input: UpdateTaskInput!){ updateTask(id: $id, input: $input){ task { id } } }`, { id: task.id, input: { status: 'COMPLETED' } })
  }
  return pending.length
}

export type SeedRole = 'ADMIN' | 'SUPER_ADMIN' | 'MEMBER' | 'AUDITOR'

interface MemberEdge {
  id: string
  role: SeedRole | 'OWNER'
  userID: string
}

/** Find a user's orgMembership. Reads the `userID` scalar, not the `user{}` edge, which throws under FGA. */
const findMembership = async (owner: ApiSession, organizationID: string, userID: string, tries = 12, delayMs = 500): Promise<MemberEdge> => {
  for (let i = 0; i < tries; i++) {
    const res = await gql<{ organization: { members: { edges: Array<{ node: MemberEdge }> } } }>(
      owner,
      `query($id: ID!){ organization(id: $id){ members(first: 100){ edges { node { id role userID } } } } }`,
      { id: organizationID },
    )
    const node = (res.data?.organization?.members?.edges ?? []).map((e) => e.node).find((n) => n?.userID === userID)
    if (node) return node
    await sleep(delayMs)
  }
  throw new Error(`findMembership: no membership for user ${userID} in org ${organizationID}`)
}

/** Add a user to an org. createOrgMembership ignores the role argument and always lands them as MEMBER, so the role is patched after. */
export const addOrgMember = async (owner: ApiSession, organizationID: string, userID: string, role: SeedRole): Promise<void> => {
  await gql(owner, `mutation($input: CreateOrgMembershipInput!){ createOrgMembership(input: $input){ orgMembership { id } } }`, { input: { organizationID, userID, role } })
  if (role === 'MEMBER') return

  const membership = await findMembership(owner, organizationID, userID)
  for (let i = 0; i < 6; i++) {
    const updated: GqlResult<{ updateOrgMembership: { orgMembership: { role: SeedRole } } }> = await gql(
      owner,
      `mutation($id: ID!, $input: UpdateOrgMembershipInput!){ updateOrgMembership(id: $id, input: $input){ orgMembership { role } } }`,
      { id: membership.id, input: { role } },
    )
    if (updated.data?.updateOrgMembership?.orgMembership?.role === role) return
    await sleep(1500)
  }
  const after = await findMembership(owner, organizationID, userID)
  if (after.role !== role) {
    throw new Error(`addOrgMember: could not elevate user ${userID} to ${role} (still ${after.role})`)
  }
}

/** Poll until the user's own session reports membership in `organizationID`. */
export const memberSeesOrg = async (member: ApiSession, organizationID: string, tries = 10, delayMs = 500): Promise<boolean> => {
  for (let i = 0; i < tries; i++) {
    const orgs = await getSharedOrgs(member)
    if (orgs.some((o) => o.id === organizationID)) return true
    await sleep(delayMs)
  }
  return false
}

export const createSubprocessor = (sess: ApiSession, name: string): Promise<string> => seedEntity(sess, 'createSubprocessor', 'CreateSubprocessorInput', 'subprocessor', { name })

export const readField = async (sess: ApiSession, queryField: string, id: string, field: string): Promise<string | null> => {
  const res = await gql<Record<string, Record<string, string> | null>>(sess, `query($id: ID!){ ${queryField}(id: $id){ ${field} } }`, { id })
  const node = res.data?.[queryField]
  return node ? ((node[field] as string) ?? null) : null
}

export const roleOf = async (sess: ApiSession, organizationID: string, email: string): Promise<string | null> => {
  const res = await gql<{ orgMemberships: { edges: Array<{ node: { role: string; user: { email: string } | null } | null }> } }>(
    sess,
    `query($orgId: String!){ orgMemberships(where: { organizationID: $orgId }, first: 200){ edges { node { role user { email } } } } }`,
    { orgId: organizationID },
  )
  const found = (res.data?.orgMemberships?.edges ?? []).find((e) => e.node?.user?.email === email)
  return found?.node?.role ?? null
}

export const createStandard = (sess: ApiSession, name: string, framework?: string): Promise<string> =>
  seedEntity(sess, 'createStandard', 'CreateStandardInput', 'standard', { name, ...(framework ? { framework } : {}) })

export const createTrustCenterSubprocessor = (sess: ApiSession, trustCenterID: string, subprocessorID: string, category: string, countries: string[]): Promise<string> =>
  seedEntity(sess, 'createTrustCenterSubprocessor', 'CreateTrustCenterSubprocessorInput', 'trustCenterSubprocessor', {
    trustCenterID,
    subprocessorID,
    trustCenterSubprocessorKindName: category,
    countries,
  })

export const getTrustCenterId = async (sess: ApiSession): Promise<string> => {
  const res = await gql<{ trustCenters: { edges: Array<{ node: { id: string } }> } }>(sess, `{ trustCenters(first: 1) { edges { node { id } } } }`)
  const id = res.data?.trustCenters?.edges?.[0]?.node?.id
  if (!id) throw new Error('getTrustCenterId: org has no trust center')
  return id
}

export const createIdentityHolder = (sess: ApiSession, fullName: string, email: string): Promise<string> =>
  seedEntity(sess, 'createIdentityHolder', 'CreateIdentityHolderInput', 'identityHolder', { fullName, email })

export const getFirstStandardWithControl = async (sess: ApiSession): Promise<{ shortName: string; refCode: string } | null> => {
  const res = await gql<{ standards: { edges: Array<{ node: { shortName: string; controls: { edges: Array<{ node: { refCode: string } }> } } }> } }>(
    sess,
    `{ standards(first: 10) { edges { node { shortName controls(first: 1) { edges { node { refCode } } } } } } }`,
  )
  for (const edge of res.data?.standards?.edges ?? []) {
    const refCode = edge.node.controls?.edges?.[0]?.node?.refCode
    if (edge.node.shortName && refCode) return { shortName: edge.node.shortName, refCode }
  }
  return null
}

export const deletePlatform = async (sess: ApiSession, id: string): Promise<void> => {
  await gql(sess, `mutation($id: ID!){ deletePlatform(id: $id){ deletedID } }`, { id })
}

export const readTrustCenterSecurityContact = async (sess: ApiSession): Promise<string | null> => {
  const res = await gql<{ trustCenters: { edges: Array<{ node: { setting: { securityContact: string | null } | null } }> } }>(
    sess,
    `{ trustCenters(first: 1) { edges { node { setting { securityContact } } } } }`,
  )
  return res.data?.trustCenters?.edges?.[0]?.node?.setting?.securityContact ?? null
}

export const deleteStandard = async (sess: ApiSession, id: string): Promise<void> => {
  await gql(sess, `mutation($id: ID!){ deleteStandard(id: $id){ deletedID } }`, { id })
}
