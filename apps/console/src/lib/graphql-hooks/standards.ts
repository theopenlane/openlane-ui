import { useMutation, useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'

import {
  CREATE_CONTROLS_BY_CLONE,
  CREATE_STANDARD,
  DELETE_STANDARD,
  GET_ALL_STANDARDS,
  GET_ALL_STANDARDS_SELECT,
  GET_STANDARD_DETAILS,
  GET_STANDARDS_TABLE,
  UPDATE_STANDARD,
} from '@repo/codegen/query/standards'

import {
  CloneControlInput,
  CreateControlsByCloneMutation,
  GetAllStandardsQuery,
  GetAllStandardsQueryVariables,
  GetStandardDetailsQuery,
  Standard,
  CreateStandardMutation,
  CreateStandardMutationVariables,
  UpdateStandardMutation,
  UpdateStandardMutationVariables,
  DeleteStandardMutation,
  DeleteStandardMutationVariables,
  GetStandardsTableQuery,
} from '@repo/codegen/src/schema'
import { useMemo } from 'react'

export const useGetStandards = ({ where, enabled = true }: { where?: GetAllStandardsQueryVariables['where']; enabled?: boolean }) => {
  const { client } = useGraphQLClient()

  return useQuery<GetAllStandardsQuery>({
    queryKey: ['standards', where],
    queryFn: () => client.request(GET_ALL_STANDARDS, { where }),
    enabled,
  })
}

export const useGetStandardDetails = (standardId: string | null) => {
  const { client } = useGraphQLClient()

  return useQuery<GetStandardDetailsQuery>({
    queryKey: ['standard', standardId],
    queryFn: () => client.request(GET_STANDARD_DETAILS, { standardId }),
    enabled: !!standardId,
  })
}

export const useCloneControls = () => {
  const { client } = useGraphQLClient()

  return useMutation<CreateControlsByCloneMutation, Error, { input: CloneControlInput }>({
    mutationFn: ({ input }) => client.request(CREATE_CONTROLS_BY_CLONE, { input }),
  })
}

export const useStandardsSelect = ({ where, enabled = true }: { where?: GetAllStandardsQueryVariables['where']; enabled?: boolean }) => {
  const { client } = useGraphQLClient()

  const res = useQuery<GetAllStandardsQuery>({
    queryKey: ['standards', where, 'select'],
    queryFn: () => client.request(GET_ALL_STANDARDS_SELECT, { where }),
    enabled,
  })

  const standardOptions = useMemo(() => {
    const frameworks = res.data?.standards?.edges?.map((edge) => edge?.node as Standard).filter(Boolean) ?? []

    const sorted = frameworks.sort((a, b) => (a.shortName || '').localeCompare(b.shortName || ''))

    return sorted.map((framework) => ({
      label: framework.shortName || '',
      value: framework.id || '',
    }))
  }, [res.data])

  return {
    standardOptions,
    ...res,
  }
}

export const useCreateStandard = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<CreateStandardMutation, Error, CreateStandardMutationVariables>({
    mutationFn: async (variables) => client.request<CreateStandardMutation, CreateStandardMutationVariables>(CREATE_STANDARD, variables),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['standards'] })
    },
  })
}

export const useUpdateStandard = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<UpdateStandardMutation, Error, UpdateStandardMutationVariables>({
    mutationFn: async (variables) => client.request<UpdateStandardMutation, UpdateStandardMutationVariables>(UPDATE_STANDARD, variables),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['standards'] })
    },
  })
}

export const useDeleteStandard = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<DeleteStandardMutation, Error, DeleteStandardMutationVariables>({
    mutationFn: async (variables) => client.request<DeleteStandardMutation, DeleteStandardMutationVariables>(DELETE_STANDARD, variables),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['standards'] })
    },
  })
}

export const useGetAllStandardsTable = () => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<GetStandardsTableQuery>({
    queryKey: ['standards', 'table'],
    queryFn: async () => client.request<GetStandardsTableQuery>(GET_STANDARDS_TABLE),
  })

  const edges = queryResult.data?.standards.edges ?? []
  const standards = edges.map((e) => e?.node).filter(Boolean)

  return { ...queryResult, standards }
}
