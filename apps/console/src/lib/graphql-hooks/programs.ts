import { useQuery, useMutation } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'

import {
  CREATE_PROGRAM_WITH_MEMBERS,
  UPDATE_PROGRAM,
  GET_ALL_PROGRAMS,
  GET_PROGRAM_EDGES_FOR_WIZARD,
  GET_PROGRAM_DETAILS_BY_ID,
  GET_PROGRAM_BASIC_INFO,
  GET_EVIDENCE_STATS,
  GET_GLOBAL_EVIDENCE_STATS,
} from '@repo/codegen/query/programs'

import {
  GetAllProgramsQuery,
  GetAllProgramsQueryVariables,
  GetProgramEdgesForWizardQuery,
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
} from '@repo/codegen/src/schema'

interface UseGetAllProgramsArgs {
  where?: GetAllProgramsQueryVariables['where']
  orderBy?: GetAllProgramsQueryVariables['orderBy']
}

export const useGetAllPrograms = ({ where, orderBy }: UseGetAllProgramsArgs = {}) => {
  const { client } = useGraphQLClient()

  return useQuery<GetAllProgramsQuery, GetAllProgramsQueryVariables>({
    queryKey: ['programs', { where, orderBy }],
    queryFn: async () => client.request(GET_ALL_PROGRAMS, { where, orderBy }),
    enabled: true,
  })
}

export const useGetProgramEdgesForWizard = () => {
  const { client } = useGraphQLClient()

  return useQuery<GetProgramEdgesForWizardQuery>({
    queryKey: ['programEdgesForWizard'],
    queryFn: async () => client.request(GET_PROGRAM_EDGES_FOR_WIZARD),
  })
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
  const { client } = useGraphQLClient()

  return useMutation<UpdateProgramMutation, unknown, UpdateProgramMutationVariables>({
    mutationFn: (variables) => client.request(UPDATE_PROGRAM, variables),
  })
}

export const useGetProgramBasicInfo = (programId: string | null) => {
  const { client } = useGraphQLClient()

  return useQuery<GetProgramBasicInfoQuery, GetProgramBasicInfoQueryVariables>({
    queryKey: ['programs', programId, 'basic'],
    queryFn: async () => client.request(GET_PROGRAM_BASIC_INFO, { programId }),
    enabled: !!programId,
  })
}

type ProgramEvidenceStats = {
  total: number
  submitted: number
  accepted: number
  overdue: number
}

export const useProgramEvidenceStats = (programId: string) => {
  const { client } = useGraphQLClient()

  return useQuery<ProgramEvidenceStats>({
    queryKey: ['program-evidence-stats', programId],
    queryFn: async () => {
      const data = await client.request<GetEvidenceStatsQuery>(GET_EVIDENCE_STATS, { programId })

      return {
        total: data.totalControls.totalCount,
        submitted: data.submitted.totalCount,
        accepted: data.accepted.totalCount,
        overdue: data.overdue.totalCount,
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
        overdue: data.overdue.totalCount,
      }
    },
    enabled,
  })
}
