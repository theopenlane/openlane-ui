import React from 'react'
import { Card } from '@repo/ui/cardpanel'

interface ImplementationGuidance {
  referenceId: string
  guidance: string[]
}

interface AssessmentMethod {
  id: string
  method: string
}

interface AssessmentObjective {
  id: string
  objective: string
}

interface GuidanceTabProps {
  implementationGuidance?: ImplementationGuidance[] | null
  controlQuestions?: string[] | null
  assessmentMethods?: AssessmentMethod[] | string[] | null
  assessmentObjectives?: AssessmentObjective[] | string[] | null
}

const GuidanceTab: React.FC<GuidanceTabProps> = ({ implementationGuidance, controlQuestions, assessmentMethods, assessmentObjectives }) => {
  const guidanceItems: {
    label: string
    hasData: boolean
    render: () => React.ReactNode
  }[] = [
    {
      label: 'Implementation guidance',
      hasData: !!implementationGuidance?.length,
      render: () =>
        implementationGuidance?.length ? (
          <div className="space-y-4">
            {implementationGuidance.map(({ referenceId, guidance }) => (
              <div key={referenceId}>
                <ul className="rich-text text-sm text-muted-foreground">
                  {guidance.map((g, i) => (
                    <li key={i} dangerouslySetInnerHTML={{ __html: g.trim() }} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No implementation guidance provided.</p>
        ),
    },
    {
      label: 'Control questions',
      hasData: !!controlQuestions?.length,
      render: () =>
        controlQuestions?.length ? (
          <ul className="rich-text text-sm text-muted-foreground">
            {controlQuestions.map((q, i) => (
              <li key={i} dangerouslySetInnerHTML={{ __html: q }} />
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
            {(assessmentMethods as AssessmentMethod[] | string[]).map((item, i) =>
              typeof item === 'string' ? (
                <div key={i} className="rich-text text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: item }} />
              ) : (
                <div key={item.id}>
                  <p className="font-medium mb-1">{item.id}</p>
                  <div className="rich-text text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: item.method }} />
                </div>
              ),
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No assessment methods provided.</p>
        ),
    },
    {
      label: 'Assessment objectives',
      hasData: Array.isArray(assessmentObjectives) ? assessmentObjectives.length > 0 : !!assessmentObjectives,
      render: () =>
        Array.isArray(assessmentObjectives) ? (
          <div className="space-y-4">
            {(assessmentObjectives as AssessmentObjective[] | string[]).map((item, i) =>
              typeof item === 'string' ? (
                <div key={i} className="rich-text text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: item }} />
              ) : (
                <div key={item.id}>
                  <p className="font-medium mb-1">{item.id}</p>
                  <ul className="rich-text text-sm text-muted-foreground">
                    {item.objective.split(/<br\s*\/?>/i).map((line, idx) => line.trim() && <li key={idx} dangerouslySetInnerHTML={{ __html: line.trim() }} />)}
                  </ul>
                </div>
              ),
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No assessment objectives provided.</p>
        ),
    },
  ]

  const hasGuidanceData = guidanceItems.some((item) => item.hasData)

  if (!hasGuidanceData) {
    return <p className="text-text-informational italic mt-6">No guidance available.</p>
  }

  return (
    <div className="space-y-6 mt-6">
      {guidanceItems
        .filter((item) => item.hasData)
        .map((item) => (
          <Card key={item.label} className="p-4">
            <h3 className="text-base font-semibold mb-2">{item.label}</h3>
            {item.render()}
          </Card>
        ))}
    </div>
  )
}

export default GuidanceTab
