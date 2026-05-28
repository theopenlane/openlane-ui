'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { DataTable } from '@repo/ui/data-table'
import { useDebounce } from '@uidotdev/usehooks'
import { ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import { useParams } from 'next/navigation'
import { type TFormEvidenceData } from '@/components/pages/protected/evidence/types/TFormEvidenceData.ts'
import { useSmartRouter } from '@/hooks/useSmartRouter'
import EvidenceCreateSheet from '@/components/pages/protected/evidence/evidence-create-sheet'
import { type CustomEvidenceControl } from '@/components/pages/protected/evidence/evidence-sheet-config'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useGetEvidenceListLight } from '@/lib/graphql-hooks/evidence'
import { whereGenerator } from '@/components/shared/table-filter/where-generator'
import { SearchFilterBar, mergeWhere } from '@/components/shared/crud-base/tabs/shared'
import { type EvidenceOrder, EvidenceOrderField, type EvidenceWhereInput, OrderDirection } from '@repo/codegen/src/schema'
import type { ApiToken, User } from '@repo/codegen/src/schema'
import type { FilterField, WhereCondition } from '@/types'
import type { TPagination } from '@repo/ui/pagination-types'
import { getEvidenceColumns, getEvidenceFilterFields, type EvidenceRow } from './evidence-table-config'
import { useGetOrgUserList } from '@/lib/graphql-hooks/member'
import { useGetApiTokensByIds } from '@/lib/graphql-hooks/tokens'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import type { EntityRef } from '@/lib/graphql-hooks/use-mapped-entity-refs'

type Props = {
  control: TFormEvidenceData
  subcontrolIds?: string[]
  mappedControlRefs?: EntityRef[]
  mappedSubcontrolRefs?: EntityRef[]
}

const buildAssociationFilter = (controlId?: string, subcontrolIds?: string[], mappedControlRefs: EntityRef[] = [], mappedSubcontrolRefs: EntityRef[] = []) => {
  const conditions: object[] = []

  if (controlId) conditions.push({ hasControlsWith: [{ id: controlId }] })
  if (subcontrolIds && subcontrolIds.length > 0) conditions.push({ hasSubcontrolsWith: [{ idIn: subcontrolIds }] })

  const mappedControlIds = mappedControlRefs.map((r) => r.id)
  const mappedSubcontrolIds = mappedSubcontrolRefs.map((r) => r.id)

  if (mappedControlIds.length > 0) conditions.push({ hasControlsWith: [{ idIn: mappedControlIds }] })
  if (mappedSubcontrolIds.length > 0) conditions.push({ hasSubcontrolsWith: [{ idIn: mappedSubcontrolIds }] })

  if (conditions.length === 0) return {}
  if (conditions.length === 1) return conditions[0]
  return { or: conditions }
}

const EvidenceTable = ({ control, subcontrolIds, mappedControlRefs = [], mappedSubcontrolRefs = [] }: Props) => {
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
    return buildAssociationFilter(control.controlID, subcontrolIds, mappedControlRefs, mappedSubcontrolRefs)
  }, [control.controlID, control.subcontrolID, subcontrolIds, mappedControlRefs, mappedSubcontrolRefs])

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

  const subcontrolIdSet = useMemo(() => new Set(subcontrolIds ?? []), [subcontrolIds])
  const mappedControlIdToRef = useMemo(() => new Map(mappedControlRefs.map((r) => [r.id, r])), [mappedControlRefs])
  const mappedSubcontrolIdToRef = useMemo(() => new Map(mappedSubcontrolRefs.map((r) => [r.id, r])), [mappedSubcontrolRefs])

  const inheritedFromMap = useMemo(() => {
    if (control.subcontrolID) return new Map<string, { refCode: string; href: string }[]>()

    const map = new Map<string, { refCode: string; href: string }[]>()
    for (const evidence of evidences) {
      const directlyLinked = evidence.controls?.edges?.some((e) => e?.node?.id === control.controlID) ?? false
      if (directlyLinked) continue

      const sources: { refCode: string; href: string }[] = []

      for (const edge of evidence.subcontrols?.edges ?? []) {
        const node = edge?.node
        if (!node?.id || !node?.refCode) continue
        if (subcontrolIdSet.has(node.id)) {
          sources.push({ refCode: node.refCode, href: `/controls/${control.controlID}/${node.id}` })
        } else {
          const ref = mappedSubcontrolIdToRef.get(node.id)
          if (ref) sources.push(ref)
        }
      }

      for (const edge of evidence.controls?.edges ?? []) {
        const node = edge?.node
        if (!node?.id) continue
        const ref = mappedControlIdToRef.get(node.id)
        if (ref) sources.push(ref)
      }

      if (sources.length > 0) map.set(evidence.id, sources)
    }
    return map
  }, [evidences, control.controlID, control.subcontrolID, subcontrolIdSet, mappedControlIdToRef, mappedSubcontrolIdToRef])

  const memberIds = useMemo(() => [...new Set(evidences.map((e) => e.updatedBy).filter((id): id is string => typeof id === 'string' && id.length > 0))], [evidences])

  const userListWhere = useMemo(() => (memberIds.length > 0 ? { hasUserWith: [{ idIn: memberIds }] } : undefined), [memberIds])
  const tokensWhere = useMemo(() => (memberIds.length > 0 ? { idIn: memberIds } : undefined), [memberIds])

  const { users } = useGetOrgUserList({ where: userListWhere })
  const { tokens } = useGetApiTokensByIds({ where: tokensWhere })

  const userMap = useMemo(() => {
    const map: Record<string, User> = {}
    users?.forEach((user) => {
      map[user.id] = user
    })
    return map
  }, [users])

  const tokenMap = useMemo(() => {
    const map: Record<string, ApiToken> = {}
    tokens?.forEach((token) => {
      map[token.id] = token
    })
    return map
  }, [tokens])

  const evidenceSheetHandler = useCallback(
    (controlEvidenceID: string) => {
      if (controlEvidenceID) router.replace({ controlEvidenceId: controlEvidenceID })
    },
    [router],
  )

  const controlParam: CustomEvidenceControl = {
    id: control.controlID || (control.subcontrolID as string),
    referenceFramework: control.subcontrolReferenceFramework
      ? (Object.values(control.subcontrolReferenceFramework)[0] ?? '')
      : control.referenceFramework
        ? (Object.values(control.referenceFramework)[0] ?? '')
        : '',

    refCode: control.controlRefCodes?.[0] ?? '',
    __typename: isSubcontrol ? ObjectTypes.SUBCONTROL : ObjectTypes.CONTROL,
  }

  const columns = useMemo(() => getEvidenceColumns(evidenceSheetHandler, userMap, tokenMap, inheritedFromMap), [evidenceSheetHandler, userMap, tokenMap, inheritedFromMap])

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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <EvidenceCreateSheet
            open={isSheetOpen}
            onEvidenceCreateSuccess={() => setIsSheetOpen(false)}
            onOpenChange={setIsSheetOpen}
            formData={control}
            controlParam={[controlParam]}
            allowedObjectTypes={[ObjectTypeObjects.CONTROL_IMPLEMENTATION, ObjectTypeObjects.CONTROL_OBJECTIVE, ObjectTypeObjects.SCAN, ObjectTypeObjects.TASK]}
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
