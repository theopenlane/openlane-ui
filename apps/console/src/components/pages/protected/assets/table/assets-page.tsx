'use client'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import AssetTableToolbar from '@/components/pages/protected/assets/table/asset-table-toolbar'
import { ExportExportFormat, ExportExportType, OrderDirection, Asset, AssetOrderField, AssetsWithFilterQueryVariables, AssetWhereInput } from '@repo/codegen/src/schema'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { ColumnDef, VisibilityState } from '@tanstack/react-table'
import AssetsTable from '@/components/pages/protected/assets/table/assets-table.tsx'
import { useDebounce } from '@uidotdev/usehooks'
import { useSearchParams } from 'next/navigation'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext.tsx'
import { canEdit } from '@/lib/authz/utils.ts'
import useFileExport from '@/components/shared/export/use-file-export.ts'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { whereGenerator } from '@/components/shared/table-filter/where-generator'
import { getInitialVisibility } from '@/components/shared/column-visibility-menu/column-visibility-menu.tsx'
import { TableColumnVisibilityKeysEnum } from '@/components/shared/table-column-visibility/table-column-visibility-keys.ts'
import { getInitialSortConditions, getInitialPagination } from '@repo/ui/data-table'
import { TableKeyEnum } from '@repo/ui/table-key'
import { SearchKeyEnum, useStorageSearch } from '@/hooks/useStorageSearch'
import { getAssetColumns } from './columns'

const AssetPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useStorageSearch(SearchKeyEnum.ASSETS)
  const tableRef = useRef<{ exportData: () => Asset[] }>(null)
  const [filters, setFilters] = useState<AssetWhereInput | null>(null)
  const [pagination, setPagination] = useState<TPagination>(getInitialPagination(TableKeyEnum.ASSET, DEFAULT_PAGINATION))
  const searchParams = useSearchParams()
  const { setCrumbs } = React.useContext(BreadcrumbContext)
  const { handleExport } = useFileExport()
  const defaultSorting = getInitialSortConditions(TableKeyEnum.ASSET, AssetOrderField, [
    {
      field: AssetOrderField.name,
      direction: OrderDirection.ASC,
    },
  ])

  const [orderBy, setOrderBy] = useState<AssetsWithFilterQueryVariables['orderBy']>(defaultSorting)
  const { data: permission } = useOrganizationRoles()
  const defaultVisibility: VisibilityState = {
    id: false,
    name: true,
    internalOwner: false,
    internalOwnerGroup: false,
    internalOwnerUser: false,
    accessModelName: false,
    assetDataClassificationName: false,
    assetSubtypeName: false,
    assetType: false,
    containsPii: true,
    costCenter: false,
    cpe: false,
    createdAt: false,
    createdBy: false,
    updatedAt: true,
    updatedBy: true,
    criticalityName: false,
    description: true,
    encryptionStatusName: false,
    environmentName: true,
    estimatedMonthlyCost: false,
    identifier: false,
    physicalLocation: false,
    purchaseDate: false,
    region: false,
    scopeName: false,
    securityTierName: false,
    sourceIdentifier: false,
    sourceType: false,
    tags: false,
    website: false,
  }

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => getInitialVisibility(TableColumnVisibilityKeysEnum.ASSET, defaultVisibility))

  const debouncedSearch = useDebounce(searchQuery, 300)
  const searching = searchQuery !== debouncedSearch
  const [hasAssets, setHasAssets] = useState(false)
  const [selectedAssets, setSelectedAssets] = useState<{ id: string }[]>([])

  const whereFilter = useMemo(() => {
    if (!filters) return null

    let base = {
      titleContainsFold: debouncedSearch,
    }

    const result = whereGenerator<AssetWhereInput>(filters, (key, value) => {
      return { [key]: value } as AssetWhereInput
    })

    base = {
      ...base,
    }

    return { ...base, ...result }
  }, [filters, debouncedSearch])

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Assets', href: '/assets' },
    ])
  }, [setCrumbs])

  useEffect(() => {
    const assetId = searchParams.get('id')
    if (assetId) {
      setSelectedAsset(assetId)
    }
  }, [searchParams])

  const orderByFilter = useMemo(() => {
    return orderBy || undefined
  }, [orderBy])

  const emptyUserMap = {}
  const mappedColumns: { accessorKey: string; header: string; meta: { exportPrefix?: string } }[] = getAssetColumns({ userMap: emptyUserMap, selectedAssets, setSelectedAssets })
    .filter(
      (column): column is { accessorKey: string; header: string; meta: { exportPrefix?: string } } =>
        'accessorKey' in column && typeof column.accessorKey === 'string' && typeof column.header === 'string',
    )
    .map((column) => ({
      accessorKey: column.accessorKey,
      header: column.header,
      meta: column.meta,
    }))

  function isVisibleColumn<T>(col: ColumnDef<T>): col is ColumnDef<T> & { accessorKey: string; header: string } {
    return 'accessorKey' in col && typeof col.accessorKey === 'string' && typeof col.header === 'string' && columnVisibility[col.accessorKey] !== false
  }

  const handleExportFile = async () => {
    if (!hasAssets) {
      return
    }

    handleExport({
      exportType: ExportExportType.CONTROL,
      filters: JSON.stringify(whereFilter),
      fields: mappedColumns.filter(isVisibleColumn).map((item) => (item.meta as { exportPrefix?: string })?.exportPrefix ?? item.accessorKey),
      format: ExportExportFormat.CSV,
    })
  }

  const handleClearSelectedAssets = () => {
    setSelectedAssets([])
  }

  return (
    <>
      <AssetTableToolbar
        onFilterChange={setFilters}
        handleClearSelectedAssets={handleClearSelectedAssets}
        handleExport={handleExportFile}
        mappedColumns={mappedColumns}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
        searchTerm={searchQuery}
        setSearchTerm={(val) => {
          setSearchQuery(val)
          setPagination(DEFAULT_PAGINATION)
        }}
        searching={searching}
        exportEnabled={hasAssets}
        canEdit={canEdit}
        permission={permission}
        selectedAssets={selectedAssets}
        setSelectedAssets={setSelectedAssets}
      />

      <AssetsTable
        ref={tableRef}
        orderByFilter={orderByFilter}
        pagination={pagination}
        onPaginationChange={setPagination}
        whereFilter={whereFilter}
        onSortChange={setOrderBy}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
        onHasAssetsChange={setHasAssets}
        selectedAssets={selectedAssets}
        setSelectedAssets={setSelectedAssets}
        canEdit={canEdit}
        defaultSorting={defaultSorting}
        permission={permission}
      />
    </>
  )
}

export default AssetPage
