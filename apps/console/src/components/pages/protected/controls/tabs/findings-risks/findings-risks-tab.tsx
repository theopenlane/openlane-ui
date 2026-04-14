'use client'

import React, { useMemo } from 'react'
import FindingsTable from './findings-table'
import RisksTable from './risks-table'
import { useFindingsWithFilter } from '@/lib/graphql-hooks/finding'
import { useRisks } from '@/lib/graphql-hooks/risk'
import { buildAssociationFilter } from '@/components/pages/protected/controls/tabs/shared/documentation-shared'
import type { FindingWhereInput, RiskWhereInput } from '@repo/codegen/src/schema'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { TableSkeleton } from '@/components/shared/skeleton/table-skeleton'
import EmptyTabState from '@/components/shared/crud-base/tabs/empty-tab-state'

type FindingsRisksTabProps = {
  controlId?: string
  subcontrolIds: string[]
}

const FindingsRisksTab: React.FC<FindingsRisksTabProps> = ({ controlId, subcontrolIds }) => {
  const hasAssociationTarget = Boolean(controlId) || subcontrolIds.length > 0

  const associationFilter = useMemo(() => buildAssociationFilter(controlId, subcontrolIds), [controlId, subcontrolIds])

  const { data: findingsData, isLoading: isFindingsLoading } = useFindingsWithFilter({
    where: associationFilter as FindingWhereInput,
    pagination: DEFAULT_PAGINATION,
    enabled: hasAssociationTarget,
  })

  const { paginationMeta: risksPaginationMeta, isLoading: isRisksLoading } = useRisks({
    where: associationFilter as RiskWhereInput,
    pagination: DEFAULT_PAGINATION,
    enabled: hasAssociationTarget,
  })

  if (!hasAssociationTarget) {
    return null
  }

  const isLoading = isFindingsLoading || isRisksLoading
  const hasData = (findingsData?.findings?.totalCount ?? 0) > 0 || (risksPaginationMeta?.totalCount ?? 0) > 0

  if (isLoading) {
    return <TableSkeleton />
  }

  if (!hasData) {
    return <EmptyTabState description="Link relevant findings and risks to track issues associated with this control. Linked items will appear here." />
  }

  return (
    <div className="space-y-6">
      <FindingsTable controlId={controlId} subcontrolIds={subcontrolIds} />
      <RisksTable controlId={controlId} subcontrolIds={subcontrolIds} />
    </div>
  )
}

export default FindingsRisksTab
