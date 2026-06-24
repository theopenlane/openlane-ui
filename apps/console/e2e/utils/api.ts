import { API_BASE, PASSWORD, RUN_ID } from './constants'

/**
 * Raw HTTP helpers for talking to the backend (theopenlane/core) directly,
 * bypassing the UI. Used by global-setup to seed users, orgs, and memberships
 * fast — see AUTH_STRATEGY.md "Layer 3 — programmatic seeding".
 *
 * Auth model (discovered empirically against the dev backend):
 *   GraphQL /query requires ALL of:
 *     - Authorization: Bearer <access_token>   (from /v1/login)
 *     - Cookie: temporary-cookie=<session>      (the session string from /v1/login)
 *     - CSRF: header X-CSRF-Token + cookie ol.csrf-token, both = token from GET /csrf
 *   A bearer token alone returns 401 "invalid session provided".
 */

const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME ?? 'temporary-cookie'
const CSRF_COOKIE = process.env.NEXT_PUBLIC_CSRF_COOKIE_NAME ?? 'ol.csrf-token'
const CSRF_HEADER = process.env.NEXT_PUBLIC_CSRF_HEADER ?? 'X-CSRF-Token'

export interface ApiSession {
  accessToken: string
  refreshToken: string
  session: string
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

/** Log in via the backend REST endpoint and return the raw token triple. */
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

// The backend validates CSRF with the double-submit-cookie pattern: it only
// checks that the X-CSRF-Token header equals the ol.csrf-token cookie — the
// value is arbitrary. So we mint our own token instead of calling the /csrf
// endpoint (which is stateful and intermittently returns {"csrf": null}).
const CSRF_TOKEN = `e2e-${RUN_ID}-csrf-token`

interface GqlResult<T> {
  data?: T
  errors?: Array<{ message: string }>
}

/**
 * Execute a GraphQL operation against /query as an authenticated user.
 * Retries on 401 to absorb the dev backend's occasional session race.
 *
 * NOTE: callers must tolerate `errors` being present even when the mutation's
 * side effect succeeded — the backend's authorization layer (OpenFGA) lags
 * behind writes, so payload/related reads can transiently 404. Verify success
 * out-of-band rather than trusting the response payload.
 */
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

/** Return the authenticated user's id and userSetting id. */
export const getSelf = async (sess: ApiSession): Promise<{ id: string; settingId: string }> => {
  const res = await gql<{ self: { id: string; setting: { id: string } } }>(sess, `{ self { id setting { id } } }`)
  const id = res.data?.self?.id
  const settingId = res.data?.self?.setting?.id
  if (!id || !settingId) throw new Error(`getSelf failed: ${JSON.stringify(res.errors)}`)
  return { id, settingId }
}

/** Set the user's default organization so their next login is scoped to it. */
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

/** Return the user's non-personal organizations (the shareable ones). */
export const getSharedOrgs = async (sess: ApiSession): Promise<Array<{ id: string; name: string }>> => {
  const res = await gql<{ self: { organizations: { edges: Array<{ node: { id: string; name: string; personalOrg: boolean } }> } } }>(
    sess,
    `{ self { organizations(first: 50) { edges { node { id name personalOrg } } } } }`,
  )
  return (res.data?.self?.organizations?.edges ?? []).map((e) => e.node).filter((o) => !o.personalOrg)
}

// Generic entity seeder: runs a create<X> mutation in the caller's active org
// and returns the new id. Used to seed detail/list/filter specs with realistic
// data instead of clicking through the create UI.
type CreateResult = Record<string, Record<string, { id: string }>>

const seedEntity = async (sess: ApiSession, mutationField: string, inputType: string, payloadField: string, input: Record<string, unknown>): Promise<string> => {
  const res = await gql<CreateResult>(sess, `mutation($input: ${inputType}!){ ${mutationField}(input: $input){ ${payloadField} { id } } }`, { input })
  const id = res.data?.[mutationField]?.[payloadField]?.id
  if (!id) throw new Error(`${mutationField} failed: ${JSON.stringify(res.errors)}`)
  return id
}

/** Create a control (only `refCode` required). */
export const createControl = (sess: ApiSession, refCode: string): Promise<string> => seedEntity(sess, 'createControl', 'CreateControlInput', 'control', { refCode })

/** Create an internal policy (only `name` required). */
export const createInternalPolicy = (sess: ApiSession, name: string): Promise<string> => seedEntity(sess, 'createInternalPolicy', 'CreateInternalPolicyInput', 'internalPolicy', { name })

/** Create a procedure (only `name` required). */
export const createProcedure = (sess: ApiSession, name: string): Promise<string> => seedEntity(sess, 'createProcedure', 'CreateProcedureInput', 'procedure', { name })

/** Create a program (only `name` required). */
export const createProgram = (sess: ApiSession, name: string): Promise<string> => seedEntity(sess, 'createProgram', 'CreateProgramInput', 'program', { name })

/** Create a risk (only `name` required). */
export const createRisk = (sess: ApiSession, name: string): Promise<string> => seedEntity(sess, 'createRisk', 'CreateRiskInput', 'risk', { name })

/** Create a task (only `title` required). */
export const createTask = (sess: ApiSession, title: string): Promise<string> => seedEntity(sess, 'createTask', 'CreateTaskInput', 'task', { title })

/** Create a group (only `name` required). */
export const createGroup = (sess: ApiSession, name: string): Promise<string> => seedEntity(sess, 'createGroup', 'CreateGroupInput', 'group', { name })

/** Create an evidence record (only `name` required). */
export const createEvidence = (sess: ApiSession, name: string): Promise<string> => seedEntity(sess, 'createEvidence', 'CreateEvidenceInput', 'evidence', { name })

/** Create a registry asset (only `name` required). */
export const createAsset = (sess: ApiSession, name: string): Promise<string> => seedEntity(sess, 'createAsset', 'CreateAssetInput', 'asset', { name })

/** Create a registry contact (identified by `fullName`). */
export const createContact = (sess: ApiSession, fullName: string): Promise<string> => seedEntity(sess, 'createContact', 'CreateContactInput', 'contact', { fullName })

/** Create a campaign (only `name` required). Unblocks campaign detail/bulk specs. */
export const createCampaign = (sess: ApiSession, name: string): Promise<string> => seedEntity(sess, 'createCampaign', 'CreateCampaignInput', 'campaign', { name })

/** Create a registry platform (only `name` required). */
export const createPlatform = (sess: ApiSession, name: string): Promise<string> => seedEntity(sess, 'createPlatform', 'CreatePlatformInput', 'platform', { name })

/** Minimal SurveyJS definition for a seeded questionnaire template. */
const MINIMAL_SURVEY = { pages: [{ name: 'page1', elements: [{ type: 'text', name: 'q1', title: 'Question 1' }] }] }

/** Create a questionnaire template (name + jsonconfig). Returns the template id. */
export const createTemplate = (sess: ApiSession, name: string): Promise<string> => seedEntity(sess, 'createTemplate', 'CreateTemplateInput', 'template', { name, jsonconfig: MINIMAL_SURVEY })

/**
 * Create a questionnaire (Assessment) from a fresh template and return its id.
 * Unblocks the questionnaire list/send/row-action specs.
 */
export const createQuestionnaire = async (sess: ApiSession, name: string): Promise<string> => {
  const templateId = await createTemplate(sess, `${name} (template)`)
  return seedEntity(sess, 'createAssessment', 'CreateAssessmentInput', 'assessment', { name, templateID: templateId })
}

/**
 * Create a vendor — an Entity created with `entityTypeName: "vendor"` (matches
 * the console's vendor create flow). Uses the extra entityTypeName arg, so it
 * can't go through the generic seedEntity helper.
 */
export const createVendor = async (sess: ApiSession, name: string): Promise<string> => {
  const res = await gql<{ createEntity: { entity: { id: string } } }>(
    sess,
    `mutation($input: CreateEntityInput!, $entityTypeName: String){ createEntity(input: $input, entityTypeName: $entityTypeName){ entity { id } } }`,
    { input: { name }, entityTypeName: 'vendor' },
  )
  const id = res.data?.createEntity?.entity?.id
  if (!id) throw new Error(`createVendor failed: ${JSON.stringify(res.errors)}`)
  return id
}

// Associate objects with a control via updateControl's add*IDs fields.
const updateControlAssoc = async (sess: ApiSession, controlId: string, input: Record<string, unknown>): Promise<void> => {
  const res = await gql<{ updateControl: { control: { id: string } } }>(sess, `mutation($id: ID!, $input: UpdateControlInput!){ updateControl(id: $id, input: $input){ control { id } } }`, {
    id: controlId,
    input,
  })
  if (!res.data?.updateControl?.control?.id) throw new Error(`updateControlAssoc failed: ${JSON.stringify(res.errors)}`)
}

/** Link an internal policy to a control (control side: addInternalPolicyIDs). */
export const linkControlPolicy = (sess: ApiSession, controlId: string, policyId: string): Promise<void> => updateControlAssoc(sess, controlId, { addInternalPolicyIDs: [policyId] })

/** Link a procedure to a control (control side: addProcedureIDs). */
export const linkControlProcedure = (sess: ApiSession, controlId: string, procedureId: string): Promise<void> => updateControlAssoc(sess, controlId, { addProcedureIDs: [procedureId] })

/** Link an evidence record to a control (control side: addEvidenceIDs). */
export const linkControlEvidence = (sess: ApiSession, controlId: string, evidenceId: string): Promise<void> => updateControlAssoc(sess, controlId, { addEvidenceIDs: [evidenceId] })

/** Link a control to a procedure (procedure side: addControlIDs). */
export const linkProcedureControl = async (sess: ApiSession, procedureId: string, controlId: string): Promise<void> => {
  const res = await gql<{ updateProcedure: { procedure: { id: string } } }>(sess, `mutation($id: ID!, $input: UpdateProcedureInput!){ updateProcedure(id: $id, input: $input){ procedure { id } } }`, {
    id: procedureId,
    input: { addControlIDs: [controlId] },
  })
  if (!res.data?.updateProcedure?.procedure?.id) throw new Error(`linkProcedureControl failed: ${JSON.stringify(res.errors)}`)
}

/** Create a fresh non-personal organization owned by the caller. */
export const createSharedOrg = async (sess: ApiSession, name: string): Promise<string> => {
  const res = await gql<{ createOrganization: { organization: { id: string } } }>(sess, `mutation($input: CreateOrganizationInput!){ createOrganization(input: $input){ organization { id } } }`, {
    input: { name },
  })
  const id = res.data?.createOrganization?.organization?.id
  if (!id) throw new Error(`createSharedOrg failed: ${JSON.stringify(res.errors)}`)
  return id
}

export type SeedRole = 'ADMIN' | 'MEMBER' | 'AUDITOR'

interface MemberEdge {
  id: string
  role: SeedRole | 'OWNER'
  userID: string
}

/**
 * Find a user's orgMembership id (and current role) in an org. Reads the
 * `userID` scalar — NOT the `user{}` edge, which throws "user not found" under
 * FGA lag. Retries until the membership row appears.
 */
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

/**
 * Add an existing user to an org with a role.
 *
 * createOrgMembership always lands the user as MEMBER (it ignores the role
 * argument), so non-MEMBER roles are elevated with a follow-up
 * updateOrgMembership. That update only authorizes when the OWNER's token is
 * scoped to this org — callers must pass an owner session whose active org is
 * `organizationID` (see global-setup, which sets the owner's defaultOrg first).
 *
 * Neither mutation's payload is trusted (FGA lag 404s the response even on
 * success); success is confirmed by re-reading the membership role.
 */
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
  // Confirm via a fresh read in case the payload lagged but the write landed.
  const after = await findMembership(owner, organizationID, userID)
  if (after.role !== role) {
    throw new Error(`addOrgMember: could not elevate user ${userID} to ${role} (still ${after.role})`)
  }
}

/**
 * Poll until the user's own session reports membership in `organizationID`.
 * This is the authoritative success check for addOrgMember — it waits out the
 * authorization-propagation lag instead of trusting the mutation payload.
 */
export const memberSeesOrg = async (member: ApiSession, organizationID: string, tries = 10, delayMs = 500): Promise<boolean> => {
  for (let i = 0; i < tries; i++) {
    const orgs = await getSharedOrgs(member)
    if (orgs.some((o) => o.id === organizationID)) return true
    await sleep(delayMs)
  }
  return false
}
