import { getOwnerApi, gql, seedEntity, type ApiSession } from './api'

const MINIMAL_SURVEY = {
  title: 'Seeded questionnaire',
  pages: [{ name: 'page1', elements: [{ type: 'text', name: 'q1', title: 'Question 1' }] }],
}

const MINIMAL_WORKFLOW = {
  version: '1.0',
  schemaType: 'Control',
  workflowKind: 'APPROVAL',
  approvalTiming: 'PRE_COMMIT',
  targets: {},
  triggers: [{ operation: 'CREATE', objectType: 'Control', fields: [], edges: [] }],
  conditions: [],
  actions: [{ key: 'notify', type: 'NOTIFY', params: { channels: ['IN_APP'], targets: [] } }],
  metadata: {},
}

export type WorkflowSeedOptions = {
  description?: string
  schemaType?: string
  workflowKind?: 'APPROVAL' | 'LIFECYCLE' | 'NOTIFICATION'
  active?: boolean
  draft?: boolean
  isDefault?: boolean
  cooldownSeconds?: number
  definitionJSON?: Record<string, unknown>
}

export type TemplateSeedOptions = {
  description?: string
  environmentName?: string
  scopeName?: string
}

export type AssessmentSeedOptions = {
  assessmentType?: 'INTERNAL' | 'EXTERNAL'
  responseDueDuration?: number
  jsonconfig?: Record<string, unknown>
}

export type EmailTemplateSeedOptions = {
  active?: boolean
  defaults?: Record<string, unknown>
}

export type TokenSeedOptions = {
  description?: string
  expiresAt?: string
  scopes?: string[]
  organizationIDs?: string[]
}

export type CampaignSeedOptions = {
  description?: string
  campaignType?: 'CUSTOM' | 'QUESTIONNAIRE'
  status?: 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELED'
  templateID?: string
  emailTemplateID?: string
  dueDate?: string
}

export type TaskSeedOptions = {
  details?: string
  due?: string
  status?: 'OPEN' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED' | 'WONT_DO'
  assigneeID?: string
  taskKindName?: string
  tags?: string[]
}

export const getAutomationApi = getOwnerApi

export const createWorkflowDefinition = (session: ApiSession, name: string, options: WorkflowSeedOptions = {}): Promise<string> =>
  seedEntity(session, 'createWorkflowDefinition', 'CreateWorkflowDefinitionInput', 'workflowDefinition', {
    name,
    description: options.description,
    schemaType: options.schemaType ?? 'Control',
    workflowKind: options.workflowKind ?? 'APPROVAL',
    active: options.active ?? true,
    draft: options.draft ?? false,
    isDefault: options.isDefault ?? false,
    cooldownSeconds: options.cooldownSeconds ?? 0,
    definitionJSON: options.definitionJSON ?? { ...MINIMAL_WORKFLOW, name },
  })

export const deleteWorkflowDefinition = async (session: ApiSession, id: string): Promise<void> => {
  await gql(session, `mutation($id: ID!){ deleteWorkflowDefinition(id: $id){ deletedID } }`, { id })
}

export const findWorkflowDefinitionId = async (session: ApiSession, name: string): Promise<string | undefined> => {
  const result = await gql<{ workflowDefinitions: { edges: Array<{ node: { id: string } }> } }>(
    session,
    `query($where: WorkflowDefinitionWhereInput){ workflowDefinitions(where: $where, first: 1){ edges { node { id } } } }`,
    { where: { name } },
  )
  return result.data?.workflowDefinitions.edges[0]?.node.id
}

export const createQuestionnaireTemplate = (session: ApiSession, name: string, options: TemplateSeedOptions = {}): Promise<string> =>
  seedEntity(session, 'createTemplate', 'CreateTemplateInput', 'template', {
    name,
    description: options.description,
    environmentName: options.environmentName,
    scopeName: options.scopeName,
    kind: 'QUESTIONNAIRE',
    templateType: 'DOCUMENT',
    jsonconfig: { ...MINIMAL_SURVEY, title: name },
  })

