import React from 'react'
import ControlEvidenceTable from '@/components/pages/protected/evidence/evidence-table.tsx'
import { Card } from '@repo/ui/cardpanel'
import type { EvidenceEdge } from '@repo/codegen/src/schema.ts'

interface ExampleEvidence {
  documentationType: string
  description: string
}

interface EvidenceFormData {
  displayID?: string
  controlID: string
  controlRefCodes: string[]
  referenceFramework: Record<string, string>
  programDisplayIDs: string[]
  objectAssociations: {
    controlIDs: string[]
    programIDs: string[]
    controlObjectiveIDs: string[]
  }
  objectAssociationsDisplayIDs: string[]
}

interface EvidenceTabProps {
  evidenceFormData: EvidenceFormData
  evidences: EvidenceEdge[]
  exampleEvidence?: ExampleEvidence[] | string | null
}

const EvidenceTab: React.FC<EvidenceTabProps> = ({ evidenceFormData, evidences, exampleEvidence }) => {
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
      <ControlEvidenceTable control={evidenceFormData} evidences={evidences} />
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
