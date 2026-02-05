'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { DataTable } from '@repo/ui/data-table'
import { useDebounce } from '@uidotdev/usehooks'
import { ObjectTypeObjects } from '@/components/shared/objectAssociation/object-assoiation-config'
import { useParams } from 'next/navigation'
import { TFormEvidenceData } from '@/components/pages/protected/evidence/types/TFormEvidenceData.ts'
import { useSmartRouter } from '@/hooks/useSmartRouter'
import EvidenceCreateSheet from '@/components/pages/protected/evidence/evidence-create-sheet'
import { CustomEvidenceControl } from '@/components/pages/protected/evidence/evidence-sheet-config'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useGetEvidenceListLight } from '@/lib/graphql-hooks/evidence'
import { whereGenerator } from '@/components/shared/table-filter/where-generator'
import { SearchFilterBar, mergeWhere } from '@/components/pages/protected/controls/tabs/shared/documentation-shared'
import { EvidenceOrder, EvidenceOrderField, EvidenceWhereInput, OrderDirection } from '@repo/codegen/src/schema'
import type { FilterField, WhereCondition } from '@/types'
import type { TPagination } from '@repo/ui/pagination-types'
import { getEvidenceColumns, getEvidenceFilterFields, type EvidenceRow } from './evidence-table-config'

type Props = {
  control: TFormEvidenceData
  subcontrolIds?: string[]
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

  const filterFields = useMemo<FilterField[]>(() => getEvidenceFilterFields(), [])

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

  const columns = useMemo(() => getEvidenceColumns(evidenceSheetHandler), [evidenceSheetHandler])

  const rows = useMemo<EvidenceRow[]>(
    () =>
      evidences.map((evidence) => ({
        id: evidence.id,
        name: evidence.name ?? 'Untitled',
        status: evidence.status,
        source: evidence.source,
        updatedAt: evidence.updatedAt,
        updatedBy: evidence.updatedBy,
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
