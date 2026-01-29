'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { DataTable, getInitialPagination } from '@repo/ui/data-table'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { TableKeyEnum } from '@repo/ui/table-key'
import { TrustCenterNdaRequestTrustCenterNdaRequestStatus, TrustCenterNdaRequestWhereInput } from '@repo/codegen/src/schema'
import { DEFAULT_NDA_REQUESTS_ORDER, useGetTrustCenterNdaRequests, useUpdateTrustCenterNdaRequest } from '@/lib/graphql-hooks/trust-center-NDA'
import NdaRequestsTableToolbar from './nda-requests-table-toolbar'
import { getNdaRequestColumns, NdaRequestRow } from './table-config'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

type Props = {
  ndaApprovalRequired: boolean
}

const NdaRequestsTable: React.FC<Props> = ({ ndaApprovalRequired }) => {
  const [activeTab, setActiveTab] = useState<'requested' | 'approved' | 'signed'>('requested')
  const [searchTerm, setSearchTerm] = useState('')
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [actionLoadingType, setActionLoadingType] = useState<'approve' | 'deny' | null>(null)
  const [pagination, setPagination] = useState<TPagination>(getInitialPagination(TableKeyEnum.TRUST_CENTER_NDA_REQUESTS, DEFAULT_PAGINATION))
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: updateNdaRequest } = useUpdateTrustCenterNdaRequest()

  const status = useMemo<TrustCenterNdaRequestTrustCenterNdaRequestStatus>(() => {
    if (activeTab === 'signed') return TrustCenterNdaRequestTrustCenterNdaRequestStatus.SIGNED
    if (activeTab === 'approved') return TrustCenterNdaRequestTrustCenterNdaRequestStatus.APPROVED
    return ndaApprovalRequired ? TrustCenterNdaRequestTrustCenterNdaRequestStatus.NEEDS_APPROVAL : TrustCenterNdaRequestTrustCenterNdaRequestStatus.REQUESTED
  }, [activeTab, ndaApprovalRequired])

  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      page: 1,
      query: { first: prev.pageSize },
    }))
  }, [status])

  const whereFilter = useMemo<TrustCenterNdaRequestWhereInput>(
    () => ({
      status,
      ...(searchTerm
        ? {
            or: [{ firstNameContainsFold: searchTerm }, { lastNameContainsFold: searchTerm }, { companyNameContainsFold: searchTerm }, { emailContainsFold: searchTerm }],
          }
        : {}),
    }),
    [status, searchTerm],
  )

  const { requests, paginationMeta, isFetching } = useGetTrustCenterNdaRequests({
    where: whereFilter,
    orderBy: DEFAULT_NDA_REQUESTS_ORDER,
    pagination,
  })

  const tableData = useMemo<NdaRequestRow[]>(
    () =>
      requests.map((request) => ({
        id: request.id,
        firstName: request.firstName ?? '-',
        lastName: request.lastName ?? '-',
        companyName: request.companyName ?? '-',
        email: request.email ?? '-',
        createdAt: request.createdAt ?? '',
        updatedAt: request.updatedAt ?? '',
      })),
    [requests],
  )

  const columns = useMemo(
    () =>
      getNdaRequestColumns({
        showActions: activeTab === 'requested',
        showApprovedOn: activeTab === 'approved',
        showSignedOn: activeTab === 'signed',
        onApprove: async (id) => {
          setActionLoadingId(id)
          setActionLoadingType('approve')
          try {
            await updateNdaRequest({
              updateTrustCenterNdaRequestId: id,
              input: { status: TrustCenterNdaRequestTrustCenterNdaRequestStatus.APPROVED },
            })
            successNotification({
              title: 'NDA Approved',
              description: 'The NDA request has been approved.',
            })
          } catch (error) {
            errorNotification({
              title: 'Approval Failed',
              description: parseErrorMessage(error),
            })
          } finally {
            setActionLoadingId(null)
            setActionLoadingType(null)
          }
        },
        onDeny: async (id) => {
          setActionLoadingId(id)
          setActionLoadingType('deny')
          try {
            await updateNdaRequest({
              updateTrustCenterNdaRequestId: id,
              input: { status: TrustCenterNdaRequestTrustCenterNdaRequestStatus.REQUESTED },
            })
            successNotification({
              title: 'NDA Denied',
              description: 'The NDA request has been denied.',
            })
          } catch (error) {
            errorNotification({
              title: 'Denial Failed',
              description: parseErrorMessage(error),
            })
          } finally {
            setActionLoadingId(null)
            setActionLoadingType(null)
          }
        },
        actionLoadingId,
        actionLoadingType,
      }),
    [activeTab, actionLoadingId, actionLoadingType, errorNotification, successNotification, updateNdaRequest],
  )

  const handleSearchTermChange = (value: string) => {
    setSearchTerm(value)
    setPagination((prev) => ({
      ...prev,
      page: 1,
      query: { first: prev.pageSize },
    }))
  }

  return (
    <div>
      <NdaRequestsTableToolbar activeTab={activeTab} onTabChange={setActiveTab} searchTerm={searchTerm} setSearchTerm={handleSearchTermChange} />
      <DataTable
        columns={columns}
        data={tableData}
        pagination={pagination}
        onPaginationChange={setPagination}
        paginationMeta={paginationMeta}
        loading={isFetching}
        tableKey={TableKeyEnum.TRUST_CENTER_NDA_REQUESTS}
      />
    </div>
  )
}

export default NdaRequestsTable
