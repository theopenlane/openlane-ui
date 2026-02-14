import { useQuery, useMutation } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'

import {
  CREATE_PROGRAM_WITH_MEMBERS,
  UPDATE_PROGRAM,
  GET_ALL_PROGRAMS,
  GET_PROGRAM_DETAILS_BY_ID,
  GET_PROGRAM_BASIC_INFO,
  GET_EVIDENCE_STATS,
  GET_GLOBAL_EVIDENCE_STATS,
  GET_PROGRAM_SETTINGS,
  GET_PROGRAM_MEMBERS,
  GET_PROGRAM_GROUPS,
  DELETE_PROGRAM,
  UPDATE_PROGRAM_MEMBERSHIP,
  GET_PROGRAM_DASHBOARD,
} from '@repo/codegen/query/program'

import {
  GetAllProgramsQuery,
  GetAllProgramsQueryVariables,
  GetProgramDetailsByIdQuery,
  GetProgramDetailsByIdQueryVariables,
  CreateProgramWithMembersMutation,
  CreateProgramWithMembersMutationVariables,
  UpdateProgramMutation,
  UpdateProgramMutationVariables,
  GetProgramBasicInfoQuery,
  GetProgramBasicInfoQueryVariables,
  GetEvidenceStatsQuery,
  GetGlobalEvidenceStatsQuery,
  GetProgramSettingsQuery,
  GetProgramSettingsQueryVariables,
  ProgramMembershipWhereInput,
  GetProgramMembersQuery,
  GetProgramMembersQueryVariables,
  GetProgramGroupsQuery,
  GetProgramGroupsQueryVariables,
  DeleteProgramMutationVariables,
  UpdateProgramMembershipMutationVariables,
  ProgramWhereInput,
  Program,
  GetProgramDashboardQuery,
  GetProgramDashboardQueryVariables,
} from '@repo/codegen/src/schema'
import { TPagination } from '@repo/ui/pagination-types'

interface UseGetAllProgramsArgs {
  where?: GetAllProgramsQueryVariables['where']
  orderBy?: GetAllProgramsQueryVariables['orderBy']
  pagination?: TPagination | null
  enabled?: boolean
}

export const useGetAllPrograms = ({ where, orderBy }: UseGetAllProgramsArgs = {}) => {
  const { client } = useGraphQLClient()

  return useQuery<GetAllProgramsQuery, GetAllProgramsQueryVariables>({
    queryKey: ['programs', { where, orderBy }],
    queryFn: async () => client.request(GET_ALL_PROGRAMS, { where, orderBy }),
    enabled: true,
  })
}

export const useGetAllProgramsPaginated = ({ where, orderBy, pagination, enabled = true }: UseGetAllProgramsArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<GetAllProgramsQuery, GetAllProgramsQueryVariables>({
    queryKey: ['programs', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: () =>
      client.request(GET_ALL_PROGRAMS, {
        where,
        orderBy,
        ...pagination?.query,
      }),
    enabled,
  })

  const edges = queryResult.data?.programs?.edges ?? []
  const programs = edges.map((edge) => edge?.node).filter(Boolean) as Program[]

  const paginationMeta = {
    totalCount: queryResult.data?.programs?.totalCount ?? 0,
    pageInfo: queryResult.data?.programs?.pageInfo,
    isLoading: queryResult.isFetching,
  }

  return {
    ...queryResult,
    programs,
    paginationMeta,
  }
}

export const useGetProgramDetailsById = (programId: string | null) => {
  const { client } = useGraphQLClient()

  return useQuery<GetProgramDetailsByIdQuery, GetProgramDetailsByIdQueryVariables>({
    queryKey: ['programs', programId],
    queryFn: async () => client.request(GET_PROGRAM_DETAILS_BY_ID, { programId }),
    enabled: !!programId,
  })
}

export const useCreateProgramWithMembers = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<CreateProgramWithMembersMutation, unknown, CreateProgramWithMembersMutationVariables>({
    mutationFn: (variables) => client.request(CREATE_PROGRAM_WITH_MEMBERS, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0]
          return key === 'programs' || key === 'dashboard'
        },
      })
    },
  })
}

export const useUpdateProgram = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<UpdateProgramMutation, unknown, UpdateProgramMutationVariables>({
    mutationFn: (variables) => client.request(UPDATE_PROGRAM, variables),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['programs'] }),
  })
}

