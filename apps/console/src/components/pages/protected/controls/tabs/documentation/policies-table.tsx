'use client'

import React, { useMemo, useState } from 'react'
import { useDebounce } from '@uidotdev/usehooks'
import { ViewPolicySheet } from '@/components/pages/protected/policies/view-policy-sheet'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { whereGenerator } from '@/components/shared/table-filter/where-generator'
import { usePoliciesFilters } from '@/components/pages/protected/policies/table/table-config'
import { SetControlAssociationDialog } from '@/components/pages/protected/controls/set-control-association-dialog'
import { useDocumentationPolicies } from '@/lib/graphql-hooks/documentation'
import { ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import { InternalPolicyDocumentStatus, InternalPolicyOrderField, OrderDirection } from '@repo/codegen/src/schema'
import type { GetInternalPoliciesListQueryVariables, InternalPolicyWhereInput } from '@repo/codegen/src/schema'
import type { WhereCondition } from '@/types'
import type { TPagination } from '@repo/ui/pagination-types'
import { mergeWhere, SearchFilterBar, AssociationSection, type AssociationRow } from '@/components/shared/crud-base/tabs/shared'
import { buildAssociationFilter, type EntityRef } from '@/components/pages/protected/controls/tabs/shared/documentation-shared'
import { type ColumnDef } from '@tanstack/react-table'
import { DocumentStatusBadge, DocumentStatusTooltips } from '@/components/shared/enum-mapper/policy-enum'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { Button } from '@repo/ui/button'
import { Avatar } from '@/components/shared/avatar/avatar'
import { KeyRound, Plus } from 'lucide-react'
import InheritedBadge from '@/components/shared/inherited-badge/inherited-badge'
import { formatTimeSince } from '@/utils/date'
import { useGetOrgUserList } from '@/lib/graphql-hooks/member'
import { useGetApiTokensByIds } from '@/lib/graphql-hooks/tokens'
import type { ApiToken, User } from '@repo/codegen/src/schema'

type PoliciesTableProps = {
  controlId?: string
  subcontrolIds: string[]
  canEdit: boolean
  isSubcontrol?: boolean
  mappedControlRefs?: EntityRef[]
  mappedSubcontrolRefs?: EntityRef[]
}

const PoliciesTable: React.FC<PoliciesTableProps> = ({ controlId, subcontrolIds, canEdit, isSubcontrol = false, mappedControlRefs = [], mappedSubcontrolRefs = [] }) => {
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null)
  const associationFilter = useMemo(
    () => buildAssociationFilter(controlId, subcontrolIds, isSubcontrol ? [] : mappedControlRefs, isSubcontrol ? [] : mappedSubcontrolRefs),
    [controlId, subcontrolIds, isSubcontrol, mappedControlRefs, mappedSubcontrolRefs],
  )

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [filters, setFilters] = useState<WhereCondition>({})
  const filterFields = usePoliciesFilters()
  const filteredFields = useMemo(() => filterFields?.filter((field) => field.key !== 'hasControlsWith' && field.key !== 'hasSubcontrolsWith') ?? null, [filterFields])
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)

  const where = useMemo(() => {
    const base: InternalPolicyWhereInput = {
      nameContainsFold: debouncedSearch,
    }

    const result = whereGenerator<InternalPolicyWhereInput>(filters as InternalPolicyWhereInput, (key, value) => {
      if (key === 'hasControlsWith' || key === 'hasSubcontrolsWith') {
        return {} as InternalPolicyWhereInput
      }
      if (key === 'hasProgramsWith') {
        return { hasProgramsWith: [{ idIn: value }] } as InternalPolicyWhereInput
      }
      return { [key]: value }
    })

    const hasStatusCondition = (obj: InternalPolicyWhereInput): boolean => {
      if ('status' in obj || 'statusNEQ' in obj || 'statusIn' in obj || 'statusNotIn' in obj) return true
      if (Array.isArray(obj.and) && obj.and.some(hasStatusCondition)) return true
      if (Array.isArray(obj.or) && obj.or.some(hasStatusCondition)) return true
      return false
    }

    if (!hasStatusCondition(result)) {
      result.statusNotIn = [InternalPolicyDocumentStatus.ARCHIVED]
    }

    return mergeWhere<InternalPolicyWhereInput>([associationFilter as InternalPolicyWhereInput, base, result])
  }, [filters, debouncedSearch, associationFilter])

  const orderBy = useMemo<GetInternalPoliciesListQueryVariables['orderBy']>(() => [{ field: InternalPolicyOrderField.updated_at, direction: OrderDirection.DESC }], [])

  const { policies, paginationMeta, isLoading } = useDocumentationPolicies({
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
    for (const policy of policies) {
      const directlyLinked = policy.controls?.edges?.some((e) => e?.node?.id === controlId) ?? false
      if (directlyLinked) continue

      const sources: { refCode: string; href: string }[] = []

      for (const edge of policy.subcontrols?.edges ?? []) {
        const node = edge?.node
        if (!node?.id || !node?.refCode) continue
        if (subcontrolIdSet.has(node.id)) {
          sources.push({ refCode: node.refCode, href: `/controls/${controlId}/${node.id}` })
        } else {
          const ref = mappedSubcontrolIdToRef.get(node.id)
          if (ref) sources.push(ref)
        }
      }

      for (const edge of policy.controls?.edges ?? []) {
        const node = edge?.node
        if (!node?.id) continue
        const ref = mappedControlIdToRef.get(node.id)
        if (ref) sources.push(ref)
      }

      map.set(policy.id, sources)
    }
    return map
  }, [policies, controlId, isSubcontrol, subcontrolIdSet, mappedControlIdToRef, mappedSubcontrolIdToRef])

  const memberIds = useMemo(() => [...new Set(policies.map((policy) => policy.updatedBy).filter((id): id is string => typeof id === 'string' && id.length > 0))], [policies])

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

  const columns = useMemo<ColumnDef<AssociationRow>[]>(
    () => [
      {
        accessorKey: 'name',
        header: () => <span className="whitespace-nowrap">Name</span>,
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <span className="text-blue-500 hover:underline whitespace-nowrap cursor-pointer" onClick={() => setSelectedPolicyId(row.original.id)}>
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
                    <DocumentStatusBadge status={row.original.status as InternalPolicyDocumentStatus} />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{DocumentStatusTooltips[row.original.status as InternalPolicyDocumentStatus]}</p>
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
        cell: ({ row }) => {
          const updatedBy = row.original.updatedBy ?? ''
          const user = userMap[updatedBy]
          const token = tokenMap[updatedBy]

          if (!user && !token) {
            return <span className="text-muted-foreground italic">Deleted user</span>
          }

          return (
            <div className="flex items-center gap-2 whitespace-nowrap">
              {token ? <KeyRound size={16} /> : <Avatar entity={user} className="w-6 h-6" />}
              <span>{token ? token.name : user?.displayName || '-'}</span>
            </div>
          )
        },
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
      policies.map((policy) => ({
        id: policy.id,
        name: policy.name,
        status: policy.status ?? null,
        approver: policy.approver ?? null,
        updatedBy: policy.updatedBy ?? null,
        updatedAt: policy.updatedAt,
        href: `/policies/${policy.id}/view`,
      })),
    [policies],
  )

  return (
    <>
      <AssociationSection
        title="Internal Policies"
        rows={rows}
        columns={columns}
        loading={isLoading}
        pagination={pagination}
        onPaginationChange={setPagination}
        paginationMeta={paginationMeta}
        onRowClick={(row) => setSelectedPolicyId(row.id)}
        searchBar={
          <SearchFilterBar
            placeholder="Search policies"
            isSearching={search !== debouncedSearch}
            searchValue={search}
            onSearchChange={setSearch}
            filterFields={filteredFields}
            onFilterChange={setFilters}
            actionButtons={
              canEdit ? (
                <SetControlAssociationDialog
                  defaultSelectedObject={ObjectTypeObjects.INTERNAL_POLICY}
                  allowedObjectTypes={[ObjectTypeObjects.INTERNAL_POLICY]}
                  trigger={
                    <Button type="button" icon={<Plus size={16} />} iconPosition="left" variant="secondary" size="md" className="size-fit py-1.5 px-2">
                      Add Policy
                    </Button>
                  }
                />
              ) : undefined
            }
          />
        }
      />
      <ViewPolicySheet policyId={selectedPolicyId} onClose={() => setSelectedPolicyId(null)} />
    </>
  )
}

export default PoliciesTable
