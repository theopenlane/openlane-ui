'use client'

import React, { useMemo, useState } from 'react'
import { useDebounce } from '@uidotdev/usehooks'
import { ViewProcedureSheet } from '@/components/pages/protected/procedures/view-procedure-sheet'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { whereGenerator } from '@/components/shared/table-filter/where-generator'
import { useProceduresFilters } from '@/components/pages/protected/procedures/table/table-config'
import { SetControlAssociationDialog } from '@/components/pages/protected/controls/set-control-association-dialog'
import { useDocumentationProcedures } from '@/lib/graphql-hooks/documentation'
import { ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import { OrderDirection, ProcedureDocumentStatus, ProcedureOrderField } from '@repo/codegen/src/schema'
import type { GetProceduresListQueryVariables, ProcedureWhereInput } from '@repo/codegen/src/schema'
import type { WhereCondition } from '@/types'
import type { TPagination } from '@repo/ui/pagination-types'
import { mergeWhere, SearchFilterBar, AssociationSection, type AssociationRow } from '@/components/shared/crud-base/tabs/shared'
import { buildAssociationFilter, type EntityRef } from '@/components/pages/protected/controls/tabs/shared/documentation-shared'
import { type ColumnDef } from '@tanstack/react-table'
import { DocumentStatusBadge, DocumentStatusTooltips } from '@/components/shared/enum-mapper/policy-enum'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { Button } from '@repo/ui/button'
import { Plus } from 'lucide-react'
import InheritedBadge from '@/components/shared/inherited-badge/inherited-badge'
import { formatTimeSince } from '@/utils/date'
import { AuthorCell } from '@/components/shared/user-display/author-cell'
import { useAuthorMaps } from '@/lib/graphql-hooks/authors'

type ProceduresTableProps = {
  controlId?: string
  subcontrolIds: string[]
  canEdit: boolean
  isSubcontrol?: boolean
  mappedControlRefs?: EntityRef[]
  mappedSubcontrolRefs?: EntityRef[]
}

const ProceduresTable: React.FC<ProceduresTableProps> = ({ controlId, subcontrolIds, canEdit, isSubcontrol = false, mappedControlRefs = [], mappedSubcontrolRefs = [] }) => {
  const [selectedProcedureId, setSelectedProcedureId] = useState<string | null>(null)
  const associationFilter = useMemo(
    () => buildAssociationFilter(controlId, subcontrolIds, isSubcontrol ? [] : mappedControlRefs, isSubcontrol ? [] : mappedSubcontrolRefs),
    [controlId, subcontrolIds, isSubcontrol, mappedControlRefs, mappedSubcontrolRefs],
  )

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [filters, setFilters] = useState<WhereCondition>({})
  const filterFields = useProceduresFilters()
  const filteredFields = useMemo(() => filterFields?.filter((field) => field.key !== 'hasControlsWith' && field.key !== 'hasSubcontrolsWith') ?? null, [filterFields])
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)

  const where = useMemo(() => {
    const base: ProcedureWhereInput = {
      nameContainsFold: debouncedSearch,
    }

    const result = whereGenerator<ProcedureWhereInput>(filters as ProcedureWhereInput, (key, value) => {
      if (key === 'hasControlsWith') {
        return { hasControlsWith: [{ refCodeContainsFold: value as string }] } as ProcedureWhereInput
      }
      if (key === 'hasProgramsWith') {
        return { hasProgramsWith: [{ idIn: value }] } as ProcedureWhereInput
      }
      if (key === 'hasSubcontrolsWith') {
        return { hasSubcontrolsWith: [{ refCodeContainsFold: value as string }] } as ProcedureWhereInput
      }
      return { [key]: value } as ProcedureWhereInput
    })

    const hasStatusCondition = (obj: ProcedureWhereInput): boolean => {
      if ('status' in obj || 'statusNEQ' in obj || 'statusIn' in obj || 'statusNotIn' in obj) return true
      if (Array.isArray(obj.and) && obj.and.some(hasStatusCondition)) return true
      if (Array.isArray(obj.or) && obj.or.some(hasStatusCondition)) return true
      return false
    }

    if (!hasStatusCondition(result)) {
      result.statusNotIn = [ProcedureDocumentStatus.ARCHIVED]
    }

    return mergeWhere<ProcedureWhereInput>([associationFilter as ProcedureWhereInput, base, result])
  }, [filters, debouncedSearch, associationFilter])

  const orderBy = useMemo<GetProceduresListQueryVariables['orderBy']>(() => [{ field: ProcedureOrderField.updated_at, direction: OrderDirection.DESC }], [])

  const { procedures, paginationMeta, isLoading } = useDocumentationProcedures({
    where,
    orderBy,
    pagination,
    enabled: true,
  })

  const subcontrolIdSet = useMemo(() => new Set(subcontrolIds), [subcontrolIds])
  const mappedControlIdToRef = useMemo(() => new Map(mappedControlRefs.map((r) => [r.id, r])), [mappedControlRefs])
  const mappedSubcontrolIdToRef = useMemo(() => new Map(mappedSubcontrolRefs.map((r) => [r.id, r])), [mappedSubcontrolRefs])

  const inheritedFromMap = useMemo(() => {
    if (!controlId || isSubcontrol) return new Map<string, { refCode: string; href: string }[]>()
    const map = new Map<string, { refCode: string; href: string }[]>()
    for (const procedure of procedures) {
      const directlyLinked = procedure.controls?.edges?.some((e) => e?.node?.id === controlId) ?? false
      if (directlyLinked) continue

      const sources: { refCode: string; href: string }[] = []

      for (const edge of procedure.subcontrols?.edges ?? []) {
        const node = edge?.node
        if (!node?.id || !node?.refCode) continue
        if (subcontrolIdSet.has(node.id)) {
          sources.push({ refCode: node.refCode, href: `/controls/${controlId}/${node.id}` })
        } else {
          const ref = mappedSubcontrolIdToRef.get(node.id)
          if (ref) sources.push(ref)
        }
      }

      for (const edge of procedure.controls?.edges ?? []) {
        const node = edge?.node
        if (!node?.id) continue
        const ref = mappedControlIdToRef.get(node.id)
        if (ref) sources.push(ref)
      }

      if (sources.length > 0) map.set(procedure.id, sources)
    }
    return map
  }, [procedures, controlId, isSubcontrol, subcontrolIdSet, mappedControlIdToRef, mappedSubcontrolIdToRef])

  const memberIds = useMemo(() => [...new Set(procedures.map((procedure) => procedure.updatedBy).filter((id): id is string => typeof id === 'string' && id.length > 0))], [procedures])

  const { userMap, tokenMap } = useAuthorMaps(memberIds)

  const columns = useMemo<ColumnDef<AssociationRow>[]>(
    () => [
      {
        accessorKey: 'name',
        header: () => <span className="whitespace-nowrap">Name</span>,
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <span className="text-blue-500 hover:underline whitespace-nowrap cursor-pointer" onClick={() => setSelectedProcedureId(row.original.id)}>
              {row.original.name}
            </span>
            {inheritedFromMap.has(row.original.id) && <InheritedBadge sources={inheritedFromMap.get(row.original.id) ?? []} />}
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: () => <span className="whitespace-nowrap">Status</span>,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {row.original.status && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DocumentStatusBadge status={row.original.status as ProcedureDocumentStatus} />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{DocumentStatusTooltips[row.original.status as ProcedureDocumentStatus]}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        ),
        size: 150,
        minSize: 150,
      },
      {
        accessorKey: 'approver',
        header: () => <span className="whitespace-nowrap">Approver</span>,
        cell: ({ row }) => <span className="truncate whitespace-nowrap">{row.original.approver?.displayName ?? '-'}</span>,
        size: 200,
        minSize: 200,
      },
      {
        accessorKey: 'updatedBy',
        header: () => <span className="whitespace-nowrap">Last Updated By</span>,
        cell: ({ row }) => <AuthorCell id={row.original.updatedBy} userMap={userMap} tokenMap={tokenMap} className="flex items-center gap-2 whitespace-nowrap" />,
        size: 200,
      },
      {
        accessorKey: 'updatedAt',
        header: () => <span className="whitespace-nowrap">Last Updated</span>,
        cell: ({ row }) => <span className="whitespace-nowrap">{formatTimeSince(row.original.updatedAt)}</span>,
        size: 140,
      },
    ],
    [userMap, tokenMap, inheritedFromMap],
  )

  const rows = useMemo(
    () =>
      procedures.map((procedure) => ({
        id: procedure.id,
        name: procedure.name,
        status: procedure.status ?? null,
        approver: procedure.approver ?? null,
        updatedBy: procedure.updatedBy ?? null,
        updatedAt: procedure.updatedAt,
        href: `/procedures/${procedure.id}/view`,
      })),
    [procedures],
  )

  return (
    <>
      <AssociationSection
        title="Procedures"
        rows={rows}
        columns={columns}
        loading={isLoading}
        pagination={pagination}
        onPaginationChange={setPagination}
        paginationMeta={paginationMeta}
        onRowClick={(row) => setSelectedProcedureId(row.id)}
        searchBar={
          <SearchFilterBar
            placeholder="Search procedures"
            isSearching={search !== debouncedSearch}
            searchValue={search}
            onSearchChange={setSearch}
            filterFields={filteredFields}
            onFilterChange={setFilters}
            actionButtons={
              canEdit ? (
                <SetControlAssociationDialog
                  defaultSelectedObject={ObjectTypeObjects.PROCEDURE}
                  allowedObjectTypes={[ObjectTypeObjects.PROCEDURE]}
                  trigger={
                    <Button type="button" icon={<Plus size={16} />} iconPosition="left" variant="secondary" size="md" className="size-fit py-1.5 px-2">
                      Add Procedure
                    </Button>
                  }
                />
              ) : undefined
            }
          />
        }
      />
      <ViewProcedureSheet procedureId={selectedProcedureId} onClose={() => setSelectedProcedureId(null)} />
    </>
  )
}

export default ProceduresTable
