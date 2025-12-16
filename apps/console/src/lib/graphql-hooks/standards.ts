import { useMutation, useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'

import { CREATE_CONTROLS_BY_CLONE, GET_ALL_STANDARDS, GET_ALL_STANDARDS_SELECT, GET_STANDARD_CONTROL_STATS, GET_STANDARD_DETAILS } from '@repo/codegen/query/standards'

import {
  CloneControlInput,
  CreateControlsByCloneMutation,
  GetAllStandardsQuery,
  GetAllStandardsQueryVariables,
  GetStandardControlStatsQuery,
  GetStandardDetailsQuery,
  Standard,
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

export const useGetStandardControlStats = (standardId: string | null, isStandardSystemOwned: boolean) => {
  const { client } = useGraphQLClient()

  return useQuery<GetStandardControlStatsQuery, unknown>({
    queryKey: ['standards', 'stats', standardId],
    queryFn: async () => client.request(GET_STANDARD_CONTROL_STATS, { standardId, isStandardSystemOwned }),
    enabled: !!standardId,
  })
}
