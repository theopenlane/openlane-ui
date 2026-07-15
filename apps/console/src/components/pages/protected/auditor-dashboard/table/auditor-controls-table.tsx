'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { DataTable } from '@repo/ui/data-table'
import { TableKeyEnum } from '@repo/ui/table-key'
import { Input } from '@repo/ui/input'
import { Button } from '@repo/ui/button'
import { SearchIcon, LoaderCircle, Download, Upload } from 'lucide-react'
import { useDebounce } from '@uidotdev/usehooks'
import { type VisibilityState } from '@tanstack/react-table'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useOrgTablePagination } from '@/hooks/use-org-table-state'
import { type ControlWhereInput, type EvidenceWhereInput } from '@repo/codegen/src/schema'
import { useGetAuditorDashboardControls } from '@/lib/graphql-hooks/control'
import { useStandardsSelect } from '@/lib/graphql-hooks/standard'
import { useGroupSelect } from '@/lib/graphql-hooks/group'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import { whereGenerator } from '@/components/shared/table-filter/where-generator'
import { TableFilter } from '@/components/shared/table-filter/table-filter'
import ColumnVisibilityMenu, { getInitialVisibility } from '@/components/shared/column-visibility-menu/column-visibility-menu'
import CreateControlReviewSheet from '@/components/pages/protected/controls/quick-actions/create-control-review-sheet'
import ViewReviewSheet from '@/components/pages/protected/reviews/view-review-sheet'
import EvidenceDetailsSheet from '@/components/pages/protected/evidence/evidence-details-sheet'
import RequestInfoSheet from './request-info-sheet'
import { ExportEvidenceDialog } from '@/components/pages/protected/evidence/dialog/export-evidence-dialog'
import { BulkCSVCreateEvidenceDialog } from '@/components/pages/protected/evidence/dialog/bulk-csv-create-evidence-dialog'
import { getControlReview, getControlLastReviewed } from '../utils/control-status'
import { getAuditorDashboardColumns, getAuditorDashboardMappedColumns, type AuditorDashboardControlRow } from './columns'
import { getAuditorDashboardFilterFields, getAuditorDashboardQuickFilters } from './table-config'

type AuditorControlsTableProps = {
  programId: string
}

export const AuditorControlsTable: React.FC<AuditorControlsTableProps> = ({ programId }) => {
  const [pagination, setPagination] = useOrgTablePagination(DEFAULT_PAGINATION)
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 300)
  const [filters, setFilters] = useState<ControlWhereInput>({})
  const [startReviewControlId, setStartReviewControlId] = useState<string | null>(null)
  const [openReviewId, setOpenReviewId] = useState<string | null>(null)
  const [requestInfoControl, setRequestInfoControl] = useState<{ id: string; refCode: string } | null>(null)
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => getInitialVisibility(TableKeyEnum.AUDITOR_DASHBOARD_CONTROLS, { linkedPolicies: false }))

  const queryClient = useQueryClient()
  const { data: permission } = useOrganizationRoles()
  const canCreateReview = !!permission?.roles?.includes(AccessEnum.CanCreateReview)

  const { standardOptions } = useStandardsSelect({ where: { hasControlsWith: [{ hasProgramsWith: [{ id: programId }] }] } })
  const { groupOptions } = useGroupSelect()

  const filterFields = useMemo(() => getAuditorDashboardFilterFields(standardOptions, groupOptions), [standardOptions, groupOptions])
  const quickFilters = useMemo(() => getAuditorDashboardQuickFilters(programId), [programId])

  const handleReviewSheetClose = useCallback(() => {
    setStartReviewControlId(null)
    setOpenReviewId(null)
    queryClient.invalidateQueries({ queryKey: ['auditor-dashboard-controls'] })
  }, [queryClient])

  const where: ControlWhereInput = useMemo(() => {
    const generated = whereGenerator<ControlWhereInput>(filters, (key, value) => {
      if (key === 'standardIDIn' && Array.isArray(value) && value.includes('CUSTOM')) {
        const normalStandards = value.filter((id) => id !== 'CUSTOM')
        return { or: [...(normalStandards.length > 0 ? [{ standardIDIn: normalStandards }] : []), { referenceFrameworkIsNil: true }] }
      }
      if (key === 'reviewStatusIn') {
        return { hasReviewsWith: [{ statusIn: value, hasProgramsWith: [{ id: programId }] }] } as ControlWhereInput
      }
      if (key === 'evidenceStatusIn') {
        return { hasEvidenceWith: [{ statusIn: value, hasProgramsWith: [{ id: programId }] }] } as ControlWhereInput
      }
      return { [key]: value } as ControlWhereInput
    })

    const base: ControlWhereInput = { hasProgramsWith: [{ id: programId }], ...generated }
    if (debouncedSearch) {
      base.and = [...(base.and ?? []), { or: [{ refCodeContainsFold: debouncedSearch }, { titleContainsFold: debouncedSearch }] }]
    }
    return base
  }, [programId, filters, debouncedSearch])

  const { controls, paginationMeta, isLoading, isFetching } = useGetAuditorDashboardControls({ programId, where, pagination })

  const rows = useMemo<AuditorDashboardControlRow[]>(
    () =>
      controls.map((control) => {
        const reviews = (control.reviews?.edges ?? []).flatMap((edge) => (edge?.node ? [{ id: edge.node.id, status: edge.node.status, reviewedAt: edge.node.reviewedAt }] : []))
        const evidenceItems = (control.evidence?.edges ?? []).flatMap((edge) => (edge?.node ? [edge.node] : []))
        const linkedPolicies = (control.internalPolicies?.edges ?? []).flatMap((edge) => (edge?.node ? [edge.node] : []))
        return {
          ...control,
          evidenceItems,
          linkedPolicies,
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
        onRequestInfo: setRequestInfoControl,
      }),
    [canCreateReview],
  )

  const mappedColumns = useMemo(() => getAuditorDashboardMappedColumns(columns), [columns])

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
          <TableFilter filterFields={filterFields} onFilterChange={setFilters} pageKey={TableKeyEnum.AUDITOR_DASHBOARD_CONTROLS} quickFilters={quickFilters} />
          <ColumnVisibilityMenu mappedColumns={mappedColumns} columnVisibility={columnVisibility} setColumnVisibility={setColumnVisibility} storageKey={TableKeyEnum.AUDITOR_DASHBOARD_CONTROLS} />
          <BulkCSVCreateEvidenceDialog
            trigger={
              <Button variant="secondary" icon={<Upload size={16} />} iconPosition="left">
                Bulk Evidence Request
              </Button>
            }
          />
          <ExportEvidenceDialog
            filters={exportFilters}
            trigger={
              <Button variant="secondary" icon={<Download size={16} />} iconPosition="left">
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
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
        tableKey={TableKeyEnum.AUDITOR_DASHBOARD_CONTROLS}
      />

      <CreateControlReviewSheet open={!!startReviewControlId} onOpenChange={(next) => !next && handleReviewSheetClose()} controlId={startReviewControlId ?? ''} programId={programId} />
      {openReviewId && <ViewReviewSheet entityId={openReviewId} onClose={handleReviewSheetClose} />}
      <RequestInfoSheet controlId={requestInfoControl?.id ?? null} refCode={requestInfoControl?.refCode} onClose={() => setRequestInfoControl(null)} />
      <EvidenceDetailsSheet />
    </div>
  )
}
