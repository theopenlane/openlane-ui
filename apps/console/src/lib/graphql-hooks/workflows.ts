import { useMutation, useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  APPROVE_WORKFLOW_ASSIGNMENT,
  GET_WORKFLOW_INSTANCES,
  GET_WORKFLOW_METADATA,
  GET_WORKFLOW_ASSIGNMENTS,
  GET_WORKFLOW_PROPOSALS_FOR_OBJECT,
  REJECT_WORKFLOW_ASSIGNMENT,
  REQUEST_CHANGES_WORKFLOW_ASSIGNMENT,
  REASSIGN_WORKFLOW_ASSIGNMENT,
} from '@repo/codegen/query/workflows'
import { WorkflowInstance, WorkflowInstanceWhereInput, WorkflowAssignment, WorkflowAssignmentOrder, WorkflowAssignmentWhereInput } from '@repo/codegen/src/schema'
import { GET_ALL_WORKFLOW_DEFINITIONS } from '@repo/codegen/query/workflow-definition'

type WorkflowFieldMetadata = {
  name: string
  label: string
  type: string
}

export type WorkflowObjectTypeMetadata = {
  type: string
  label: string
  description: string
  eligibleFields: WorkflowFieldMetadata[]
  eligibleEdges: string[]
  resolverKeys: string[]
}

type WorkflowMetadataResponse = {
  workflowMetadata: {
    objectTypes: WorkflowObjectTypeMetadata[]
  }
}

type WorkflowDefinitionsResponse = {
  workflowDefinitions: {
    totalCount: number
    pageInfo: {
      startCursor?: string | null
      endCursor?: string | null
      hasPreviousPage: boolean
      hasNextPage: boolean
    }
    edges: { node?: WorkflowDefinition | null }[]
  }
}

type WorkflowDefinitionResponse = {
  workflowDefinition: WorkflowDefinition | null
}

type WorkflowInstancesResponse = {
  workflowInstances: {
    edges: { node?: WorkflowInstance | null }[]
  }
}

type WorkflowAssignmentsResponse = {
  organization?: {
    workflowAssignments: {
      totalCount: number
      edges: { node?: WorkflowAssignment | null }[]
    }
  } | null
}

type WorkflowProposal = {
  id: string
  state: string
  domainKey?: string | null
  revision?: number | null
  changes?: Record<string, unknown> | null
  createdAt?: string | null
  updatedAt?: string | null
  submittedAt?: string | null
}

type WorkflowProposalsResponse = {
  workflowProposalsForObject: WorkflowProposal[]
}

const WORKFLOW_OBJECT_WHERE_FIELD_MAP: Record<string, keyof WorkflowInstanceWhereInput> = {
  actionplan: 'actionPlanID',
  campaign: 'campaignID',
  campaigntarget: 'campaignTargetID',
  control: 'controlID',
  evidence: 'evidenceID',
  identityholder: 'identityHolderID',
  internalpolicy: 'internalPolicyID',
  platform: 'platformID',
  procedure: 'procedureID',
  subcontrol: 'subcontrolID',
}

const normalizeObjectType = (value: string) => value.replace(/[\s_]/g, '').toLowerCase()

export const useWorkflowMetadata = () => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<WorkflowMetadataResponse>({
    queryKey: ['workflowMetadata'],
    queryFn: () => client.request(GET_WORKFLOW_METADATA),
  })

  return {
    ...queryResult,
    objectTypes: queryResult.data?.workflowMetadata?.objectTypes ?? [],
  }
}

type UseWorkflowDefinitionsArgs = {
  where?: WorkflowDefinitionWhereInput
  orderBy?: WorkflowDefinitionOrder[]
  first?: number
  enabled?: boolean
}

export const useWorkflowDefinitions = ({ where, orderBy, first = 50, enabled = true }: UseWorkflowDefinitionsArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<WorkflowDefinitionsResponse>({
    queryKey: ['workflowDefinitions', where, orderBy, first],
    queryFn: () =>
      client.request(GET_ALL_WORKFLOW_DEFINITIONS, {
        where,
        orderBy,
        first,
      }),
    enabled,
  })

  const definitions = queryResult.data?.workflowDefinitions?.edges?.map((edge) => edge?.node).filter(Boolean) as WorkflowDefinition[]

  return {
    ...queryResult,
    definitions,
    totalCount: queryResult.data?.workflowDefinitions?.totalCount ?? 0,
    pageInfo: queryResult.data?.workflowDefinitions?.pageInfo,
  }
}

export const useWorkflowDefinition = (id?: string | null, enabled = true) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<WorkflowDefinitionResponse>({
    queryKey: ['workflowDefinition', id],
    queryFn: () => client.request(GET_WORKFLOW_DEFINITION_BY_ID, { workflowDefinitionId: id }),
    enabled: Boolean(id) && enabled,
  })

  return {
    ...queryResult,
    definition: queryResult.data?.workflowDefinition ?? null,
  }
}

export const useUpdateWorkflowDefinition = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateWorkflowDefinitionInput }) => client.request(UPDATE_WORKFLOW_DEFINITION, { updateWorkflowDefinitionId: id, input }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workflowDefinitions'] })
      queryClient.invalidateQueries({ queryKey: ['workflowDefinition', variables.id] })
    },
  })
}

