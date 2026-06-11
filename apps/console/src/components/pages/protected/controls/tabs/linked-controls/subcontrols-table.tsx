'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@radix-ui/react-collapsible'
import { useParams } from 'next/navigation'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { AccessEnum } from '@repo/codegen/src/permissions.generated'
import { hasPermission, canEdit } from '@/lib/authz/utils'
import { CreateButton } from '@/components/shared/create-button/create-button'
import { useAccountRoles, useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { DataTable } from '@repo/ui/data-table'
import type { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { SearchFilterBar } from '@/components/shared/crud-base/tabs/shared'
import type { FilterField, WhereCondition } from '@/types'
import { useDebounce } from '@uidotdev/usehooks'
import { whereGenerator } from '@/components/shared/table-filter/where-generator'
import { getSubcontrolsColumns, getSubcontrolsFilterFields, type SubcontrolRow } from './subcontrols-table-config'
import { useGetSubcontrolsPaginated } from '@/lib/graphql-hooks/subcontrol'
import { SubcontrolControlSource, type SubcontrolWhereInput } from '@repo/codegen/src/schema'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enum'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { objectToSnakeCase } from '@/utils/strings'
import { BulkEditSubcontrolsDialog } from '@/components/pages/protected/controls/bulk-edit/bulk-edit-controls'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'

const SubcontrolsTable: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { convertToReadOnly } = usePlateEditor()
  const { data: orgPermission } = useOrganizationRoles()
  const { data: permission } = useAccountRoles(ObjectTypes.CONTROL, id)
  const [isOpen, setIsOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [filters, setFilters] = useState<WhereCondition>({})
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)
  const [filterFields, setFilterFields] = useState<FilterField[] | null>(null)
  const [selectedSubcontrols, setSelectedSubcontrols] = useState<{ id: string; refCode: string }[]>([])
  const { enumOptions } = useGetCustomTypeEnums({
    where: {
      objectType: objectToSnakeCase(ObjectTypes.CONTROL),
      field: 'kind',
    },
  })

  const filterWhere = useMemo(() => {
    return whereGenerator<SubcontrolWhereInput>(filters as SubcontrolWhereInput, (key, value) => {
      return { [key]: value } as SubcontrolWhereInput
    })
  }, [filters])

  const where = useMemo<SubcontrolWhereInput>(() => {
    const searchText = debouncedSearch.trim()
    return {
      ...filterWhere,
      ...(id ? { controlID: id } : {}),
      ...(searchText ? { or: [{ refCodeContainsFold: searchText }, { descriptionContainsFold: searchText }] } : {}),
    }
  }, [id, filterWhere, debouncedSearch])

  const { subcontrols, paginationMeta, isLoading } = useGetSubcontrolsPaginated({
    where,
    pagination,
    enabled: Boolean(id),
  })

  const cleanedSubcontrols = useMemo<SubcontrolRow[]>(
    () =>
      subcontrols
        .filter((node): node is typeof node & { id: string; refCode: string } => !!node?.id && typeof node.refCode === 'string')
        .map((node) => ({
          id: node.id,
          refCode: node.refCode,
          description: node.description,
          status: node.status,
          type: node.subcontrolKindName,
          source: node.source,
          category: node.category,
          subcategory: node.subcategory,
        })),
    [subcontrols],
  )

  const typeOptions = useMemo(() => enumOptions.map((option) => option.value).sort(), [enumOptions])
  const sourceOptions = useMemo(() => Object.values(SubcontrolControlSource).sort(), [])

  useEffect(() => {
    const fields = getSubcontrolsFilterFields(typeOptions, sourceOptions)
    setFilterFields((prev) => {
      const isSame = prev && JSON.stringify(prev) === JSON.stringify(fields)
      return isSame ? prev : fields
    })
  }, [sourceOptions, typeOptions])

  const handleFilterChange = useCallback((nextFilters: WhereCondition) => {
    setFilters(nextFilters)
  }, [])

  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      page: 1,
      query: { first: prev.pageSize },
    }))
  }, [searchQuery, filters])

  const canBulkEditSubcontrols = canEdit(permission?.roles)

  const columns = useMemo(
    () =>
      getSubcontrolsColumns({
        controlId: id,
        convertToReadOnly,
        selectedSubcontrols,
        setSelectedSubcontrols,
        canSelect: canBulkEditSubcontrols,
      }),
    [canBulkEditSubcontrols, convertToReadOnly, id, selectedSubcontrols],
  )

  const hasBulkSelection = canBulkEditSubcontrols && selectedSubcontrols.length > 0
  const bulkActionButtons = hasBulkSelection ? (
    <div className="flex items-center gap-2">
      <BulkEditSubcontrolsDialog selectedSubcontrols={selectedSubcontrols} setSelectedSubcontrols={setSelectedSubcontrols} />
      <CancelButton onClick={() => setSelectedSubcontrols([])} />
    </div>
  ) : null

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-8 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <CollapsibleTrigger className="flex items-center gap-2 group">
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
            <h2 className="text-lg font-semibold">Subcontrols</h2>
          </CollapsibleTrigger>
          {(hasPermission(orgPermission?.roles, AccessEnum.CanCreateSubcontrol) || canEdit(permission?.roles)) && <CreateButton type="subcontrol" href={`/controls/${id}/create-subcontrol`} />}
        </div>
      </div>

      <CollapsibleContent forceMount hidden={!isOpen} className="space-y-4">
        <SearchFilterBar
          placeholder="Search subcontrols"
          isSearching={searchQuery !== debouncedSearch}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          filterFields={hasBulkSelection ? null : filterFields}
          onFilterChange={handleFilterChange}
          actionButtons={bulkActionButtons}
        />

        <DataTable
          columns={columns}
          data={cleanedSubcontrols}
          loading={isLoading}
          pagination={pagination}
          onPaginationChange={setPagination}
          paginationMeta={paginationMeta}
          noResultsText="No subcontrols found."
          tableKey={undefined}
        />
      </CollapsibleContent>
    </Collapsible>
  )
}

export default SubcontrolsTable
