'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion'
import { ChevronDown } from 'lucide-react'
import * as React from 'react'

export interface AssessmentMethod {
  id: string
  type: string
  method: string
}

export interface AssessmentObjective {
  id: string
  class: string
  objective: string
}

export interface ExampleEvidence {
  documentationType: string
  description: string
}

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
          render: () =>
            implementationGuidance?.length ? (
              <div className="space-y-4">
                {implementationGuidance.map(({ referenceId, guidance }) => (
                  <div key={referenceId} className="rich-text text-sm text-muted-foreground">
                    <ul>
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
          label: 'Evidence Requests',
          hasData: Array.isArray(exampleEvidence) ? exampleEvidence.length > 0 : !!exampleEvidence,
          render: () =>
            Array.isArray(exampleEvidence) ? (
              <ul className="rich-text text-sm text-muted-foreground">
                {exampleEvidence.map((item, i) => (
                  <li key={i}>
                    <p className="font-medium">{item.documentationType}</p>
                    <div className="rich-text" dangerouslySetInnerHTML={{ __html: item.description }} />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rich-text text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: String(exampleEvidence) }} />
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
                {assessmentMethods.map((item, i) =>
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
                {assessmentObjectives.map((item, i) =>
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
      ].filter((item) => item.hasData),
    [implementationGuidance, exampleEvidence, controlQuestions, assessmentMethods, assessmentObjectives],
  )

  if (infoItems.length === 0) return null

  return (
    <Accordion type="multiple" className="space-y-2">
      {infoItems.map((item) => (
        <AccordionItem key={item.label} value={item.label}>
          <AccordionTrigger asChild>
            <button className="group flex items-center py-2 bg-transparent text-left gap-3">
              <div className="flex items-center gap-2">
                <span className="text-base font-medium">{item.label}</span>
              </div>
              <ChevronDown size={22} className="text-brand transform transition-transform group-data-[state=open]:rotate-0" />
            </button>
          </AccordionTrigger>
          <AccordionContent className="pt-2">{item.render()}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

export default AccordionInfo
