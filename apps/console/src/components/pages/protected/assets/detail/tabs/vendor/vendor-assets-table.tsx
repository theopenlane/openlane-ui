'use client'

import React, { useMemo, useState } from 'react'
import { type ColumnDef } from '@repo/ui/table-types'
import { DataTable } from '@repo/ui/data-table'
import { type TPagination } from '@repo/ui/pagination-types'
import { CustomEnumChipCell } from '@/components/shared/crud-base/columns/custom-enum-chip-cell'
import ObjectSheetLink from '@/components/shared/object-sheet-link/object-sheet-link'
import { ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useQueryErrorNotification } from '@/hooks/useQueryErrorNotification'
import { useVendorAssets, type VendorAssetNode } from '@/lib/graphql-hooks/asset-detail'
import { useOpenObjectSheet } from '@/providers/sheet-navigation-provider'
import { getAssetKindLabel, getAssetTitle } from '../../../asset-display'

const VendorAssetsTable: React.FC<{ vendorId: string; assetId: string }> = ({ vendorId, assetId }) => {
  const openObjectSheet = useOpenObjectSheet()
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)
  const where = useMemo(() => ({ hasEntitiesWith: [{ id: vendorId }], idNEQ: assetId }), [vendorId, assetId])
  const { assets, data, isPending, isFetching, error, hasExposureAccess } = useVendorAssets({ where, pagination })
  useQueryErrorNotification({ error, description: 'Failed to load assets' })

  const columns = useMemo<ColumnDef<VendorAssetNode>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Asset',
        size: 240,
        cell: ({ row }) => <ObjectSheetLink id={row.original.id} kind={ObjectAssociationNodeEnum.ASSET} label={getAssetTitle(row.original)} onOpenSheet={openObjectSheet} />,
      },
      { accessorKey: 'assetSubtypeName', header: 'Subtype', size: 150, cell: ({ row }) => getAssetKindLabel(row.original) },
      { accessorKey: 'environmentName', header: 'Environment', size: 150, cell: ({ row }) => <CustomEnumChipCell value={row.original.environmentName} field="environment" /> },
      ...(hasExposureAccess
        ? [
            {
              id: 'openExposure',
              header: 'Open exposure',
              size: 140,
              cell: ({ row }) => {
                const count = (row.original.openVulnerabilities?.totalCount ?? 0) + (row.original.openFindings?.totalCount ?? 0)
                return count > 0 ? count : <span className="text-muted-foreground">None</span>
              },
            } satisfies ColumnDef<VendorAssetNode>,
          ]
        : []),
    ],
    [openObjectSheet, hasExposureAccess],
  )

  return (
    <DataTable
      columns={columns}
      data={assets}
      loading={isPending}
      noResultsText="No other assets"
      pagination={pagination}
      onPaginationChange={setPagination}
      paginationMeta={{ totalCount: data?.assets.totalCount, pageInfo: data?.assets.pageInfo, isLoading: isFetching }}
      tableKey={undefined}
    />
  )
}

export default VendorAssetsTable
