'use client'

import React from 'react'
import { Card } from '@repo/ui/cardpanel'
import { PanelRightOpenIcon } from 'lucide-react'
import { Button } from '@repo/ui/button'

interface AssessmentMethod {
  id: string
  type: string
  method: string
}

interface AssessmentObjective {
  id: string
  class: string
  objective: string
}

interface ExampleEvidence {
  documentationType: string
  description: string
}

interface InfoCardWithSheetProps {
  implementationGuidance: { referenceId: string; guidance: string[] }[] | null | undefined
  exampleEvidence: string | ExampleEvidence[] | null | undefined
  controlQuestions: string[] | null | undefined
  assessmentMethods: AssessmentMethod[] | string | string[] | null | undefined
  assessmentObjectives: AssessmentObjective[] | string | string[] | null | undefined
  showInfoDetails: (title: string, content: React.ReactNode) => void
}

const InfoCardWithSheet: React.FC<InfoCardWithSheetProps> = ({ implementationGuidance, exampleEvidence, controlQuestions, assessmentMethods, assessmentObjectives, showInfoDetails }) => {
  const infoItems: {
    label: string
    hasData: boolean
    render: () => React.ReactNode
  }[] = [
    {
      label: 'Implementation guidance',
      hasData: !!implementationGuidance?.length,
      render: () => (
        <div className="space-y-4">
          {implementationGuidance!.map(({ referenceId, guidance }) => (
            <div key={referenceId}>
              <p className="font-medium mb-1">{referenceId}</p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                {guidance.map((g, i) => (
                  <li key={i}>{g.trim()}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ),
    },
    {
      label: 'Example evidence',
      hasData: Array.isArray(exampleEvidence) ? exampleEvidence.length > 0 : !!exampleEvidence,
      render: () =>
        Array.isArray(exampleEvidence) ? (
          <ul className="list-none text-sm text-muted-foreground space-y-3">
            {exampleEvidence.map((item, i) => (
              <li key={i}>
                <p className="font-medium">{item.documentationType}</p>
                <p className="text-muted-foreground">{item.description}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">{typeof exampleEvidence === 'string' ? exampleEvidence : 'No example evidence provided.'}</p>
        ),
    },
    {
      label: 'Control questions',
      hasData: !!controlQuestions?.length,
      render: () =>
        controlQuestions?.length ? (
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            {controlQuestions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No control questions.</p>
        ),
    },
    {
      label: 'Assessment methods',
      hasData: Array.isArray(assessmentMethods) ? assessmentMethods.length > 0 : !!assessmentMethods,
      render: () =>
        Array.isArray(assessmentMethods) ? (
          <div className="space-y-4">
            {assessmentMethods.map((item, i) =>
              typeof item === 'string' ? (
                <ul key={i} className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>{item}</li>
                </ul>
              ) : (
                <div key={item.id}>
                  <p className="font-medium mb-1">{item.type}</p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    {item.method.split(/<br\s*\/?>/i).map((line, idx) => line.trim() && <li key={idx}>{line.trim()}</li>)}
                  </ul>
                </div>
              ),
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{assessmentMethods || 'No assessment methods provided.'}</p>
        ),
    },
    {
      label: 'Assessment objectives',
      hasData: Array.isArray(assessmentObjectives) ? assessmentObjectives.length > 0 : !!assessmentObjectives,
      render: () =>
        Array.isArray(assessmentObjectives) ? (
          <div className="space-y-4">
            {assessmentObjectives.map((item, i) =>
              typeof item === 'string' ? (
                <ul key={i} className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>{item}</li>
                </ul>
              ) : (
                <div key={item.id}>
                  <p className="font-medium mb-1">{item.id}</p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    {item.objective.split(/<br\s*\/?>/i).map((line, idx) => line.trim() && <li key={idx}>{line.trim()}</li>)}
                  </ul>
                </div>
              ),
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{assessmentObjectives || 'No assessment objectives provided.'}</p>
        ),
    },
  ]

  return (
    <Card className="p-4 bg-muted rounded-xl shadow-sm">
      <h3 className="text-lg font-medium mb-4">Info</h3>
      <div>
        {infoItems
          .filter((item) => item.hasData)
          .map((item, index) => (
            <InfoRow key={item.label} label={item.label} isFirst={index === 0} onClick={() => showInfoDetails(item.label, item.render())} />
          ))}
      </div>
    </Card>
  )
}

export default InfoCardWithSheet

const InfoRow: React.FC<{ label: string; isFirst?: boolean; onClick: () => void }> = ({ label, isFirst, onClick }) => (
  <div className={`flex items-center justify-between m-0 py-2.5 ${!isFirst ? 'border-t border-border' : ''}`}>
    <span className="text-sm">{label}</span>
    <Button type="button" className="h-8 !px-2" variant="outline" icon={<PanelRightOpenIcon size={16} />} iconPosition="left" onClick={onClick}>
      Show
    </Button>
  </div>
)
