import React from 'react'
import ControlEvidenceTable from '@/components/pages/protected/controls/tabs/tables/evidence-table'
import { Card } from '@repo/ui/cardpanel'
import type { TFormEvidenceData } from '@/components/pages/protected/evidence/types/TFormEvidenceData.ts'

interface ExampleEvidence {
  documentationType: string
  description: string
}

interface EvidenceTabProps {
  evidenceFormData: TFormEvidenceData
  exampleEvidence?: ExampleEvidence[] | string | null
  subcontrolIds?: string[]
}

const EvidenceTab: React.FC<EvidenceTabProps> = ({ evidenceFormData, exampleEvidence, subcontrolIds }) => {
  const hasExampleEvidence = Array.isArray(exampleEvidence) ? exampleEvidence.length > 0 : !!exampleEvidence

  const renderExampleEvidence = () => {
    if (!hasExampleEvidence) return null

    if (Array.isArray(exampleEvidence)) {
      return (
        <ul className="rich-text text-sm text-muted-foreground space-y-2">
          {(exampleEvidence as ExampleEvidence[]).map((item, i) => (
            <li key={i}>
              <p className="font-medium">{item.documentationType}</p>
              <div className="rich-text" dangerouslySetInnerHTML={{ __html: item.description }} />
            </li>
          ))}
        </ul>
      )
    }

    return (
      <div
        className="rich-text text-sm text-muted-foreground"
        dangerouslySetInnerHTML={{
          __html: typeof exampleEvidence === 'string' ? exampleEvidence : '',
        }}
      />
    )
  }

  return (
    <div className="space-y-6 mt-6">
      <ControlEvidenceTable control={evidenceFormData} subcontrolIds={subcontrolIds} />
      {hasExampleEvidence && (
        <Card className="p-4">
          <h3 className="text-base font-semibold mb-2">Evidence examples</h3>
          {renderExampleEvidence()}
        </Card>
      )}
    </div>
  )
}

export default EvidenceTab
