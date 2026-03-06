'use client'

import React from 'react'
import AssetsTable from './assets-table'
import ScansTable from './scans-table'
import { useAssetsWithFilter } from '@/lib/graphql-hooks/asset'
import { useScansWithFilter } from '@/lib/graphql-hooks/scan'
import type { AssetWhereInput, ScanWhereInput } from '@repo/codegen/src/schema'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { TableSkeleton } from '@/components/shared/skeleton/table-skeleton'
import EmptyTabState from '@/components/pages/protected/controls/tabs/shared/empty-tab-state'

type AssetsScansTabProps = {
  controlId?: string
  subcontrolIds: string[]
}

const AssetsScansTab: React.FC<AssetsScansTabProps> = ({ controlId, subcontrolIds }) => {
  const hasAssociationTarget = Boolean(controlId) || subcontrolIds.length > 0

  const assetsWhere: AssetWhereInput | undefined = controlId ? { hasControlsWith: [{ id: controlId }] } : undefined

  const scansWhere: ScanWhereInput | undefined = controlId ? { hasControlsWith: [{ id: controlId }] } : undefined

  const { data: assetsData, isLoading: isAssetsLoading } = useAssetsWithFilter({
    where: assetsWhere,
    pagination: DEFAULT_PAGINATION,
    enabled: hasAssociationTarget && Boolean(controlId),
  })

  const { data: scansData, isLoading: isScansLoading } = useScansWithFilter({
    where: scansWhere,
    pagination: DEFAULT_PAGINATION,
    enabled: hasAssociationTarget && Boolean(controlId),
  })

  if (!hasAssociationTarget) {
    return null
  }

  const isLoading = isAssetsLoading || isScansLoading
  const hasData = (assetsData?.assets?.totalCount ?? 0) > 0 || (scansData?.scans?.totalCount ?? 0) > 0

  if (isLoading) {
    return <TableSkeleton />
  }

  if (!hasData) {
    return <EmptyTabState description="Link relevant assets and scans to show what this control protects. Linked items will appear here." />
  }

  return (
    <div className="space-y-6">
      <AssetsTable controlId={controlId} />
      <ScansTable controlId={controlId} />
    </div>
  )
}

export default AssetsScansTab
