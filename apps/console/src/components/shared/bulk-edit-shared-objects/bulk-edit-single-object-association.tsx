'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Input } from '@repo/ui/input'
import {
  extractTableRows,
  generateWhere,
  getPagination,
  OBJECT_QUERY_CONFIG,
  type ObjectTypeObjects,
  type QueryResponse,
  type TableRow,
} from '@/components/shared/object-association/object-association-config'
import { useQuery } from '@tanstack/react-query'
import ObjectAssociationTable from '@/components/shared/object-association/object-association-table'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { type TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap'
import { useDebounce } from '@uidotdev/usehooks'
import { type TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useSession } from 'next-auth/react'

const initialPagination = { ...DEFAULT_PAGINATION, pageSize: 5, query: { first: 5 } }

type Props = {
  objectType: ObjectTypeObjects
  onChange: (map: Record<string, string[]>) => void
}

export const BulkEditSingleObjectAssociation: React.FC<Props> = ({ objectType, onChange }) => {
  const { client } = useGraphQLClient()
  const [searchValue, setSearchValue] = useState('')
  const [pagination, setPagination] = useState<TPagination>(initialPagination)
  const debouncedSearchValue = useDebounce(searchValue, 300)

  const config = OBJECT_QUERY_CONFIG[objectType]
  const { data: sessionData } = useSession()
  const currentOrg = sessionData?.user.activeOrganizationId

  const whereFilter = generateWhere(objectType, debouncedSearchValue, currentOrg)

  const { data, isLoading, isFetching } = useQuery<QueryResponse>({
    queryKey: [config.responseObjectKey, 'bulkEditAssociation', whereFilter, config.defaultOrderBy, pagination.page, pagination.pageSize],
    queryFn: async () => client.request(config.queryDocument, { where: whereFilter, orderBy: config.defaultOrderBy, ...pagination?.query }),
  })

  const pageInfo = !isLoading && !isFetching ? getPagination(config.responseObjectKey, data).pageInfo : undefined
  const totalCount = !isLoading && !isFetching ? getPagination(config.responseObjectKey, data).totalCount : undefined

  const tableData = useMemo<TableRow[]>(() => extractTableRows(config.responseObjectKey, data, config.inputName), [data, config.responseObjectKey, config.inputName])

  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  const stableOnIdChange = useCallback((updatedMap: TObjectAssociationMap) => {
    onChangeRef.current(updatedMap as Record<string, string[]>)
  }, [])

  return (
    <div className="space-y-2">
      <Input onChange={(e) => setSearchValue(e.target.value)} value={searchValue} placeholder={config.placeholder} className="h-10 w-full" />
      <ObjectAssociationTable
        isLoading={isLoading}
        onPaginationChange={setPagination}
        pagination={pagination}
        paginationMeta={{ totalCount, pageInfo, isLoading }}
        data={tableData}
        onIDsChange={stableOnIdChange}
      />
    </div>
  )
}
