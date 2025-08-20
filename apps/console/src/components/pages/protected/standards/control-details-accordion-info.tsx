'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion'
import { ChevronDown } from 'lucide-react'
import * as React from 'react'
import { AssessmentMethod, AssessmentObjective, ExampleEvidence } from '../controls/info-card'

interface AccordionInfoProps {
  implementationGuidance: { referenceId: string; guidance: string[] }[] | null | undefined
  exampleEvidence: ExampleEvidence[] | null | undefined
  controlQuestions: string[] | null | undefined
  assessmentMethods: AssessmentMethod[] | string | string[] | null | undefined
  assessmentObjectives: AssessmentObjective[] | string | string[] | null | undefined
}

const AccordionInfo: React.FC<AccordionInfoProps> = ({ implementationGuidance, exampleEvidence, controlQuestions, assessmentMethods, assessmentObjectives }) => {
  const infoItems = React.useMemo(
    () =>
      [
        {
          label: 'Implementation guidance',
          hasData: !!implementationGuidance?.length,
          render: () => (
            <div className="space-y-4">
              {implementationGuidance!.map(({ referenceId, guidance }) => (
                <div key={referenceId}>
                  <p className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    {guidance.map((g, i) => (
                      <span key={i}>{g.trim()}</span>
                    ))}
                  </p>
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
              <p className="list-none text-sm text-muted-foreground space-y-3">
                {exampleEvidence.map((item, i) => (
                  <span key={i}>
                    <p className="font-medium">{item.documentationType}</p>
                    <p className="text-muted-foreground">{item.description}</p>
                  </span>
                ))}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">{typeof exampleEvidence === 'string' ? exampleEvidence : 'No example evidence provided.'}</p>
            ),
        },
        {
          label: 'Control questions',
          hasData: !!controlQuestions?.length,
          render: () =>
            controlQuestions?.length ? (
              <p className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                {controlQuestions.map((q, i) => (
                  <span key={i}>{q}</span>
                ))}
              </p>
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
                    <p key={i} className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <span>{item}</span>
                    </p>
                  ) : (
                    <div key={item.id}>
                      <p className="font-medium mb-1">{item.id}</p>
                      <p className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                        {item.method.split(/<br\s*\/?>/i).map((line, idx) => line.trim() && <span key={idx}>{line.trim()}</span>)}
                      </p>
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
                    <p key={i} className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <span>{item}</span>
                    </p>
                  ) : (
                    <div key={item.id}>
                      <p className="font-medium mb-1">{item.id}</p>
                      <p className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                        {item.objective.split(/<br\s*\/?>/i).map((line, idx) => line.trim() && <span key={idx}>{line.trim()}</span>)}
                      </p>
                    </div>
                  ),
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{assessmentObjectives || 'No assessment objectives provided.'}</p>
            ),
        },
      ].filter((item) => item.hasData),
    [implementationGuidance, exampleEvidence, controlQuestions, assessmentMethods, assessmentObjectives],
  )

  if (infoItems.length === 0) return null

  return (
    <Accordion type="multiple" className="space-y-2">
      {infoItems.map((item) => (
        <AccordionItem key={item.label} value={item.label}>
          <AccordionTrigger asChild>
            <button className="group flex items-center py-2 text-left gap-3">
              <div className="flex items-center gap-2">
                <span className="text-base font-medium">{item.label}</span>
              </div>
              <ChevronDown size={22} className="text-brand transform rotate-[-90deg] transition-transform group-data-[state=open]:rotate-0" />
            </button>
          </AccordionTrigger>
          <AccordionContent className="pt-2">{item.render()}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

export default AccordionInfo
