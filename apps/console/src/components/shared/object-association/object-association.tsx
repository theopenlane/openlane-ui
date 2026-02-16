'use client'

import { useEffect, useState } from 'react'
import { Label } from '@repo/ui/label'
import { Input } from '@repo/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@repo/ui/select'
import { extractTableRows, generateWhere, getPagination, OBJECT_QUERY_CONFIG, ObjectTypeObjects, QueryResponse, TableRow } from '@/components/shared/object-association/object-association-config'
import { useQuery } from '@tanstack/react-query'
import ObjectAssociationTable from '@/components/shared/object-association/object-association-table'
import ObjectAssociationPlaceholder from '@/components/shared/object-association/object-association-placeholder'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { TObjectAssociationMap } from './types/TObjectAssociationMap'
import { useDebounce } from '@uidotdev/usehooks'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useSession } from 'next-auth/react'
import { getInitialPagination } from '@repo/ui/data-table'
import { TableKeyEnum } from '@repo/ui/table-key'

const initialPagination = { ...DEFAULT_PAGINATION, pageSize: 5, query: { first: 5 } }

type Props = {
  onIdChange: (updatedMap: TObjectAssociationMap, refCodes: Partial<Record<string, string[]>>) => void
  excludeObjectTypes?: ObjectTypeObjects[]
  allowedObjectTypes?: ObjectTypeObjects[]
  initialData?: TObjectAssociationMap
  refCodeInitialData?: TObjectAssociationMap
  defaultSelectedObject?: ObjectTypeObjects
}

const ObjectAssociation = ({ onIdChange, excludeObjectTypes, allowedObjectTypes, initialData, refCodeInitialData, defaultSelectedObject }: Props) => {
  const { client } = useGraphQLClient()
  const [selectedObject, setSelectedObject] = useState<ObjectTypeObjects | null>(defaultSelectedObject || null)
  const [searchValue, setSearchValue] = useState('')
  const [pagination, setPagination] = useState<TPagination>(getInitialPagination(TableKeyEnum.OBJECT_ASSOCIATION, initialPagination))
  const debouncedSearchValue = useDebounce(searchValue, 300)

  const selectedConfig = selectedObject ? OBJECT_QUERY_CONFIG[selectedObject] : null
  const selectedQuery = selectedConfig?.queryDocument || ''
  const objectKey = selectedConfig?.responseObjectKey
  const inputName = selectedConfig?.inputName
  const inputPlaceholder = selectedConfig?.placeholder
  const { data: sessionData } = useSession()
  const currentOrg = sessionData?.user.activeOrganizationId

  const whereFilter = generateWhere(selectedObject, debouncedSearchValue, currentOrg)

  const { data, isLoading, isFetching } = useQuery<QueryResponse>({
    queryKey: [objectKey, 'objectAssociation', whereFilter, pagination.page, pagination.pageSize],
    queryFn: async () => client.request(selectedQuery, { where: whereFilter, ...pagination?.query }),
    enabled: !!selectedQuery,
  })

  const pageInfo = objectKey && !isLoading && !isFetching ? getPagination(objectKey, data).pageInfo : undefined
  const totalCount = objectKey && !isLoading && !isFetching ? getPagination(objectKey, data).totalCount : undefined

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setSearchValue(value)
  }

  const [tableData, setTableData] = useState<TableRow[]>([])

  useEffect(() => {
    const rows = extractTableRows(objectKey, data, inputName)
    setTableData(rows)
  }, [data, objectKey, inputName])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 items-center">
        <div className="flex flex-col gap-2">
          <Label>Object Type</Label>
          <Select
            onValueChange={(val: ObjectTypeObjects) => {
              setSelectedObject(val)
              setPagination(initialPagination)
              setSearchValue('')
            }}
          >
            <SelectTrigger className="w-full">{selectedObject || 'Select object'}</SelectTrigger>
            <SelectContent>
              {Object.values(ObjectTypeObjects)
                .filter((option) => !allowedObjectTypes || allowedObjectTypes.includes(option))
                .filter((option) => !excludeObjectTypes?.includes(option))
                .map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Search</Label>
          <Input disabled={!selectedQuery} onChange={handleSearchChange} value={searchValue} placeholder={inputPlaceholder ? `${inputPlaceholder}` : 'Select object first'} className="h-10 w-full" />
        </div>
      </div>
      {selectedObject ? (
        <ObjectAssociationTable
          isLoading={isLoading}
          onPaginationChange={setPagination}
          pagination={pagination}
          paginationMeta={{ totalCount, pageInfo, isLoading }}
          data={tableData}
          onIDsChange={onIdChange}
          initialData={initialData}
          refCodeInitialData={refCodeInitialData}
        />
      ) : (
        <div className="flex items-center justify-center w-full">
          <ObjectAssociationPlaceholder />
        </div>
      )}
    </div>
  )
}

export default ObjectAssociation