export const useGetProgramBasicInfo = (programId: string | null, enabled: boolean = true) => {
  const { client } = useGraphQLClient()

  return useQuery<GetProgramBasicInfoQuery, GetProgramBasicInfoQueryVariables>({
    queryKey: ['programs', programId, 'basic'],
    queryFn: async () => client.request(GET_PROGRAM_BASIC_INFO, { programId }),
    enabled: !!programId && enabled,
  })
}

type ProgramEvidenceStats = {
  total: number
  submitted: number
  accepted: number
  rejected: number
}

export const useProgramEvidenceStats = (programId: string | undefined) => {
  const { client } = useGraphQLClient()

  return useQuery<ProgramEvidenceStats>({
    queryKey: ['program-evidence-stats', programId],
    queryFn: async () => {
      const data = await client.request<GetEvidenceStatsQuery>(GET_EVIDENCE_STATS, { programId })

      return {
        total: data.totalControls.totalCount,
        submitted: data.submitted.totalCount,
        accepted: data.accepted.totalCount,
        rejected: data.rejected.totalCount,
      }
    },
    enabled: !!programId,
  })
}

export const useGlobalEvidenceStats = ({ enabled = true }) => {
  const { client } = useGraphQLClient()

  return useQuery<ProgramEvidenceStats>({
    queryKey: ['global-evidence-stats'],
    queryFn: async () => {
      const data = await client.request<GetGlobalEvidenceStatsQuery>(GET_GLOBAL_EVIDENCE_STATS)

      return {
        total: data.totalControls.totalCount,
        submitted: data.submitted.totalCount,
        accepted: data.accepted.totalCount,
        rejected: data.rejected.totalCount,
      }
    },
    enabled,
  })
}

export const useProgramSelect = ({ where }: { where?: ProgramWhereInput }) => {
  const { data, ...rest } = useGetAllPrograms({ where })

  const programOptions = data?.programs?.edges?.flatMap((edge) => (edge?.node?.id && edge?.node?.name ? [{ label: edge.node.name, value: edge.node.id }] : [])) || []

  return { programOptions, ...rest }
}

export const useGetProgramSettings = (programId: string | null) => {
  const { client } = useGraphQLClient()

  return useQuery<GetProgramSettingsQuery, GetProgramSettingsQueryVariables>({
    queryKey: ['programs', programId, 'settings'],
    queryFn: async () => client.request(GET_PROGRAM_SETTINGS, { programId }),
    enabled: !!programId,
  })
}

export const useGetProgramMembers = ({ pagination, where, enabled = true }: { pagination?: TPagination; where?: ProgramMembershipWhereInput; enabled?: boolean }) => {
  const { client } = useGraphQLClient()

  return useQuery<GetProgramMembersQuery, GetProgramMembersQueryVariables>({
    queryKey: ['programMemberships', pagination?.pageSize, pagination?.page, where],
    queryFn: () => client.request(GET_PROGRAM_MEMBERS, { ...pagination?.query, where }),
    enabled,
  })
}

export const useGetProgramGroups = ({ programId, enabled = true }: { programId: string | null; pagination?: TPagination; enabled?: boolean }) => {
  const { client } = useGraphQLClient()

  return useQuery<GetProgramGroupsQuery, GetProgramGroupsQueryVariables>({
    queryKey: ['programs', programId, 'groups'],
    queryFn: () =>
      client.request(GET_PROGRAM_GROUPS, {
        programId,
      }),
    enabled: enabled && !!programId,
  })
}

export const useDeleteProgram = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<void, Error, DeleteProgramMutationVariables>({
    mutationFn: ({ deleteProgramId }) => client.request(DELETE_PROGRAM, { deleteProgramId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['programs'] }),
  })
}

export const useUpdateProgramMembership = () => {
  const { client } = useGraphQLClient()

  return useMutation({
    mutationFn: async (variables: UpdateProgramMembershipMutationVariables) => {
      return client.request(UPDATE_PROGRAM_MEMBERSHIP, variables)
    },
  })
}

export const useGetProgramDashboard = ({ where, enabled = true }: { where?: ProgramWhereInput; enabled?: boolean }) => {
  const { client } = useGraphQLClient()

  return useQuery<GetProgramDashboardQuery, GetProgramDashboardQueryVariables>({
    queryKey: ['programs', 'dashboard', where],
    queryFn: async () => {
      return client.request(GET_PROGRAM_DASHBOARD, { where })
    },
    enabled: !!enabled,
  })
}

export type ProgramFromGetProgramDashboard = NonNullable<NonNullable<NonNullable<GetProgramDashboardQuery['programs']>['edges']>[number]>['node']
