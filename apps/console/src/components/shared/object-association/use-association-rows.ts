import { useCallback, useMemo, useState, type SetStateAction } from 'react'
import { useQuery, type Query } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { type TPagination } from '@repo/ui/pagination-types'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { extractTableRows, generateWhere, getPagination, OBJECT_QUERY_CONFIG, type ObjectTypeObjects, type QueryResponse, type TableRow } from './object-association-config'
import { useVirtualPagination } from './use-virtual-pagination'

type TUseAssociationRowsArgs = {
  objectType: ObjectTypeObjects | null
  search: string
  linkedIds: string[]
  pageSize: number
  filterWheres?: object[]
  hideLinked?: boolean
  extraVariables?: Record<string, unknown>
}

const buildInitialPagination = (pageSize: number, pinnedCount: number): TPagination => {
  const firstPageGap = pinnedCount < pageSize ? pageSize - pinnedCount : pageSize
  return { page: 1, pageSize, query: { first: firstPageGap } }
}

export const useAssociationRows = ({ objectType, search, linkedIds, pageSize, filterWheres = [], hideLinked = false, extraVariables }: TUseAssociationRowsArgs) => {
  const { client } = useGraphQLClient()
  const { data: session } = useSession()
  const currentOrg = session?.user.activeOrganizationId
  const config = objectType ? OBJECT_QUERY_CONFIG[objectType] : null
  const objectKey = config?.responseObjectKey
  const inputName = config?.inputName
  const orderBy = config?.defaultOrderBy

  const isUnfiltered = search === '' && filterWheres.length === 0
  const excludeLinked = linkedIds.length > 0 && (hideLinked || isUnfiltered)
  const pinnedActive = excludeLinked && !hideLinked
  const pinnedIdsKey = [...linkedIds].sort().join(',')

  const searchWhere = {
    ...generateWhere(objectType, search, currentOrg),
    ...(filterWheres.length > 0 ? { and: filterWheres } : {}),
  }
  const mainWhere = excludeLinked ? { ...searchWhere, idNotIn: linkedIds } : searchWhere

  const pinnedCount = pinnedActive ? linkedIds.length : 0
  const resetKey = JSON.stringify([objectType, mainWhere, pinnedCount])
  const [paginationState, setPaginationState] = useState(() => ({ resetKey, pagination: buildInitialPagination(pageSize, pinnedCount) }))
  const pagination = paginationState.resetKey === resetKey ? paginationState.pagination : buildInitialPagination(paginationState.pagination.pageSize, pinnedCount)

  const setPagination = useCallback(
    (update: SetStateAction<TPagination>) =>
      setPaginationState((previous) => {
        const current = previous.resetKey === resetKey ? previous.pagination : buildInitialPagination(previous.pagination.pageSize, pinnedCount)
        const next = typeof update === 'function' ? update(current) : update
        return previous.resetKey === resetKey && next === current ? previous : { resetKey, pagination: next }
      }),
    [resetKey, pinnedCount],
  )

  const keepSameTypeRows = (previous: QueryResponse | undefined, previousQuery: Pick<Query, 'queryKey'> | undefined) => (previousQuery?.queryKey[0] === objectKey ? previous : undefined)

  const {
    data,
    isPending: isMainPending,
    isPlaceholderData,
    isError: isMainError,
  } = useQuery<QueryResponse>({
    queryKey: [objectKey, 'objectAssociation', 'main', mainWhere, extraVariables, orderBy, pagination.query],
    queryFn: () => client.request(config?.queryDocument ?? '', { where: mainWhere, orderBy, ...extraVariables, ...pagination.query }),
    enabled: !!config,
    placeholderData: keepSameTypeRows,
  })

  const {
    data: pinnedData,
    isPending: isPinnedPending,
    isPlaceholderData: isPinnedPlaceholder,
    isError: isPinnedError,
  } = useQuery<QueryResponse>({
    queryKey: [objectKey, 'objectAssociation', 'pinned', extraVariables, orderBy, pinnedIdsKey, currentOrg],
    queryFn: () =>
      client.request(config?.queryDocument ?? '', {
        where: { ...generateWhere(objectType, '', currentOrg), idIn: linkedIds },
        orderBy,
        ...extraVariables,
        first: linkedIds.length,
      }),
    enabled: !!config && pinnedActive,
    placeholderData: keepSameTypeRows,
  })

  const isStale = isPlaceholderData || (pinnedActive && isPinnedPlaceholder)
  const isLoading = !!config && (isMainPending || (pinnedActive && isPinnedPending))
  const meta = objectKey ? getPagination(objectKey, data) : undefined

  const tableData = useMemo<TableRow[]>(() => extractTableRows(objectKey, data, inputName), [data, objectKey, inputName])
  const pinnedRows = useMemo<TableRow[]>(() => (pinnedActive ? extractTableRows(objectKey, pinnedData, inputName) : []), [pinnedActive, pinnedData, objectKey, inputName])

  const { pageData, totalPages, handlePageChange, handlePageSizeChange } = useVirtualPagination({
    pinnedActive,
    pinnedRows,
    tableData,
    pageInfo: meta?.pageInfo,
    totalCount: meta?.totalCount,
    pagination,
    setPagination,
  })

  return {
    rows: pageData,
    totalCount: meta?.totalCount === undefined ? undefined : meta.totalCount + pinnedRows.length,
    isLoading,
    isStale,
    isError: isMainError || (pinnedActive && isPinnedError),
    pagination,
    totalPages,
    handlePageChange: (page: number) => {
      if (!isLoading && !isStale) handlePageChange(page)
    },
    handlePageSizeChange,
  }
}
