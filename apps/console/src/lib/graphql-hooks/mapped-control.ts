import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  type CreateMappedControlMutation,
  type CreateMappedControlMutationVariables,
  type DeleteMappedControlMutation,
  type DeleteMappedControlMutationVariables,
  type GetMappedControlByIdQuery,
  type GetAllMappedControlsQuery,
  type GetAllMappedControlsQueryVariables,
  type UpdateMappedControlMutation,
  type UpdateMappedControlMutationVariables,
  type MappedControlWhereInput,
  EvidenceEvidenceStatus,
  MappedControlMappingSource,
} from '@repo/codegen/src/schema'
import { useMutation, useQuery, useInfiniteQuery, type InfiniteData } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import { CREATE_MAPPED_CONTROL, DELETE_MAPPED_CONTROL, GET_MAPPED_CONTROL_BY_ID, GET_ALL_MAPPED_CONTROLS, UPDATE_MAPPED_CONTROL } from '@repo/codegen/query/mapped-control'

type BuildLinkedControlsWhereArgs = {
  controlId?: string
  subcontrolId?: string
  refCode: string
  sourceFramework?: string | null
}

export const buildLinkedControlsWhere = ({ controlId, subcontrolId, refCode, sourceFramework }: BuildLinkedControlsWhereArgs): MappedControlWhereInput | undefined => {
  const isSubcontrolMode = !!subcontrolId
  const withFilter = sourceFramework ? { refCode, referenceFramework: sourceFramework } : { refCode, referenceFrameworkIsNil: true as const }
  const suggestedWhere = {
    and: [{ source: MappedControlMappingSource.SUGGESTED }, isSubcontrolMode ? { hasFromSubcontrolsWith: [withFilter] } : { hasFromControlsWith: [withFilter] }],
  }

  if (isSubcontrolMode && subcontrolId) {
    return { or: [suggestedWhere, { hasFromSubcontrolsWith: [{ id: subcontrolId }] }] }
  }

  if (controlId) {
    return {
      or: [
        suggestedWhere,
        { hasFromControlsWith: [{ id: controlId }] },
        { hasToControlsWith: [{ id: controlId }] },
        { hasFromSubcontrolsWith: [{ controlID: controlId }] },
        { hasToSubcontrolsWith: [{ controlID: controlId }] },
      ],
    }
  }

  return undefined
}

export const useCreateMappedControl = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<CreateMappedControlMutation, unknown, CreateMappedControlMutationVariables>({
    mutationFn: (variables) => client.request(CREATE_MAPPED_CONTROL, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mappedControls'] })
      queryClient.invalidateQueries({
        predicate: (query) => (query.queryKey[0] === 'controls' || query.queryKey[0] === 'subcontrols') && query.queryKey[2] === 'relatedControls',
      })
    },
  })
}

export const useGetMappedControls = ({ where, enabled = true }: { where: GetAllMappedControlsQueryVariables['where']; enabled?: boolean }) => {
  const { client } = useGraphQLClient()

  return useQuery<GetAllMappedControlsQuery>({
    queryKey: ['mappedControls', where],
    queryFn: () => client.request(GET_ALL_MAPPED_CONTROLS, { where }),
    enabled,
  })
}

type FetchAllMappedControlsOptions = {
  where?: MappedControlWhereInput
  enabled?: boolean
  pageSize?: number
  maxPages?: number
}

export const useFetchAllMappedControls = ({ where, enabled = true, pageSize, maxPages }: FetchAllMappedControlsOptions) => {
  const { client } = useGraphQLClient()

  return useInfiniteQuery<
    GetAllMappedControlsQuery['mappedControls'],
    Error,
    InfiniteData<GetAllMappedControlsQuery['mappedControls']>,
    ['mappedControls', 'infinite', MappedControlWhereInput | undefined, number | undefined]
  >({
    queryKey: ['mappedControls', 'infinite', where, pageSize],
    queryFn: async ({ pageParam }) => {
      const { mappedControls } = await client.request<GetAllMappedControlsQuery, GetAllMappedControlsQueryVariables>(GET_ALL_MAPPED_CONTROLS, {
        where,
        first: pageSize,
        after: pageParam,
      })
      return mappedControls
    },
    initialPageParam: undefined,
    getNextPageParam: (last, allPages) => {
      if (maxPages !== undefined && allPages.length >= maxPages) return undefined
      return last.pageInfo.hasNextPage ? last.pageInfo.endCursor : undefined
    },
    enabled,
  })
}

export const useGetAllMappedControlsGrouped = ({ where, enabled = true, pageSize, maxPages }: FetchAllMappedControlsOptions) => {
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, isError, error } = useFetchAllMappedControls({ where, enabled, pageSize, maxPages })

  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const mappedControlEdges = useMemo(() => data?.pages.flatMap((page) => page.edges ?? []) ?? [], [data?.pages])

  const pagesLoaded = data?.pages.length ?? 0
  const isTruncated = maxPages !== undefined && pagesLoaded >= maxPages && (data?.pages[pagesLoaded - 1]?.pageInfo.hasNextPage ?? false)

  return {
    mappedControlEdges,
    isLoading: isLoading || isFetchingNextPage || hasNextPage,
    isError,
    error,
    isTruncated,
  }
}

export const useGetMappedControlById = ({ mappedControlId, enabled }: { mappedControlId?: string; enabled: boolean }) => {
  const { client } = useGraphQLClient()

  return useQuery<GetMappedControlByIdQuery, unknown>({
    queryKey: ['mappedControls', mappedControlId],
    queryFn: () => client.request(GET_MAPPED_CONTROL_BY_ID, { mappedControlId }),
    enabled,
  })
}

export const useUpdateMappedControl = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<UpdateMappedControlMutation, unknown, UpdateMappedControlMutationVariables>({
    mutationFn: (variables) => client.request(UPDATE_MAPPED_CONTROL, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mappedControls'] })
      queryClient.invalidateQueries({
        predicate: (query) => (query.queryKey[0] === 'controls' || query.queryKey[0] === 'subcontrols') && query.queryKey[2] === 'relatedControls',
      })
    },
  })
}

export const useDeleteMappedControl = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<DeleteMappedControlMutation, unknown, DeleteMappedControlMutationVariables>({
    mutationFn: (variables) => client.request(DELETE_MAPPED_CONTROL, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mappedControls'] })
      queryClient.invalidateQueries({
        predicate: (query) => (query.queryKey[0] === 'controls' || query.queryKey[0] === 'subcontrols') && query.queryKey[2] === 'relatedControls',
      })
    },
  })
}

export const EVIDENCE_SEVERITY_ORDER: EvidenceEvidenceStatus[] = [
  EvidenceEvidenceStatus.REJECTED,
  EvidenceEvidenceStatus.MISSING_ARTIFACT,
  EvidenceEvidenceStatus.NEEDS_RENEWAL,
  EvidenceEvidenceStatus.REQUESTED,
  EvidenceEvidenceStatus.DRAFT,
  EvidenceEvidenceStatus.SUBMITTED,
  EvidenceEvidenceStatus.IN_REVIEW,
  EvidenceEvidenceStatus.READY_FOR_AUDITOR,
  EvidenceEvidenceStatus.AUDITOR_APPROVED,
]
