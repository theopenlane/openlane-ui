'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { DataTable } from '@repo/ui/data-table'
import { TableKeyEnum } from '@repo/ui/table-key'
import { Input } from '@repo/ui/input'
import { Button } from '@repo/ui/button'
import { SearchIcon, LoaderCircle, Download, Upload } from 'lucide-react'
import { useDebounce } from '@uidotdev/usehooks'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useOrgTablePagination } from '@/hooks/use-org-table-state'
import { type ControlWhereInput } from '@repo/codegen/src/schema'
import { useGetAuditorDashboardControls } from '@/lib/graphql-hooks/control'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import CreateReviewSheet from '@/components/pages/protected/reviews/common/create-review-sheet'
import ViewReviewSheet from '@/components/pages/protected/reviews/view-review-sheet'
import { ExportEvidenceDialog } from '@/components/pages/protected/evidence/dialog/export-evidence-dialog'
import { BulkCSVCreateEvidenceDialog } from '@/components/pages/protected/evidence/dialog/bulk-csv-create-evidence-dialog'
import { type EvidenceWhereInput } from '@repo/codegen/src/schema'
import { getControlEvidenceStatus, getControlReview, getControlLastReviewed } from '../utils/control-status'
import { getAuditorDashboardColumns, type AuditorDashboardControlRow } from './columns'

type AuditorControlsTableProps = {
  programId: string
}

export const AuditorControlsTable: React.FC<AuditorControlsTableProps> = ({ programId }) => {
  const [pagination, setPagination] = useOrgTablePagination(DEFAULT_PAGINATION)
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 300)
  const [startReviewControlId, setStartReviewControlId] = useState<string | null>(null)
  const [openReviewId, setOpenReviewId] = useState<string | null>(null)

  const queryClient = useQueryClient()
  const { data: permission } = useOrganizationRoles()
  const canCreateReview = !!permission?.roles?.includes(AccessEnum.CanCreateReview)

  const handleReviewSheetClose = useCallback(() => {
    setStartReviewControlId(null)
    setOpenReviewId(null)
    queryClient.invalidateQueries({ queryKey: ['auditor-dashboard-controls'] })
  }, [queryClient])

  const where: ControlWhereInput = useMemo(() => {
    const base: ControlWhereInput = { hasProgramsWith: [{ id: programId }] }
    if (debouncedSearch) {
      return { ...base, or: [{ refCodeContainsFold: debouncedSearch }, { titleContainsFold: debouncedSearch }] }
    }
    return base
  }, [programId, debouncedSearch])

  const { controls, paginationMeta, isLoading, isFetching } = useGetAuditorDashboardControls({ programId, where, pagination })

  const rows = useMemo<AuditorDashboardControlRow[]>(
    () =>
      controls.map((control) => {
        const reviews = (control.reviews?.edges ?? []).flatMap((edge) => (edge?.node ? [{ id: edge.node.id, status: edge.node.status, reviewedAt: edge.node.reviewedAt }] : []))
        const evidenceStatuses = (control.evidence?.edges ?? []).map((edge) => edge?.node?.status)
        return {
          ...control,
          evidenceStatus: getControlEvidenceStatus(evidenceStatuses),
          review: getControlReview(reviews),
          lastReviewed: getControlLastReviewed(reviews),
        }
      }),
    [controls],
  )

  const columns = useMemo(
    () =>
      getAuditorDashboardColumns({
        canCreateReview,
        onStartReview: setStartReviewControlId,
        onOpenReview: setOpenReviewId,
      }),
    [canCreateReview],
  )

  const exportFilters = useMemo(() => JSON.stringify({ hasProgramsWith: [{ id: programId }] } satisfies EvidenceWhereInput), [programId])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <Input
          value={searchTerm}
          icon={isFetching ? <LoaderCircle className="animate-spin" size={16} /> : <SearchIcon size={16} />}
          placeholder="Search"
          className="max-w-xs"
          onChange={(event) => setSearchTerm(event.currentTarget.value)}
        />
        <div className="flex items-center gap-2">
          <BulkCSVCreateEvidenceDialog
            trigger={
              <Button variant="secondary" className="h-9" icon={<Upload size={16} />} iconPosition="left">
                Bulk Evidence Request
              </Button>
            }
          />
          <ExportEvidenceDialog
            filters={exportFilters}
            trigger={
              <Button variant="secondary" className="h-9" icon={<Download size={16} />} iconPosition="left">
                Bulk Download Evidence
              </Button>
            }
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        loading={isLoading}
        pagination={pagination}
        onPaginationChange={setPagination}
        paginationMeta={paginationMeta}
        tableKey={TableKeyEnum.AUDITOR_DASHBOARD_CONTROLS}
      />

      {startReviewControlId && <CreateReviewSheet controlId={startReviewControlId} programId={programId} onClose={handleReviewSheetClose} />}
      {openReviewId && <ViewReviewSheet entityId={openReviewId} onClose={handleReviewSheetClose} />}
    </div>
  )
}
