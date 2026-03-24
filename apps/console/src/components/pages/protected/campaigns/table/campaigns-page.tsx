'use client'

import React, { useEffect, useMemo, useState } from 'react'
import CampaignTableToolbar from '@/components/pages/protected/campaigns/table/campaigns-table-toolbar'
import { CampaignOrderField, OrderDirection, type CampaignWhereInput, type CampaignsWithFilterQueryVariables } from '@repo/codegen/src/schema'
import { getCampaignColumns } from '@/components/pages/protected/campaigns/table/columns'
import { type TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { type ColumnDef, type VisibilityState } from '@tanstack/react-table'
import CampaignsTable from '@/components/pages/protected/campaigns/table/campaigns-table'
import { useDebounce } from '@uidotdev/usehooks'
import { useSearchParams } from 'next/navigation'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { canEdit } from '@/lib/authz/utils'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { whereGenerator } from '@/components/shared/table-filter/where-generator'
import { getInitialVisibility } from '@/components/shared/column-visibility-menu/column-visibility-menu'
import { getInitialSortConditions, getInitialPagination } from '@repo/ui/data-table'
import { TableKeyEnum } from '@repo/ui/table-key'
import { useStorageSearch } from '@/hooks/useStorageSearch'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { type CampaignsNodeNonNull } from '@/lib/graphql-hooks/campaign'
import { CreateCampaignSheet } from '@/components/pages/protected/campaigns/create/create-campaign-sheet'

const CampaignsPage: React.FC = () => {
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useStorageSearch(ObjectTypes.CAMPAIGN)
  const [filters, setFilters] = useState<CampaignWhereInput | null>(null)
  const [pagination, setPagination] = useState<TPagination>(() => getInitialPagination(TableKeyEnum.CAMPAIGN, DEFAULT_PAGINATION))
  const searchParams = useSearchParams()
  const { setCrumbs } = React.use(BreadcrumbContext)
  const { data: permission } = useOrganizationRoles()

  const defaultSorting = getInitialSortConditions(TableKeyEnum.CAMPAIGN, CampaignOrderField, [
    {
      field: CampaignOrderField.due_date,
      direction: OrderDirection.ASC,
    },
  ])

  const [orderBy, setOrderBy] = useState<CampaignsWithFilterQueryVariables['orderBy']>(defaultSorting)
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() =>
    getInitialVisibility(TableKeyEnum.CAMPAIGN, {
      id: false,
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

    return merged
  }, [filters, debouncedSearch])

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Automation', href: '/automation/campaigns' },
      { label: 'Campaigns', href: '/automation/campaigns' },
    ])
  }, [setCrumbs])

  useEffect(() => {
    // Campaign detail is now handled by the [id] route page
  }, [searchParams])

  const mappedColumns = useMemo(() => {
    const emptyUserMap = {}
    return getCampaignColumns({
      userMap: emptyUserMap,
      selectedCampaigns,
      setSelectedCampaigns,
    })
      .filter(
        (column): column is { accessorKey: string; header: string; meta: { exportPrefix?: string } } =>
          'accessorKey' in column && typeof column.accessorKey === 'string' && typeof column.header === 'string',
      )
      .map((column) => ({
        accessorKey: column.accessorKey,
        header: column.header,
        meta: column.meta,
      }))
  }, [selectedCampaigns, setSelectedCampaigns])

  function isVisibleColumn<T>(col: ColumnDef<T>): col is ColumnDef<T> & { accessorKey: string; header: string } {
    return 'accessorKey' in col && typeof col.accessorKey === 'string' && typeof col.header === 'string' && columnVisibility[col.accessorKey] !== false
  }

  const handleExport = async () => {
    if (!hasCampaigns) {
      return
    }
    // Export will be supported when ExportExportType.CAMPAIGN is added to the backend
  }

  const handleClearSelectedCampaigns = () => {
    setSelectedCampaigns([])
  }

  return (
    <>
      <CampaignTableToolbar
        onFilterChange={setFilters}
        handleClearSelectedCampaigns={handleClearSelectedCampaigns}
        handleExport={handleExport}
        mappedColumns={mappedColumns}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
        searchTerm={searchQuery}
        setSearchTerm={(val) => {
          setSearchQuery(val)
          setPagination(DEFAULT_PAGINATION)
        }}
        searching={searching}
        exportEnabled={hasCampaigns}
        canEdit={canEdit}
        permission={permission}
        selectedCampaigns={selectedCampaigns}
        setSelectedCampaigns={setSelectedCampaigns}
        onCreateCampaign={() => setIsCreateSheetOpen(true)}
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
        defaultSorting={defaultSorting}
        permission={permission}
      />
      <CreateCampaignSheet open={isCreateSheetOpen} onClose={() => setIsCreateSheetOpen(false)} />
    </>
  )
}

export default CampaignsPage
