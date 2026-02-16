'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { DataTable, getInitialPagination } from '@repo/ui/data-table'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { TableKeyEnum } from '@repo/ui/table-key'
import { TrustCenterNdaRequestTrustCenterNdaRequestStatus, TrustCenterNdaRequestWhereInput } from '@repo/codegen/src/schema'
import { DEFAULT_NDA_REQUESTS_ORDER, useBulkDeleteTrustCenterNdaRequest, useGetTrustCenterNdaRequests, useUpdateTrustCenterNdaRequest } from '@/lib/graphql-hooks/trust-center-nda-request'
import NdaRequestsTableToolbar from './nda-requests-table-toolbar'
import { getNdaRequestColumns, NdaRequestRow } from './table-config'
import { useNotification } from '@/hooks/useNotification'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useDebounce } from '@uidotdev/usehooks'

type NdaRequestsTableProps = {
  requireApproval: boolean
}

const NdaRequestsTable = ({ requireApproval }: NdaRequestsTableProps) => {
  const [activeTab, setActiveTab] = useState<'requested' | 'approved' | 'signed'>('requested')
  const [searchTerm, setSearchTerm] = useState('')
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [actionLoadingType, setActionLoadingType] = useState<'approve' | 'deny' | null>(null)
  const [approveAllLoading, setApproveAllLoading] = useState(false)
  const [approveAllDialogOpen, setApproveAllDialogOpen] = useState(false)
  const [selectedRows, setSelectedRows] = useState<{ id: string }[]>([])
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false)
  const [revokeLoading, setRevokeLoading] = useState(false)
  const [pagination, setPagination] = useState<TPagination>(getInitialPagination(TableKeyEnum.TRUST_CENTER_NDA_REQUESTS, DEFAULT_PAGINATION))
  const [filters, setFilters] = useState<TrustCenterNdaRequestWhereInput | null>(null)
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: updateNdaRequest } = useUpdateTrustCenterNdaRequest()
  const { mutateAsync: bulkDeleteNdaRequests } = useBulkDeleteTrustCenterNdaRequest()
  const debouncedSearch = useDebounce(searchTerm, 300)

  const status = useMemo<TrustCenterNdaRequestTrustCenterNdaRequestStatus>(() => {
    if (activeTab === 'signed') return TrustCenterNdaRequestTrustCenterNdaRequestStatus.SIGNED
    if (activeTab === 'approved') return TrustCenterNdaRequestTrustCenterNdaRequestStatus.APPROVED
    return requireApproval ? TrustCenterNdaRequestTrustCenterNdaRequestStatus.NEEDS_APPROVAL : TrustCenterNdaRequestTrustCenterNdaRequestStatus.REQUESTED
  }, [activeTab, requireApproval])

  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      page: 1,
      query: { first: prev.pageSize },
    }))
    setSelectedRows([])
  }, [status])

  const whereFilter = useMemo<TrustCenterNdaRequestWhereInput>(
    () => ({
      status,
      ...(debouncedSearch
        ? {
            or: [{ firstNameContainsFold: debouncedSearch }, { lastNameContainsFold: debouncedSearch }, { companyNameContainsFold: debouncedSearch }, { emailContainsFold: debouncedSearch }],
          }
        : {}),
      ...(filters ?? {}),
    }),
    [status, debouncedSearch, filters],
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
        approvedAt: request.approvedAt ?? '',
        signedAt: request.signedAt ?? '',
      })),
    [requests],
  )

  const columns = useMemo(
    () =>
      getNdaRequestColumns({
        showActions: requireApproval && activeTab === 'requested',
        showApprovedOn: requireApproval && activeTab === 'approved',
        showSignedOn: activeTab === 'signed',
        showSelect: activeTab === 'signed',
        selectedRows,
        setSelectedRows,
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
              input: { status: TrustCenterNdaRequestTrustCenterNdaRequestStatus.DECLINED },
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
    [activeTab, actionLoadingId, actionLoadingType, errorNotification, requireApproval, selectedRows, successNotification, updateNdaRequest],
  )

  const handleSearchTermChange = (value: string) => {
    setSearchTerm(value)
    setPagination((prev) => ({
      ...prev,
      page: 1,
      query: { first: prev.pageSize },
    }))
  }

  const handleFilterChange = useCallback((newFilters: TrustCenterNdaRequestWhereInput) => {
    setFilters(newFilters)
    setPagination((prev) => ({
      ...prev,
      page: 1,
      query: { first: prev.pageSize },
    }))
  }, [])

  const handleApproveAll = useCallback(async () => {
    if (requests.length === 0) return
    setApproveAllLoading(true)
    try {
      await Promise.all(
        requests.map((request) =>
          updateNdaRequest({
            updateTrustCenterNdaRequestId: request.id,
            input: { status: TrustCenterNdaRequestTrustCenterNdaRequestStatus.APPROVED },
          }),
        ),
      )
      successNotification({
        title: 'NDA Requests Approved',
        description: 'All NDA requests on this page have been approved.',
      })
    } catch (error) {
      errorNotification({
        title: 'Approve All Failed',
        description: parseErrorMessage(error),
      })
    } finally {
      setApproveAllLoading(false)
      setApproveAllDialogOpen(false)
    }
  }, [errorNotification, requests, successNotification, updateNdaRequest])

  const handleRevokeAccess = useCallback(async () => {
    if (selectedRows.length === 0) return
    setRevokeLoading(true)
    try {
      await bulkDeleteNdaRequests({ ids: selectedRows.map((r) => r.id) })
      successNotification({
        title: 'Access Revoked',
        description: `Successfully revoked access for ${selectedRows.length} NDA request${selectedRows.length === 1 ? '' : 's'}.`,
      })
      setSelectedRows([])
    } catch (error) {
      errorNotification({
        title: 'Revoke Failed',
        description: parseErrorMessage(error),
      })
    } finally {
      setRevokeLoading(false)
      setRevokeDialogOpen(false)
    }
  }, [bulkDeleteNdaRequests, errorNotification, selectedRows, successNotification])

  return (
    <div>
      <ConfirmationDialog
        open={approveAllDialogOpen}
        onOpenChange={setApproveAllDialogOpen}
        onConfirm={handleApproveAll}
        title="Approve all NDA requests?"
        description={
          <>
            This will approve <b>{requests.length}</b> NDA request{requests.length === 1 ? '' : 's'} on the current page.
          </>
        }
        confirmationText="Approve all"
      />
      <ConfirmationDialog
        open={revokeDialogOpen}
        onOpenChange={setRevokeDialogOpen}
        onConfirm={handleRevokeAccess}
        title="Revoke document access?"
        description={
          <>
            This will revoke private document access for <b>{selectedRows.length}</b> selected NDA request{selectedRows.length === 1 ? '' : 's'}. This action cannot be undone.
          </>
        }
        confirmationText="Revoke access"
      />
      <NdaRequestsTableToolbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchTerm={searchTerm}
        setSearchTerm={handleSearchTermChange}
        onFilterChange={handleFilterChange}
        onApproveAllRequest={() => setApproveAllDialogOpen(true)}
        approveAllLoading={approveAllLoading}
        approveAllDisabled={requests.length === 0}
        requireApproval={requireApproval}
        selectedCount={selectedRows.length}
        onRevokeAccessRequest={() => setRevokeDialogOpen(true)}
        revokeLoading={revokeLoading}
      />
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
