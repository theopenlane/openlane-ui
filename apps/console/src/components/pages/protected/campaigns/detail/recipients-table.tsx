'use client'

import React, { useMemo, useState } from 'react'
import { useDebounce } from '@uidotdev/usehooks'
import { type ColumnDef } from '@repo/ui/table-types'
import { DataTable } from '@repo/ui/data-table'
import { TableKeyEnum } from '@repo/ui/table-key'
import { SearchFilterBar } from '@/components/shared/crud-base/tabs/shared'
import type { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useCampaignTargetsWithFilter, useDeleteCampaignTarget, type CampaignTargetsNodeNonNull } from '@/lib/graphql-hooks/campaign-target'
import { formatDate } from '@/utils/date'
import { Button } from '@repo/ui/button'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { Trash2 } from 'lucide-react'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { ROW_ACTIONS_COLUMN_ID } from '@repo/ui/pinned-columns'
import { AssessmentResponseStatusLabel } from '@/components/shared/enum-mapper/assessment-response-enum'
import { type CampaignTargetWhereInput } from '@repo/codegen/src/schema'
import ObjectSheetLink from '@/components/shared/object-sheet-link/object-sheet-link'
import { useOpenObjectSheet } from '@/providers/sheet-navigation-provider'
import { useRecipientLinks } from './use-recipient-links'

type RecipientsTableProps = {
  campaignId: string
  showDelivery?: boolean
  canRemove?: boolean
}

const RecipientsTable: React.FC<RecipientsTableProps> = ({ campaignId, showDelivery = true, canRemove = false }) => {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)
  const [pendingRemoval, setPendingRemoval] = useState<CampaignTargetsNodeNonNull | null>(null)

  const { mutateAsync: deleteCampaignTarget, isPending: isRemoving } = useDeleteCampaignTarget()
  const { successNotification, errorNotification } = useNotification()

  const handleRemove = async () => {
    if (!pendingRemoval) return
    try {
      await deleteCampaignTarget({ deleteCampaignTargetId: pendingRemoval.id })
      successNotification({ title: 'Recipient removed' })
      setPendingRemoval(null)
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    }
  }

  const where = useMemo<CampaignTargetWhereInput>(
    () => ({
      hasCampaignWith: [{ id: campaignId }],
      ...(debouncedSearch ? { or: [{ fullNameContainsFold: debouncedSearch }, { emailContainsFold: debouncedSearch }] } : {}),
    }),
    [campaignId, debouncedSearch],
  )

  const {
    CampaignTargetsNodes: recipients,
    data,
    isLoading,
    isFetching,
  } = useCampaignTargetsWithFilter({
    where,
    pagination,
    enabled: !!campaignId,
  })

  const recipientLinks = useRecipientLinks(recipients)
  const openObjectSheet = useOpenObjectSheet()

  const columns = useMemo<ColumnDef<CampaignTargetsNodeNonNull>[]>(() => {
    const baseColumns: ColumnDef<CampaignTargetsNodeNonNull>[] = [
      {
        accessorKey: 'fullName',
        header: 'Name',
        cell: ({ row }) => {
          const label = row.original.fullName || '—'
          const link = recipientLinks.get(row.original.id)
          return <span className="block truncate">{link ? <ObjectSheetLink id={link.id} kind={link.kind} label={label} onOpenSheet={openObjectSheet} /> : label}</span>
        },
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.email}</span>,
      },
    ]

    const deliveryColumns: ColumnDef<CampaignTargetsNodeNonNull>[] = [
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => <AssessmentResponseStatusLabel status={row.original.status} />,
      },
      {
        accessorKey: 'sentAt',
        header: 'Sent At',
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.sentAt ? formatDate(row.original.sentAt as string) : '—'}</span>,
      },
      {
        accessorKey: 'completedAt',
        header: 'Completed At',
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.completedAt ? formatDate(row.original.completedAt as string) : '—'}</span>,
      },
    ]

    const addedColumn: ColumnDef<CampaignTargetsNodeNonNull> = {
      accessorKey: 'createdAt',
      header: 'Added',
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.createdAt ? formatDate(row.original.createdAt as string) : '—'}</span>,
    }

    const removeColumn: ColumnDef<CampaignTargetsNodeNonNull> = {
      id: ROW_ACTIONS_COLUMN_ID,
      header: '',
      size: 48,
      cell: ({ row }) => (
        <Button variant="icon" type="button" aria-label={`Remove ${row.original.email}`} onClick={() => setPendingRemoval(row.original)}>
          <Trash2 size={16} />
        </Button>
      ),
    }

    return [...baseColumns, ...(showDelivery ? deliveryColumns : [addedColumn]), ...(canRemove ? [removeColumn] : [])]
  }, [recipientLinks, openObjectSheet, showDelivery, canRemove])

  const paginationMeta = useMemo(
    () => ({
      totalCount: data?.campaignTargets?.totalCount ?? 0,
      pageInfo: data?.campaignTargets?.pageInfo,
      isLoading: isFetching,
    }),
    [data, isFetching],
  )

  return (
    <div>
      <h3 className="text-base font-semibold mb-2">Recipients</h3>
      <div className="mb-3">
        <SearchFilterBar placeholder="Search recipients" isSearching={search !== debouncedSearch} searchValue={search} onSearchChange={setSearch} filterFields={null} onFilterChange={() => {}} />
      </div>
      <DataTable
        columns={columns}
        data={recipients}
        loading={isLoading}
        pagination={pagination}
        onPaginationChange={setPagination}
        paginationMeta={paginationMeta}
        tableKey={TableKeyEnum.CAMPAIGN_RECIPIENTS}
        noResultsText="No recipients found"
      />
      <ConfirmationDialog
        open={!!pendingRemoval}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setPendingRemoval(null)
        }}
        onConfirm={handleRemove}
        confirmationText="Remove"
        loading={isRemoving}
        title="Remove recipient"
        description={
          <>
            <b>{pendingRemoval?.email}</b> will no longer receive this campaign.
          </>
        }
      />
    </div>
  )
}

export default RecipientsTable
