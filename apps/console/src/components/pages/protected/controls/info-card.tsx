'use client'

import React from 'react'
import { Card } from '@repo/ui/cardpanel'
import { PanelRightOpenIcon } from 'lucide-react'
import { Button } from '@repo/ui/button'

interface InfoCardWithSheetProps {
  implementationGuidance: { referenceId: string; guidance: string[] }[] | null | undefined
  exampleEvidence: string | string[] | null | undefined
  controlQuestions: string[] | null | undefined
  assessmentMethods: string | string[] | null | undefined
  assessmentObjectives: string | string[] | null | undefined
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
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            {exampleEvidence.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">{exampleEvidence || 'No example evidence provided.'}</p>
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
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            {assessmentMethods.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">{assessmentMethods || 'No assessment methods provided.'}</p>
        ),
    },
    {
      label: 'Assessment objectives',
      hasData: Array.isArray(assessmentObjectives) ? assessmentObjectives.length > 0 : !!assessmentObjectives,
      render: () =>
        Array.isArray(assessmentObjectives) ? (
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            {assessmentObjectives.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">{assessmentObjectives || 'No assessment objectives provided.'}</p>
        ),
    },
  ]

  return (
    <Card className="p-4 bg-muted rounded-xl shadow-sm">
      <h3 className="text-lg font-medium mb-4">Info</h3>
      <div>
        {infoItems.map((item, index) => (
          <InfoRow key={item.label} label={item.label} isFirst={index === 0} onClick={() => showInfoDetails(item.label, item.render())} showButton={item.hasData} />
        ))}
      </div>
    </Card>
  )
}

export default InfoCardWithSheet

const InfoRow: React.FC<{ label: string; isFirst?: boolean; onClick: () => void; showButton: boolean }> = ({ label, isFirst, onClick, showButton }) => (
  <div className={`flex items-center justify-between m-0 py-2.5 ${!isFirst ? 'border-t border-border' : ''}`}>
    <span className="text-sm">{label}</span>
    {showButton && (
      <Button type="button" className="h-8 !px-2" variant="outline" icon={<PanelRightOpenIcon size={16} />} iconPosition="left" onClick={onClick}>
        Show
      </Button>
    )}
  </div>
)