export const deleteQuestionnaireTemplate = async (session: ApiSession, id: string): Promise<void> => {
  await gql(session, `mutation($id: ID!){ deleteTemplate(id: $id){ deletedID } }`, { id })
}

export const createAssessment = (session: ApiSession, name: string, options: AssessmentSeedOptions = {}): Promise<string> =>
  seedEntity(session, 'createAssessment', 'CreateAssessmentInput', 'assessment', {
    name,
    assessmentType: options.assessmentType ?? 'EXTERNAL',
    responseDueDuration: options.responseDueDuration ?? 604800,
    jsonconfig: options.jsonconfig ?? { ...MINIMAL_SURVEY, title: name },
  })

export const deleteAssessment = async (session: ApiSession, id: string): Promise<void> => {
  await gql(session, `mutation($id: ID!){ deleteAssessment(id: $id){ deletedID } }`, { id })
}

export const findAssessmentId = async (session: ApiSession, name: string): Promise<string | undefined> => {
  const result = await gql<{ assessments: { edges: Array<{ node: { id: string } }> } }>(
    session,
    `query($where: AssessmentWhereInput){ assessments(where: $where, first: 1){ edges { node { id } } } }`,
    {
      where: { name },
    },
  )
  return result.data?.assessments.edges[0]?.node.id
}

export const createAssessmentResponse = (session: ApiSession, assessmentID: string, email: string, dueDate?: string): Promise<string> =>
  seedEntity(session, 'createAssessmentResponse', 'CreateAssessmentResponseInput', 'assessmentResponse', {
    assessmentID,
    email,
    dueDate,
  })

export const deleteAssessmentResponse = async (session: ApiSession, id: string): Promise<void> => {
  await gql(session, `mutation($id: ID!){ deleteAssessmentResponse(id: $id){ deletedID } }`, { id })
}

export const createContactWithEmail = (session: ApiSession, fullName: string, email: string): Promise<string> =>
  seedEntity(session, 'createContact', 'CreateContactInput', 'contact', { fullName, email })

export const deleteContact = async (session: ApiSession, id: string): Promise<void> => {
  await gql(session, `mutation($id: ID!){ deleteContact(id: $id){ deletedID } }`, { id })
}

const getEmailCatalogEntry = async (session: ApiSession): Promise<{ key: string; exampleValues?: Record<string, unknown> | null }> => {
  const result = await gql<{ emailTemplateCatalog: { entries: Array<{ key: string; exampleValues?: Record<string, unknown> | null }> } }>(
    session,
    `{ emailTemplateCatalog { entries { key exampleValues } } }`,
  )
  const entry = result.data?.emailTemplateCatalog.entries[0]
  if (!entry) throw new Error(`emailTemplateCatalog failed: ${JSON.stringify(result.errors)}`)
  return entry
}

export const createEmailTemplate = async (session: ApiSession, name: string, options: EmailTemplateSeedOptions = {}): Promise<string> => {
  const catalogEntry = await getEmailCatalogEntry(session)
  return seedEntity(session, 'createEmailTemplate', 'CreateEmailTemplateInput', 'emailTemplate', {
    key: catalogEntry.key,
    name,
    defaults: options.defaults ?? catalogEntry.exampleValues ?? {},
    locale: 'en',
    format: 'HTML',
    active: options.active ?? true,
    templateContext: 'CAMPAIGN_RECIPIENT',
  })
}

export const deleteEmailTemplate = async (session: ApiSession, id: string): Promise<void> => {
  await gql(session, `mutation($id: ID!){ deleteEmailTemplate(id: $id){ deletedID } }`, { id })
}

export const getOwnerOrganization = async (session: ApiSession): Promise<{ id: string; name: string }> => {
  const result = await gql<{ self: { organizations: { edges: Array<{ node: { id: string; name: string; personalOrg: boolean } }> } } }>(
    session,
    `{ self { organizations(first: 50) { edges { node { id name personalOrg } } } } }`,
  )
  const organization = result.data?.self.organizations.edges.map((edge) => edge.node).find((node) => !node.personalOrg)
  if (!organization) throw new Error(`owner organization lookup failed: ${JSON.stringify(result.errors)}`)
  return organization
}

