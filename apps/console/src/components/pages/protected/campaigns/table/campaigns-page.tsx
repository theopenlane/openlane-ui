'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import CampaignTableToolbar from '@/components/pages/protected/campaigns/table/campaigns-table-toolbar'
import { CampaignOrderField, ExportExportFormat, ExportExportType, OrderDirection, type CampaignWhereInput } from '@repo/codegen/src/schema'
import { getCampaignColumns } from '@/components/pages/protected/campaigns/table/columns'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { type VisibilityState } from '@tanstack/react-table'
import CampaignsTable from '@/components/pages/protected/campaigns/table/campaigns-table'
import { useDebounce } from '@uidotdev/usehooks'

import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { canEdit } from '@/lib/authz/utils'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { whereGenerator } from '@/components/shared/table-filter/where-generator'
import { getInitialVisibility } from '@/components/shared/column-visibility-menu/column-visibility-menu'
import { useOrgTablePagination, useOrgTableSort } from '@/hooks/use-org-table-state'
import { TableKeyEnum } from '@repo/ui/table-key'
import { useStorageSearch } from '@/hooks/useStorageSearch'
import { ObjectTypes } from '@repo/codegen/src/type-names'

import { CreateCampaignSheet } from '@/components/pages/protected/campaigns/create/create-campaign-sheet'
import CampaignsSummary from '@/components/pages/protected/campaigns/summary/campaigns-summary'
import CampaignsEmptyState from '@/components/pages/protected/campaigns/campaigns-empty/campaigns-empty-state'
import { useCampaignSummary, type TCampaignSummaryScope } from '@/lib/graphql-hooks/campaign'
import { useNotification } from '@/hooks/useNotification'
import useFileExport from '@/components/shared/export/use-file-export.ts'

const CampaignsPage: React.FC = () => {
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false)
  const [summaryScope, setSummaryScope] = useState<TCampaignSummaryScope | null>(null)
  const [searchQuery, setSearchQuery] = useStorageSearch(ObjectTypes.CAMPAIGN)
  const [filters, setFilters] = useState<CampaignWhereInput | null>(null)
  const [pagination, setPagination, resetPagination] = useOrgTablePagination(DEFAULT_PAGINATION, TableKeyEnum.CAMPAIGN)
  const { setCrumbs } = React.use(BreadcrumbContext)
  const { data: permission } = useOrganizationRoles()
  const { errorNotification } = useNotification()
  const { handleExport } = useFileExport()

  const [orderBy, setOrderBy] = useOrgTableSort(TableKeyEnum.CAMPAIGN, CampaignOrderField, [
    {
      field: CampaignOrderField.due_date,
      direction: OrderDirection.ASC,
    },
  ])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() =>
    getInitialVisibility(TableKeyEnum.CAMPAIGN, {
      displayID: false,
      createdAt: false,
      createdBy: false,
      updatedAt: false,
      updatedBy: false,
      completedAt: false,
      tags: false,
    }),
  )

  const debouncedSearch = useDebounce(searchQuery, 300)
  const searching = searchQuery !== debouncedSearch
  const [hasCampaigns, setHasCampaigns] = useState(false)
  const [selectedCampaigns, setSelectedCampaigns] = useState<{ id: string }[]>([])

  const { summary, scopeFilters, error: summaryError } = useCampaignSummary()

  const whereFilter = useMemo(() => {
    if (!filters) return null

    const result = whereGenerator<CampaignWhereInput>(filters, (key, value) => {
      return { [key]: value } as CampaignWhereInput
    })

    const merged: CampaignWhereInput = {
      ...result,
    }

    if (debouncedSearch) {
      merged.and = [...(merged.and || []), { or: [{ nameContainsFold: debouncedSearch }] }]
    }

    const scopeFilter = summaryScope ? scopeFilters[summaryScope] : null

    if (scopeFilter) {
      merged.and = [...(merged.and || []), scopeFilter]
    }

    return merged
  }, [filters, debouncedSearch, summaryScope, scopeFilters])

  useEffect(() => {
    if (summaryError) {
      errorNotification({
        title: 'Error',
        description: 'Failed to load campaign summary',
      })
    }
  }, [summaryError, errorNotification])

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Automation', href: '/automation/campaigns' },
      { label: 'Campaigns', href: '/automation/campaigns' },
    ])
  }, [setCrumbs])

  const mappedColumns = useMemo(() => {
    const emptyUserMap = {}
    return getCampaignColumns({
      userMap: emptyUserMap,
      selectedCampaigns,
      setSelectedCampaigns,
    })
      .filter((column): column is { accessorKey: string; header: string; meta: { exportPrefix?: string } } => 'accessorKey' in column && true && typeof column.header === 'string')
      .map((column) => ({
        accessorKey: column.accessorKey,
        header: column.header,
        meta: column.meta,
      }))
  }, [selectedCampaigns, setSelectedCampaigns])

  const handleExportFile = () => {
    if (!hasCampaigns) {
      return
    }

    handleExport({
      exportType: ExportExportType.CAMPAIGN,
      filters: JSON.stringify(whereFilter),
      fields: mappedColumns.filter((column) => columnVisibility[column.accessorKey] !== false).map((column) => column.meta?.exportPrefix ?? column.accessorKey),
      format: ExportExportFormat.CSV,
    })
  }

  const handleClearSelectedCampaigns = () => {
    setSelectedCampaigns([])
  }

  const handleScopeChange = useCallback(
    (scope: TCampaignSummaryScope | null) => {
      setSummaryScope(scope)
      resetPagination()
    },
    [resetPagination],
  )

  return (
    <>
      {summary &&
        (summary.totalCampaignCount === 0 ? (
          <CampaignsEmptyState onCreateCampaign={() => setIsCreateSheetOpen(true)} />
        ) : (
          <CampaignsSummary summary={summary} activeScope={summaryScope} onScopeChange={handleScopeChange} />
        ))}
      <CampaignTableToolbar
        onFilterChange={setFilters}
        handleClearSelectedCampaigns={handleClearSelectedCampaigns}
        handleExport={handleExportFile}
        mappedColumns={mappedColumns}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
        searchTerm={searchQuery}
        setSearchTerm={(val) => {
          setSearchQuery(val)
          resetPagination()
        }}
        searching={searching}
        exportEnabled={hasCampaigns}
        canEdit={canEdit}
        permission={permission}
        selectedCampaigns={selectedCampaigns}
        setSelectedCampaigns={setSelectedCampaigns}
        onCreateCampaign={() => setIsCreateSheetOpen(true)}
        additionalActiveFilterCount={summaryScope ? 1 : 0}
      />
      <CampaignsTable
        orderByFilter={orderBy || undefined}
        pagination={pagination}
        onPaginationChange={setPagination}
        whereFilter={whereFilter}
        onSortChange={setOrderBy}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
        onHasCampaignsChange={setHasCampaigns}
        selectedCampaigns={selectedCampaigns}
        setSelectedCampaigns={setSelectedCampaigns}
        canEdit={canEdit}
        defaultSorting={orderBy}
        permission={permission}
      />
      <CreateCampaignSheet open={isCreateSheetOpen} onClose={() => setIsCreateSheetOpen(false)} />
    </>
  )
}

export default CampaignsPage
