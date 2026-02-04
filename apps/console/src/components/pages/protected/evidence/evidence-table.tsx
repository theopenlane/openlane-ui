'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@repo/ui/data-table'
import { useDebounce } from '@uidotdev/usehooks'
import { ObjectTypeObjects } from '@/components/shared/objectAssociation/object-assoiation-config'
import { useParams } from 'next/navigation'
import { formatDateSince } from '@/utils/date'
import { TFormEvidenceData } from '@/components/pages/protected/evidence/types/TFormEvidenceData.ts'
import { useSmartRouter } from '@/hooks/useSmartRouter'
import EvidenceCreateSheet from './evidence-create-sheet'
import { CustomEvidenceControl } from './evidence-sheet-config'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useGetEvidenceListLight } from '@/lib/graphql-hooks/evidence'
import { whereGenerator } from '@/components/shared/table-filter/where-generator'
import { SearchFilterBar, mergeWhere } from '@/app/(protected)/controls/[id]/components/documentation-components/shared'
import { EvidenceOrder, EvidenceOrderField, EvidenceWhereInput, OrderDirection } from '@repo/codegen/src/schema'
import type { FilterField, WhereCondition } from '@/types'
import type { TPagination } from '@repo/ui/pagination-types'
import { EvidenceStatusOptions, FilterIcons } from '@/components/shared/enum-mapper/evidence-enum'

type Props = {
  control: TFormEvidenceData
  subcontrolIds?: string[]
}

type EvidenceRow = {
  id: string
  displayID: string
  name: string
  updatedAt?: string | null
}

const buildAssociationFilter = (controlId?: string, subcontrolIds?: string[]) => {
  if (controlId && subcontrolIds && subcontrolIds.length > 0) {
    return {
      or: [{ hasControlsWith: [{ id: controlId }] }, { hasSubcontrolsWith: [{ idIn: subcontrolIds }] }],
    }
  }

  if (controlId) {
    return { hasControlsWith: [{ id: controlId }] }
  }

  if (subcontrolIds && subcontrolIds.length > 0) {
    return { hasSubcontrolsWith: [{ idIn: subcontrolIds }] }
  }

  return {}
}

const EvidenceTable = ({ control, subcontrolIds }: Props) => {
  const { subcontrolId } = useParams()
  const isSubcontrol = !!subcontrolId
  const router = useSmartRouter()
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [filters, setFilters] = useState<WhereCondition>({})
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)
  const handleFilterChange = useCallback((nextFilters: WhereCondition) => {
    setFilters(nextFilters)
    setPagination(DEFAULT_PAGINATION)
  }, [])

  const controlAssociationFilter = useMemo(() => {
    if (control.subcontrolID) {
      return buildAssociationFilter(undefined, [control.subcontrolID])
    }
    return buildAssociationFilter(control.controlID, subcontrolIds)
  }, [control.controlID, control.subcontrolID, subcontrolIds])

  const filterFields = useMemo<FilterField[]>(
    () => [
      { key: 'nameContainsFold', label: 'Name', type: 'text', icon: FilterIcons.Name },
      { key: 'statusIn', label: 'Status', type: 'multiselect', options: EvidenceStatusOptions, icon: FilterIcons.Status },
      { key: 'creationDate', label: 'Created', type: 'dateRange', icon: FilterIcons.Date },
      { key: 'renewalDate', label: 'Renewed', type: 'dateRange', icon: FilterIcons.Date },
    ],
    [],
  )

  const where = useMemo(() => {
    const base: EvidenceWhereInput = debouncedSearch ? { nameContainsFold: debouncedSearch } : {}

    const result = whereGenerator<EvidenceWhereInput>(filters as EvidenceWhereInput, (key, value) => {
      return { [key]: value } as EvidenceWhereInput
    })

    return mergeWhere<EvidenceWhereInput>([controlAssociationFilter as EvidenceWhereInput, base, result])
  }, [filters, debouncedSearch, controlAssociationFilter])

  const orderBy = useMemo<EvidenceOrder[]>(() => [{ field: EvidenceOrderField.updated_at, direction: OrderDirection.DESC }], [])

  const { evidences, paginationMeta, isLoading } = useGetEvidenceListLight({
    where,
    orderBy,
    pagination,
    enabled: Boolean(control.controlID || control.subcontrolID),
  })

  const evidenceSheetHandler = useCallback(
    (controlEvidenceID: string) => {
      if (controlEvidenceID) router.replace({ controlEvidenceId: controlEvidenceID })
    },
    [router],
  )

  const controlParam: CustomEvidenceControl = {
    id: control.controlID || (control.subcontrolID as string),
    referenceFramework: control.subcontrolReferenceFramework
      ? Object.values(control.subcontrolReferenceFramework)[0] ?? ''
      : control.referenceFramework
      ? Object.values(control.referenceFramework)[0] ?? ''
      : '',

    refCode: control.controlRefCodes?.[0] ?? '',
    __typename: isSubcontrol ? 'Subcontrol' : 'Control',
  }

  const columns = useMemo<ColumnDef<EvidenceRow>[]>(
    () => [
      {
        accessorKey: 'displayID',
        header: 'ID',
        cell: ({ row }) => (
          <button type="button" className="text-blue-500 hover:underline" onClick={() => evidenceSheetHandler(row.original.id)}>
            {row.original.displayID}
          </button>
        ),
        size: 140,
      },
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => <span className="truncate">{row.original.name}</span>,
      },
      {
        accessorKey: 'updatedAt',
        header: 'Last Updated',
        cell: ({ row }) => <span className="whitespace-nowrap">{formatDateSince(row.original.updatedAt)}</span>,
        size: 140,
      },
    ],
    [evidenceSheetHandler],
  )

  const rows = useMemo<EvidenceRow[]>(
    () =>
      evidences.map((evidence) => ({
        id: evidence.id,
        displayID: evidence.displayID ?? evidence.id,
        name: evidence.name ?? 'Untitled',
        updatedAt: evidence.updatedAt,
      })),
    [evidences],
  )

  return (
    <div className="mt-6 space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <EvidenceCreateSheet
            open={isSheetOpen}
            onEvidenceCreateSuccess={() => setIsSheetOpen(false)}
            onOpenChange={setIsSheetOpen}
            formData={control}
            controlParam={[controlParam]}
            excludeObjectTypes={[
              ObjectTypeObjects.EVIDENCE,
              ObjectTypeObjects.RISK,
              ObjectTypeObjects.PROCEDURE,
              ObjectTypeObjects.GROUP,
              ObjectTypeObjects.INTERNAL_POLICY,
              ObjectTypeObjects.CONTROL,
              ObjectTypeObjects.SUB_CONTROL,
              ObjectTypeObjects.PROGRAM,
            ]}
            defaultSelectedObject={ObjectTypeObjects.TASK}
          />
        </div>
      </div>

      <SearchFilterBar
        placeholder="Search evidence"
        isSearching={search !== debouncedSearch}
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value)
          setPagination(DEFAULT_PAGINATION)
        }}
        filterFields={filterFields}
        onFilterChange={handleFilterChange}
      />

      <DataTable columns={columns} data={rows} loading={isLoading} pagination={pagination} onPaginationChange={setPagination} paginationMeta={paginationMeta} tableKey={undefined} />
    </div>
  )
}

export default EvidenceTable
