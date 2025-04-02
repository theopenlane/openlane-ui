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
  const infoItems = ['Implementation guidance', 'Example evidence', 'Control questions', 'Assessment methods', 'Assessment objectives']

  const handleClick = (label: string) => {
    switch (label) {
      case 'Implementation guidance':
        showInfoDetails(
          label,
          <div className="space-y-4">
            {implementationGuidance?.map(({ referenceId, guidance }) => (
              <div key={referenceId}>
                <p className="font-medium mb-1">{referenceId}</p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  {guidance.map((g, i) => (
                    <li key={i}>{g.trim()}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>,
        )
        break
      case 'Example evidence':
        showInfoDetails(
          label,
          Array.isArray(exampleEvidence) ? (
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              {exampleEvidence.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">{exampleEvidence || 'No example evidence provided.'}</p>
          ),
        )
        break
      case 'Control questions':
        showInfoDetails(label, <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">{controlQuestions?.map((q, i) => <li key={i}>{q}</li>) || 'No control questions.'}</ul>)
        break
      case 'Assessment methods':
        showInfoDetails(
          label,
          Array.isArray(assessmentMethods) ? (
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              {assessmentMethods.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">{assessmentMethods || 'No assessment methods provided.'}</p>
          ),
        )
        break
      case 'Assessment objectives':
        showInfoDetails(
          label,
          Array.isArray(assessmentObjectives) ? (
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              {assessmentObjectives.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">{assessmentObjectives || 'No assessment objectives provided.'}</p>
          ),
        )
        break
      default:
        break
    }
  }

  return (
    <Card className="p-4 bg-muted rounded-xl shadow-sm">
      <h3 className="text-lg font-medium mb-4">Info</h3>
      <div className="space-y-2">
        {infoItems.map((label, index) => (
          <InfoRow key={label} label={label} isFirst={index === 0} onClick={() => handleClick(label)} />
        ))}
      </div>
    </Card>
  )
}

export default InfoCardWithSheet

const InfoRow: React.FC<{ label: string; isFirst?: boolean; onClick: () => void }> = ({ label, isFirst, onClick }) => (
  <div className={`flex items-center justify-between px-2 py-2 ${!isFirst ? 'border-t border-border' : ''}`}>
    <span className="text-sm">{label}</span>
    <Button variant="outline" icon={<PanelRightOpenIcon size={16} />} iconPosition="left" onClick={onClick}>
      Show
    </Button>
  </div>
)
