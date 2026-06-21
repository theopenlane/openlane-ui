'use client'

import React, { use, useCallback, useEffect, useMemo, useState } from 'react'
import { DataTable } from '@repo/ui/data-table'
import { type TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { TableKeyEnum } from '@repo/ui/table-key'
import { Input } from '@repo/ui/input'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { useGetTrustCenter } from '@/lib/graphql-hooks/trust-center'
import { useGetAllSubscribers, useDeleteSubscriber, useUnsubscribeSubscriber } from '@/lib/graphql-hooks/subscriber'
import { useAccountRoles } from '@/lib/query-hooks/permissions'
import { canEdit as canEditTrustCenter } from '@/lib/authz/utils'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { SubscriberOrderField, OrderDirection } from '@repo/codegen/src/schema'
import { getSubscriberColumns } from './table/columns'

const SubscribersPage = () => {
  const { setCrumbs } = use(BreadcrumbContext)
  const { successNotification, errorNotification } = useNotification()

  const [searchTerm, setSearchTerm] = useState('')
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)
  const [deleteEmail, setDeleteEmail] = useState<string | null>(null)

  const { data: trustCenterData } = useGetTrustCenter()
  const trustCenterID = trustCenterData?.trustCenters?.edges?.[0]?.node?.id ?? ''

  const { data: tcPermission } = useAccountRoles(ObjectTypes.TRUST_CENTER, trustCenterID)
  const canEdit = canEditTrustCenter(tcPermission?.roles)

  const where = {
    trustCenterID,
    ...(searchTerm ? { emailContainsFold: searchTerm } : {}),
  }

  const { subscribers, paginationMeta, isLoading } = useGetAllSubscribers({
    where,
    orderBy: [{ field: SubscriberOrderField.email, direction: OrderDirection.ASC }],
    pagination,
    enabled: !!trustCenterID,
  })

  const { mutateAsync: deleteSubscriber } = useDeleteSubscriber()
  const { mutateAsync: unsubscribe } = useUnsubscribeSubscriber()

  const handleUnsubscribe = useCallback(
    async (email: string) => {
      try {
        await unsubscribe({ email, input: { unsubscribed: true } })
        successNotification({ title: 'Subscriber unsubscribed' })
      } catch (error) {
        errorNotification({ title: 'Error', description: parseErrorMessage(error) })
      }
    },
    [unsubscribe, successNotification, errorNotification],
  )

  const handleDelete = async () => {
    if (!deleteEmail) {
      return
    }

    try {
      await deleteSubscriber({ deleteSubscriberEmail: deleteEmail })
      successNotification({ title: 'Subscriber removed' })
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    } finally {
      setDeleteEmail(null)
    }
  }

  const columns = useMemo(() => getSubscriberColumns({ canEdit, onUnsubscribe: handleUnsubscribe, onDelete: setDeleteEmail }), [canEdit, handleUnsubscribe])

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Trust Center', href: '/trust-center/overview' },
      { label: 'Subscribers', href: '/trust-center/subscribers' },
    ])
  }, [setCrumbs])

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Subscribers</h2>
      </div>

      <div className="mb-4 max-w-sm">
        <Input
          maxWidth
          placeholder="Search by email"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setPagination(DEFAULT_PAGINATION)
          }}
        />
      </div>

      <DataTable
        columns={columns}
        data={subscribers}
        pagination={pagination}
        onPaginationChange={setPagination}
        paginationMeta={paginationMeta}
        loading={isLoading}
        tableKey={TableKeyEnum.TRUST_CENTER_SUBSCRIBERS}
      />

      <ConfirmationDialog
        open={Boolean(deleteEmail)}
        onOpenChange={(open) => !open && setDeleteEmail(null)}
        onConfirm={handleDelete}
        title="Remove subscriber"
        description="This will permanently remove this subscriber. They will no longer receive trust center update emails."
      />
    </div>
  )
}

export default SubscribersPage
