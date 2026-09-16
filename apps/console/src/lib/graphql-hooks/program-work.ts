import { useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { GET_PROGRAM_WORK_TASKS, GET_PROGRAM_WORK_CONTROLS, GET_PROGRAM_WORK_EVIDENCES, GET_PROGRAM_WORK_INTERNAL_POLICIES, GET_PROGRAM_WORK_PROCEDURES } from '@repo/codegen/query/program-work'
import {
  type GetProgramWorkTasksQuery,
  type GetProgramWorkTasksQueryVariables,
  type GetProgramWorkControlsQuery,
  type GetProgramWorkControlsQueryVariables,
  type GetProgramWorkEvidencesQuery,
  type GetProgramWorkEvidencesQueryVariables,
  type GetProgramWorkInternalPoliciesQuery,
  type GetProgramWorkInternalPoliciesQueryVariables,
  type GetProgramWorkProceduresQuery,
  type GetProgramWorkProceduresQueryVariables,
} from '@repo/codegen/src/schema'

type ConnectionNode<TConnection extends { edges?: Array<{ node?: unknown } | null> | null }> = NonNullable<NonNullable<NonNullable<TConnection['edges']>[number]>['node']>

export type TProgramWorkTaskNode = ConnectionNode<GetProgramWorkTasksQuery['tasks']>
export type TProgramWorkControlNode = ConnectionNode<GetProgramWorkControlsQuery['controls']>
export type TProgramWorkEvidenceNode = ConnectionNode<GetProgramWorkEvidencesQuery['evidences']>
export type TProgramWorkPolicyNode = ConnectionNode<GetProgramWorkInternalPoliciesQuery['internalPolicies']>
export type TProgramWorkProcedureNode = ConnectionNode<GetProgramWorkProceduresQuery['procedures']>

type TProgramWorkQueryArgs<TVariables> = {
  variables: TVariables
  enabled: boolean
}

export const useProgramWorkTasks = ({ variables, enabled }: TProgramWorkQueryArgs<GetProgramWorkTasksQueryVariables>) => {
  const { client } = useGraphQLClient()

  return useQuery<GetProgramWorkTasksQuery>({
    queryKey: ['tasks', 'programWork', variables],
    queryFn: async () => client.request(GET_PROGRAM_WORK_TASKS, variables),
    enabled,
    placeholderData: undefined,
  })
}

export const useProgramWorkControls = ({ variables, enabled }: TProgramWorkQueryArgs<GetProgramWorkControlsQueryVariables>) => {
  const { client } = useGraphQLClient()

  return useQuery<GetProgramWorkControlsQuery>({
    queryKey: ['controls', 'programWork', variables],
    queryFn: async () => client.request(GET_PROGRAM_WORK_CONTROLS, variables),
    enabled,
    placeholderData: undefined,
  })
}

export const useProgramWorkEvidences = ({ variables, enabled }: TProgramWorkQueryArgs<GetProgramWorkEvidencesQueryVariables>) => {
  const { client } = useGraphQLClient()

  return useQuery<GetProgramWorkEvidencesQuery>({
    queryKey: ['evidences', 'programWork', variables],
    queryFn: async () => client.request(GET_PROGRAM_WORK_EVIDENCES, variables),
    enabled,
    placeholderData: undefined,
  })
}

export const useProgramWorkInternalPolicies = ({ variables, enabled }: TProgramWorkQueryArgs<GetProgramWorkInternalPoliciesQueryVariables>) => {
  const { client } = useGraphQLClient()

  return useQuery<GetProgramWorkInternalPoliciesQuery>({
    queryKey: ['internalPolicies', 'programWork', variables],
    queryFn: async () => client.request(GET_PROGRAM_WORK_INTERNAL_POLICIES, variables),
    enabled,
    placeholderData: undefined,
  })
}

export const useProgramWorkProcedures = ({ variables, enabled }: TProgramWorkQueryArgs<GetProgramWorkProceduresQueryVariables>) => {
  const { client } = useGraphQLClient()

  return useQuery<GetProgramWorkProceduresQuery>({
    queryKey: ['procedures', 'programWork', variables],
    queryFn: async () => client.request(GET_PROGRAM_WORK_PROCEDURES, variables),
    enabled,
    placeholderData: undefined,
  })
}
