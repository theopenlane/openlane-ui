'use client'

import React, { useMemo } from 'react'
import PoliciesTable from './policies-table'
import ProceduresTable from './procedures-table'
import { useDocumentationPolicies, useDocumentationProcedures } from '@/lib/graphql-hooks/documentation'
import { buildAssociationFilter } from '@/components/pages/protected/controls/tabs/shared/documentation-shared'
import { mergeWhere } from '@/components/shared/crud-base/tabs/shared'
import { InternalPolicyDocumentStatus, ProcedureDocumentStatus, type InternalPolicyWhereInput, type ProcedureWhereInput } from '@repo/codegen/src/schema'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { TableSkeleton } from '@/components/shared/skeleton/table-skeleton'
import EmptyTabState from '@/components/shared/crud-base/tabs/empty-tab-state'
import type { EntityRef } from '@/lib/graphql-hooks/use-mapped-entity-refs'
import { SuggestedPolicies, type TSuggestedPoliciesData } from '@/components/pages/protected/controls/suggested-policies'

type DocumentationTabProps = {
  controlId?: string
  subcontrolIds: string[]
  canEdit: boolean
  isSubcontrol?: boolean
  suggestedPolicies?: TSuggestedPoliciesData | null
  mappedControlRefs?: EntityRef[]
  mappedSubcontrolRefs?: EntityRef[]
}

const DocumentationTab: React.FC<DocumentationTabProps> = ({ controlId, subcontrolIds, canEdit, isSubcontrol = false, suggestedPolicies, mappedControlRefs = [], mappedSubcontrolRefs = [] }) => {
  const hasAssociationTarget = Boolean(controlId) || subcontrolIds.length > 0

  const associationFilter = useMemo(
    () => buildAssociationFilter(controlId, subcontrolIds, isSubcontrol ? [] : mappedControlRefs, isSubcontrol ? [] : mappedSubcontrolRefs),
    [controlId, subcontrolIds, isSubcontrol, mappedControlRefs, mappedSubcontrolRefs],
  )

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
    return (
      <div className="space-y-6">
        {suggestedPolicies !== undefined && <SuggestedPolicies data={suggestedPolicies} />}
        <EmptyTabState description="Link relevant policies and procedures to show how this control is governed. Linked documents will appear here." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {suggestedPolicies !== undefined && <SuggestedPolicies data={suggestedPolicies} />}
      <ProceduresTable
        controlId={controlId}
        subcontrolIds={subcontrolIds}
        canEdit={canEdit}
        isSubcontrol={isSubcontrol}
        mappedControlRefs={mappedControlRefs}
        mappedSubcontrolRefs={mappedSubcontrolRefs}
      />
      <PoliciesTable
        controlId={controlId}
        subcontrolIds={subcontrolIds}
        canEdit={canEdit}
        isSubcontrol={isSubcontrol}
        mappedControlRefs={mappedControlRefs}
        mappedSubcontrolRefs={mappedSubcontrolRefs}
      />
    </div>
  )
}

export default DocumentationTab
