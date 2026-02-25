import React from 'react'
import ControlEvidenceTable from './evidence-table'
import { Card } from '@repo/ui/cardpanel'
import type { TFormEvidenceData } from '@/components/pages/protected/evidence/types/TFormEvidenceData.ts'
import { TableSkeleton } from '@/components/shared/skeleton/table-skeleton'
import EmptyTabState from '@/components/pages/protected/controls/tabs/shared/empty-tab-state'
import { useGetEvidenceListLight } from '@/lib/graphql-hooks/evidence'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { EvidenceOrderField, OrderDirection, type EvidenceOrder, type EvidenceWhereInput } from '@repo/codegen/src/schema'

type EvidenceRequestItem = {
  evidenceRequestID?: string | null
  documentationArtifact?: string | null
  artifactDescription?: string | null
  areaOfFocus?: string | null
  documentationType?: string | null
  description?: string | null
}

interface EvidenceTabProps {
  evidenceFormData: TFormEvidenceData
  evidenceRequests?: EvidenceRequestItem[] | string | null
  subcontrolIds?: string[]
}

const buildAssociationFilter = (controlId?: string, subcontrolIds?: string[]) => {
  if (controlId && subcontrolIds && subcontrolIds.length > 0) {
    return {
      or: [{ hasControlsWith: [{ id: controlId }] }, { hasSubcontrolsWith: [{ idIn: subcontrolIds }] }],
    }
  }

  if (controlId) {
    return { hasControlsWith: [{ id: controlId }] }
  }

  if (subcontrolIds && subcontrolIds.length > 0) {
    return { hasSubcontrolsWith: [{ idIn: subcontrolIds }] }
  }

  return {}
}

const EvidenceTab: React.FC<EvidenceTabProps> = ({ evidenceFormData, evidenceRequests, subcontrolIds }) => {
  const hasEvidenceRequests = Array.isArray(evidenceRequests) ? evidenceRequests.length > 0 : !!evidenceRequests

  const baselineWhere = React.useMemo<EvidenceWhereInput>(() => {
    if (evidenceFormData.subcontrolID) {
      return buildAssociationFilter(undefined, [evidenceFormData.subcontrolID]) as EvidenceWhereInput
    }

    return buildAssociationFilter(evidenceFormData.controlID, subcontrolIds) as EvidenceWhereInput
  }, [evidenceFormData.controlID, evidenceFormData.subcontrolID, subcontrolIds])

  const baselineOrderBy = React.useMemo<EvidenceOrder[]>(() => [{ field: EvidenceOrderField.updated_at, direction: OrderDirection.DESC }], [])

  const { paginationMeta, isLoading } = useGetEvidenceListLight({
    where: baselineWhere,
    orderBy: baselineOrderBy,
    pagination: DEFAULT_PAGINATION,
    enabled: Boolean(evidenceFormData.controlID || evidenceFormData.subcontrolID),
  })

  const hasEvidenceRows = (paginationMeta?.totalCount ?? 0) > 0

  const renderEvidenceRequests = () => {
    if (!hasEvidenceRequests) return null

    if (Array.isArray(evidenceRequests)) {
      return (
        <ul className="rich-text text-sm text-muted-foreground">
          {(evidenceRequests as EvidenceRequestItem[]).map((item, i) => (
            <li key={i}>
              <p className="font-medium">{item.documentationType ?? item.documentationArtifact ?? item.evidenceRequestID ?? 'Untitled'}</p>
              <div className="rich-text" dangerouslySetInnerHTML={{ __html: item.description ?? item.artifactDescription ?? '' }} />
            </li>
          ))}
        </ul>
      )
    }

    return <div className="rich-text text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: String(evidenceRequests) }} />
  }

  if (isLoading) {
    return <TableSkeleton />
  }

  if (!hasEvidenceRows && !hasEvidenceRequests) {
    return <EmptyTabState description="To begin documenting evidence for this control, add supporting files or links. Once added, they’ll appear here." />
  }

  if (!hasEvidenceRows && hasEvidenceRequests) {
    return (
      <div className="space-y-6">
        <Card className="p-4">
          <h3 className="text-base font-semibold mb-2">Evidence Items</h3>
          {renderEvidenceRequests()}
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ControlEvidenceTable control={evidenceFormData} subcontrolIds={subcontrolIds} />
      {hasEvidenceRequests && (
        <Card className="p-4">
          <h3 className="text-base font-semibold mb-2">Evidence Items</h3>
          {renderEvidenceRequests()}
        </Card>
      )}
    </div>
  )
}

export default EvidenceTab
