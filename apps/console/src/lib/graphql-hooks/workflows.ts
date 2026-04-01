import { useMutation, useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  APPROVE_WORKFLOW_ASSIGNMENT,
  GET_WORKFLOW_METADATA,
  GET_WORKFLOW_PROPOSALS_FOR_OBJECT,
  REJECT_WORKFLOW_ASSIGNMENT,
  REQUEST_CHANGES_WORKFLOW_ASSIGNMENT,
  REASSIGN_WORKFLOW_ASSIGNMENT,
} from '@repo/codegen/query/workflows'
import { GET_ALL_WORKFLOW_INSTANCES } from '@repo/codegen/query/workflow-instance'
import type { WorkflowInstance, WorkflowInstanceWhereInput } from '@repo/codegen/src/schema'

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
type WorkflowInstancesResponse = {
  workflowInstances: {
    edges: { node?: WorkflowInstance | null }[]
  }
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
    queryFn: () => client.request(GET_ALL_WORKFLOW_INSTANCES, { where, first }),
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
