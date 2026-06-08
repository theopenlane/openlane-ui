'use client'

import { useEffect, useMemo, useState } from 'react'
import ControlObjectiveDetailsSheet from '@/components/pages/protected/controls/tabs/implementation/control-objectives-components/control-objective-details-sheet'
import ControlImplementationDetailsSheet from '@/components/pages/protected/controls/tabs/implementation/control-implementation-components/control-implementation-details-sheet'
import { Label } from '@repo/ui/label'
import { Input } from '@repo/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@repo/ui/select'
import {
  extractTableRows,
  generateWhere,
  getPagination,
  OBJECT_QUERY_CONFIG,
  ObjectTypeObjects,
  type QueryResponse,
  type TableRow,
} from '@/components/shared/object-association/object-association-config'
import { useQuery } from '@tanstack/react-query'
import ObjectAssociationTable from '@/components/shared/object-association/object-association-table'
import ObjectAssociationPlaceholder from '@/components/shared/object-association/object-association-placeholder'
import { useVirtualPagination } from '@/components/shared/object-association/use-virtual-pagination'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { type TObjectAssociationMap } from './types/TObjectAssociationMap'
import { useDebounce } from '@uidotdev/usehooks'
import { type TPagination } from '@repo/ui/pagination-types'
import Pagination from '@repo/ui/pagination'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useSession } from 'next-auth/react'

const initialPagination = { ...DEFAULT_PAGINATION, pageSize: 5, query: { first: 5 } }

type Props = {
  onIdChange: (updatedMap: TObjectAssociationMap, refCodes: Partial<Record<string, string[]>>) => void
  allowedObjectTypes?: readonly ObjectTypeObjects[]
  initialData?: TObjectAssociationMap
  refCodeInitialData?: TObjectAssociationMap
  defaultSelectedObject?: ObjectTypeObjects
}

const ObjectAssociation = ({ onIdChange, allowedObjectTypes, initialData, refCodeInitialData, defaultSelectedObject }: Props) => {
  const { client } = useGraphQLClient()
  const [selectedObject, setSelectedObject] = useState<ObjectTypeObjects | null>(defaultSelectedObject || null)
  const [searchValue, setSearchValue] = useState('')
  const [pagination, setPagination] = useState<TPagination>(initialPagination)
  const debouncedSearchValue = useDebounce(searchValue, 300)
  const [activeSheet, setActiveSheet] = useState<{ id: string; type: ObjectTypeObjects } | null>(null)

  const selectedConfig = selectedObject ? OBJECT_QUERY_CONFIG[selectedObject] : null
  const selectedQuery = selectedConfig?.queryDocument || ''
  const objectKey = selectedConfig?.responseObjectKey
  const inputName = selectedConfig?.inputName
  const inputPlaceholder = selectedConfig?.placeholder
  const { data: sessionData } = useSession()
  const currentOrg = sessionData?.user.activeOrganizationId

  const pinnedIds = useMemo<string[]>(() => (inputName && initialData ? (initialData[inputName] ?? []) : []), [inputName, initialData])
  const pinnedActive = pinnedIds.length > 0 && debouncedSearchValue === ''
  const pinnedIdsKey = useMemo(() => [...pinnedIds].sort().join(','), [pinnedIds])

  const baseWhere = generateWhere(selectedObject, debouncedSearchValue, currentOrg)
  const mainWhere = pinnedActive ? { ...baseWhere, idNotIn: pinnedIds } : baseWhere
  const pinnedWhere = pinnedActive ? { ...generateWhere(selectedObject, '', currentOrg), idIn: pinnedIds } : null

  const { data, isLoading, isFetching } = useQuery<QueryResponse>({
    queryKey: [objectKey, 'objectAssociation', 'main', mainWhere, selectedConfig?.defaultOrderBy, pagination.page, pagination.pageSize, pinnedIdsKey],
    queryFn: async () => client.request(selectedQuery, { where: mainWhere, orderBy: selectedConfig?.defaultOrderBy, ...pagination?.query }),
    enabled: !!selectedQuery,
  })

  const { data: pinnedData, isLoading: isPinnedLoading } = useQuery<QueryResponse>({
    queryKey: [objectKey, 'objectAssociation', 'pinned', selectedConfig?.defaultOrderBy, pinnedIdsKey, currentOrg],
    queryFn: async () => client.request(selectedQuery, { where: pinnedWhere, orderBy: selectedConfig?.defaultOrderBy, first: pinnedIds.length }),
    enabled: !!selectedQuery && pinnedActive,
  })

  useEffect(() => {
    setPagination(initialPagination)
  }, [debouncedSearchValue, selectedObject])

  const mainMeta = objectKey && !isLoading && !isFetching ? getPagination(objectKey, data) : undefined

  const tableData = useMemo<TableRow[]>(() => extractTableRows(objectKey, data, inputName), [data, objectKey, inputName])
  const pinnedRows = useMemo<TableRow[]>(() => (pinnedActive ? extractTableRows(objectKey, pinnedData, inputName) : []), [pinnedActive, pinnedData, objectKey, inputName])

  const { pageData, totalPages, handlePageChange, handlePageSizeChange } = useVirtualPagination({
    pinnedActive,
    pinnedRows,
    tableData,
    pageInfo: mainMeta?.pageInfo,
    totalCount: mainMeta?.totalCount,
    pagination,
    setPagination,
  })

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(event.target.value)
  }

  const opensDetailsSheet = selectedObject === ObjectTypeObjects.CONTROL_OBJECTIVE || selectedObject === ObjectTypeObjects.CONTROL_IMPLEMENTATION
  const handleRowClick = opensDetailsSheet && selectedObject ? (id: string) => setActiveSheet({ id, type: selectedObject }) : undefined

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
        <>
          <ObjectAssociationTable
            isLoading={isLoading || isPinnedLoading}
            data={pageData}
            onIDsChange={onIdChange}
            initialData={initialData}
            refCodeInitialData={refCodeInitialData}
            onRowClick={handleRowClick}
          />
          <Pagination currentPage={pagination.page} totalPages={totalPages} pageSize={pagination.pageSize} onPageChange={handlePageChange} onPageSizeChange={handlePageSizeChange} />
        </>
      ) : (
        <div className="flex items-center justify-center w-full">
          <ObjectAssociationPlaceholder />
        </div>
      )}
      {activeSheet?.type === ObjectTypeObjects.CONTROL_OBJECTIVE && <ControlObjectiveDetailsSheet entityId={activeSheet.id} onClose={() => setActiveSheet(null)} />}
      {activeSheet?.type === ObjectTypeObjects.CONTROL_IMPLEMENTATION && <ControlImplementationDetailsSheet entityId={activeSheet.id} onClose={() => setActiveSheet(null)} />}
    </div>
  )
}

export default ObjectAssociation
