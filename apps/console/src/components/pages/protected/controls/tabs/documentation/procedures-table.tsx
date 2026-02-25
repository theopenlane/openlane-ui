'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { useDebounce } from '@uidotdev/usehooks'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { whereGenerator } from '@/components/shared/table-filter/where-generator'
import { useProceduresFilters } from '@/components/pages/protected/procedures/table/table-config'
import { SetObjectAssociationDialog } from '@/components/pages/protected/controls/set-object-association-modal'
import { useDocumentationProcedures } from '@/lib/graphql-hooks/documentation'
import { ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import { OrderDirection, ProcedureDocumentStatus, ProcedureOrderField } from '@repo/codegen/src/schema'
import type { GetProceduresListQueryVariables, ProcedureWhereInput } from '@repo/codegen/src/schema'
import type { WhereCondition } from '@/types'
import type { TPagination } from '@repo/ui/pagination-types'
import { AssociationSection, SearchFilterBar, buildAssociationFilter, mergeWhere } from '@/components/pages/protected/controls/tabs/shared/documentation-shared'
import type { AssociationRow } from '@/components/pages/protected/controls/tabs/shared/documentation-shared'
import { ColumnDef } from '@tanstack/react-table'
import { DocumentStatusBadge, DocumentStatusTooltips } from '@/components/shared/enum-mapper/policy-enum'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { Button } from '@repo/ui/button'
import { Avatar } from '@/components/shared/avatar/avatar'
import { KeyRound, Plus } from 'lucide-react'
import { formatTimeSince } from '@/utils/date'
import { useGetOrgUserList } from '@/lib/graphql-hooks/member'
import { useGetApiTokensByIds } from '@/lib/graphql-hooks/tokens'
import type { ApiToken, User } from '@repo/codegen/src/schema'

type ProceduresTableProps = {
  controlId?: string
  subcontrolIds: string[]
}

const ProceduresTable: React.FC<ProceduresTableProps> = ({ controlId, subcontrolIds }) => {
  const associationFilter = useMemo(() => buildAssociationFilter(controlId, subcontrolIds), [controlId, subcontrolIds])

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

  const memberIds = useMemo(() => [...new Set(procedures.map((procedure) => procedure.updatedBy).filter((id): id is string => typeof id === 'string' && id.length > 0))], [procedures])

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
          <Link href={row.original.href} className="text-blue-500 hover:underline whitespace-nowrap">
            {row.original.name}
          </Link>
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
    [userMap, tokenMap],
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
    <AssociationSection
      title="Procedures"
      rows={rows}
      columns={columns}
      loading={isLoading}
      pagination={pagination}
      onPaginationChange={setPagination}
      paginationMeta={paginationMeta}
      searchBar={
        <SearchFilterBar
          placeholder="Search procedures"
          isSearching={search !== debouncedSearch}
          searchValue={search}
          onSearchChange={setSearch}
          filterFields={filteredFields}
          onFilterChange={setFilters}
          actionButtons={
            <SetObjectAssociationDialog
              defaultSelectedObject={ObjectTypeObjects.PROCEDURE}
              allowedObjectTypes={[ObjectTypeObjects.PROCEDURE]}
              trigger={
                <Button type="button" icon={<Plus size={16} />} iconPosition="left" variant="secondary" size="md" className="size-fit py-1.5 px-2">
                  Add Procedure
                </Button>
              }
            />
          }
        />
      }
    />
  )
}

export default ProceduresTable
