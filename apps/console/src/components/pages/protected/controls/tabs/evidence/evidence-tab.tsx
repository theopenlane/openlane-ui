import React from 'react'
import ControlEvidenceTable from './evidence-table'
import { Card } from '@repo/ui/cardpanel'
import type { TFormEvidenceData } from '@/components/pages/protected/evidence/types/TFormEvidenceData.ts'

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

const EvidenceTab: React.FC<EvidenceTabProps> = ({ evidenceFormData, evidenceRequests, subcontrolIds }) => {
  const hasEvidenceRequests = Array.isArray(evidenceRequests) ? evidenceRequests.length > 0 : !!evidenceRequests

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

  return (
    <div className="space-y-6 mt-6">
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
