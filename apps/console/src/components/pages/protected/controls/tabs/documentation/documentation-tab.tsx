'use client'

import React, { useMemo } from 'react'
import PoliciesTable from './policies-table'
import ProceduresTable from './procedures-table'
import { useDocumentationPolicies, useDocumentationProcedures } from '@/lib/graphql-hooks/documentation'
import { buildAssociationFilter, mergeWhere } from '@/components/pages/protected/controls/tabs/shared/documentation-shared'
import { InternalPolicyDocumentStatus, ProcedureDocumentStatus, type InternalPolicyWhereInput, type ProcedureWhereInput } from '@repo/codegen/src/schema'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { TableSkeleton } from '@/components/shared/skeleton/table-skeleton'
import EmptyTabState from '@/components/pages/protected/controls/tabs/shared/empty-tab-state'

type DocumentationTabProps = {
  controlId?: string
  subcontrolIds: string[]
}

const DocumentationTab: React.FC<DocumentationTabProps> = ({ controlId, subcontrolIds }) => {
  const hasAssociationTarget = Boolean(controlId) || subcontrolIds.length > 0

  const associationFilter = useMemo(() => buildAssociationFilter(controlId, subcontrolIds), [controlId, subcontrolIds])

  const baselinePoliciesWhere = useMemo<InternalPolicyWhereInput>(
    () =>
      mergeWhere<InternalPolicyWhereInput>([
        associationFilter as InternalPolicyWhereInput,
        {
          statusNotIn: [InternalPolicyDocumentStatus.ARCHIVED],
        } as InternalPolicyWhereInput,
      ]),
    [associationFilter],
  )

  const baselineProceduresWhere = useMemo<ProcedureWhereInput>(
    () =>
      mergeWhere<ProcedureWhereInput>([
        associationFilter as ProcedureWhereInput,
        {
          statusNotIn: [ProcedureDocumentStatus.ARCHIVED],
        } as ProcedureWhereInput,
      ]),
    [associationFilter],
  )

  const { paginationMeta: policiesPaginationMeta, isLoading: isPoliciesLoading } = useDocumentationPolicies({
    where: baselinePoliciesWhere,
    pagination: DEFAULT_PAGINATION,
    enabled: hasAssociationTarget,
  })

  const { paginationMeta: proceduresPaginationMeta, isLoading: isProceduresLoading } = useDocumentationProcedures({
    where: baselineProceduresWhere,
    pagination: DEFAULT_PAGINATION,
    enabled: hasAssociationTarget,
  })

  if (!hasAssociationTarget) {
    return null
  }

  const isLoading = isPoliciesLoading || isProceduresLoading
  const hasData = (policiesPaginationMeta?.totalCount ?? 0) > 0 || (proceduresPaginationMeta?.totalCount ?? 0) > 0

  if (isLoading) {
    return <TableSkeleton />
  }

  if (!hasData) {
    return <EmptyTabState description="Link relevant policies and procedures to show how this control is governed. Linked documents will appear here." />
  }

  return (
    <div className="space-y-6">
      <ProceduresTable controlId={controlId} subcontrolIds={subcontrolIds} />
      <PoliciesTable controlId={controlId} subcontrolIds={subcontrolIds} />
    </div>
  )
}

export default DocumentationTab