export const useDeleteWorkflowDefinition = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation({
    mutationFn: (id: string) => client.request(DELETE_WORKFLOW_DEFINITION, { deleteWorkflowDefinitionId: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflowDefinitions'] })
    },
  })
}

type UseWorkflowInstancesArgs = {
  objectId?: string | null
  objectType?: string | null
  first?: number
  enabled?: boolean
}

export const useWorkflowInstancesForObject = ({ objectId, objectType, first = 50, enabled = true }: UseWorkflowInstancesArgs) => {
  const { client } = useGraphQLClient()
  const normalized = objectType ? normalizeObjectType(objectType) : ''
  const whereField = normalized ? WORKFLOW_OBJECT_WHERE_FIELD_MAP[normalized] : undefined

  const where = whereField && objectId ? ({ [whereField]: objectId } as WorkflowInstanceWhereInput) : undefined

  const queryResult = useQuery<WorkflowInstancesResponse>({
    queryKey: ['workflowInstances', objectType, objectId, first],
    queryFn: () => client.request(GET_WORKFLOW_INSTANCES, { where, first }),
    enabled: Boolean(whereField && objectId) && enabled,
  })

  const instances = (queryResult.data?.workflowInstances?.edges ?? []).map((edge) => edge?.node).filter(Boolean) as WorkflowInstance[]

  return {
    ...queryResult,
    instances,
  }
}

type UseWorkflowProposalsForObjectArgs = {
  objectId?: string | null
  objectType?: string | null
  includeStates?: string[]
  enabled?: boolean
}

export const useWorkflowProposalsForObject = ({ objectId, objectType, includeStates, enabled = true }: UseWorkflowProposalsForObjectArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<WorkflowProposalsResponse>({
    queryKey: ['workflowProposalsForObject', objectType, objectId, includeStates],
    queryFn: () =>
      client.request(GET_WORKFLOW_PROPOSALS_FOR_OBJECT, {
        objectType,
        objectID: objectId,
        includeStates,
      }),
    enabled: Boolean(objectType && objectId) && enabled,
  })

  return {
    ...queryResult,
    proposals: queryResult.data?.workflowProposalsForObject ?? [],
  }
}

type UseWorkflowInstancesQueryArgs = {
  where?: WorkflowInstanceWhereInput
  first?: number
  enabled?: boolean
}

export const useWorkflowInstances = ({ where, first = 50, enabled = true }: UseWorkflowInstancesQueryArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<WorkflowInstancesResponse>({
    queryKey: ['workflowInstances', where, first],
    queryFn: () => client.request(GET_WORKFLOW_INSTANCES, { where, first }),
    enabled,
  })

  const instances = (queryResult.data?.workflowInstances?.edges ?? []).map((edge) => edge?.node).filter(Boolean) as WorkflowInstance[]

  return {
    ...queryResult,
    instances,
  }
}

type UseWorkflowAssignmentsArgs = {
  organizationId?: string | null
  where?: WorkflowAssignmentWhereInput
  orderBy?: WorkflowAssignmentOrder[]
  first?: number
  enabled?: boolean
}

export const useWorkflowAssignments = ({ organizationId, where, orderBy, first = 50, enabled = true }: UseWorkflowAssignmentsArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<WorkflowAssignmentsResponse>({
    queryKey: ['workflowAssignments', organizationId, where, orderBy, first],
    queryFn: () =>
      client.request(GET_WORKFLOW_ASSIGNMENTS, {
        organizationId,
        where,
        orderBy,
        first,
      }),
    enabled: Boolean(organizationId) && enabled,
  })

  const assignments = (queryResult.data?.organization?.workflowAssignments?.edges ?? []).map((edge) => edge?.node).filter(Boolean) as WorkflowAssignment[]

  return {
    ...queryResult,
    assignments,
    totalCount: queryResult.data?.organization?.workflowAssignments?.totalCount ?? 0,
  }
}

export const useApproveAssignment = () => {
  const { client } = useGraphQLClient()

  return useMutation({
    mutationFn: ({ id }: { id: string }) => client.request(APPROVE_WORKFLOW_ASSIGNMENT, { id }),
  })
}

export const useRejectAssignment = () => {
  const { client } = useGraphQLClient()

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => client.request(REJECT_WORKFLOW_ASSIGNMENT, { id, reason }),
  })
}

export const useRequestChangesAssignment = () => {
  const { client } = useGraphQLClient()

  return useMutation({
    mutationFn: ({ id, reason, inputs }: { id: string; reason?: string; inputs?: Record<string, unknown> }) => client.request(REQUEST_CHANGES_WORKFLOW_ASSIGNMENT, { id, reason, inputs }),
  })
}

export const useReassignAssignment = () => {
  const { client } = useGraphQLClient()

  return useMutation({
    mutationFn: ({ id, targetUserID }: { id: string; targetUserID: string }) => client.request(REASSIGN_WORKFLOW_ASSIGNMENT, { id, targetUserID }),
  })
}