export const getOwnerOrganizationId = async (session: ApiSession): Promise<string> => (await getOwnerOrganization(session)).id

export const createApiToken = (session: ApiSession, name: string, options: TokenSeedOptions = {}): Promise<string> =>
  seedEntity(session, 'createAPIToken', 'CreateAPITokenInput', 'apiToken', {
    name,
    description: options.description,
    expiresAt: options.expiresAt,
    scopes: options.scopes ?? [],
  })

export const deleteApiToken = async (session: ApiSession, id: string): Promise<void> => {
  await gql(session, `mutation($id: ID!){ deleteAPIToken(id: $id){ deletedID } }`, { id })
}

export const createPersonalAccessToken = async (session: ApiSession, name: string, options: TokenSeedOptions = {}): Promise<string> => {
  const organizationIDs = options.organizationIDs ?? [await getOwnerOrganizationId(session)]
  return seedEntity(session, 'createPersonalAccessToken', 'CreatePersonalAccessTokenInput', 'personalAccessToken', {
    name,
    description: options.description,
    expiresAt: options.expiresAt,
    organizationIDs,
  })
}

export const deletePersonalAccessToken = async (session: ApiSession, id: string): Promise<void> => {
  await gql(session, `mutation($id: ID!){ deletePersonalAccessToken(id: $id){ deletedID } }`, { id })
}

export const createAutomationCampaign = (session: ApiSession, name: string, options: CampaignSeedOptions = {}): Promise<string> =>
  seedEntity(session, 'createCampaign', 'CreateCampaignInput', 'campaign', {
    name,
    description: options.description,
    campaignType: options.campaignType,
    status: options.status ?? 'DRAFT',
    templateID: options.templateID,
    emailTemplateID: options.emailTemplateID,
    dueDate: options.dueDate,
  })

export const deleteAutomationCampaign = async (session: ApiSession, id: string): Promise<void> => {
  await gql(session, `mutation($id: ID!){ deleteCampaign(id: $id){ deletedID } }`, { id })
}

export const findAutomationCampaignId = async (session: ApiSession, name: string): Promise<string | undefined> => {
  const result = await gql<{ campaigns: { edges: Array<{ node: { id: string } }> } }>(session, `query($where: CampaignWhereInput){ campaigns(where: $where, first: 1){ edges { node { id } } } }`, {
    where: { name },
  })
  return result.data?.campaigns.edges[0]?.node.id
}

export const createAutomationTask = (session: ApiSession, title: string, options: TaskSeedOptions = {}): Promise<string> =>
  seedEntity(session, 'createTask', 'CreateTaskInput', 'task', {
    title,
    details: options.details,
    due: options.due,
    status: options.status,
    assigneeID: options.assigneeID,
    taskKindName: options.taskKindName,
    tags: options.tags,
  })

export const deleteAutomationTask = async (session: ApiSession, id: string): Promise<void> => {
  await gql(session, `mutation($id: ID!){ deleteTask(id: $id){ deletedID } }`, { id })
}

export const getOwnerUser = async (session: ApiSession): Promise<{ id: string; displayName: string }> => {
  const result = await gql<{ self: { id: string; displayName: string } }>(session, `{ self { id displayName } }`)
  const user = result.data?.self
  if (!user) throw new Error(`owner user lookup failed: ${JSON.stringify(result.errors)}`)
  return user
}

export const getSystemOwnedQuestionnaireTemplate = async (session: ApiSession): Promise<{ id: string; name: string } | undefined> => {
  const result = await gql<{ templates: { edges: Array<{ node: { id: string; name: string } }> } }>(
    session,
    `query($where: TemplateWhereInput){ templates(where: $where, first: 1){ edges { node { id name } } } }`,
    { where: { systemOwned: true, kind: 'QUESTIONNAIRE' } },
  )
  return result.data?.templates.edges[0]?.node
}
