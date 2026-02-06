'use client'

import React, { useMemo } from 'react'
import { Accordion, AccordionContent, AccordionItem } from '@radix-ui/react-accordion'
import { Card } from '@repo/ui/cardpanel'
import { Button } from '@repo/ui/button'
import { CopyIcon, PlusCircle } from 'lucide-react'
import { CreateTaskDialog } from '@/components/pages/protected/tasks/create-task/dialog/create-task-dialog'
import { ObjectTypeObjects } from '@/components/shared/objectAssociation/object-assoiation-config'
import { useNotification } from '@/hooks/useNotification'
import ActivityAccordionTrigger from '../activity/activity-accordion-trigger'

interface ImplementationGuidance {
  referenceId: string
  guidance: string[]
}

interface AssessmentMethod {
  id: string
  type: 'EXAMINE' | 'INTERVIEW' | 'TEST'
  method: string
}

interface AssessmentObjective {
  class: string
  id: string
  objective: string
}

interface ReferenceItem {
  name: string
  url?: string
}

interface GuidanceTabProps {
  implementationGuidance?: ImplementationGuidance[] | null
  controlQuestions?: string[] | null
  assessmentMethods?: AssessmentMethod[] | null
  assessmentObjectives?: AssessmentObjective[] | null
  testingProcedures?: string[] | null
  references?: ReferenceItem[] | null
  refCode?: string
  controlId?: string
  subcontrolId?: string
  isSubcontrol?: boolean
}

const GuidanceTab: React.FC<GuidanceTabProps> = ({
  implementationGuidance,
  controlQuestions,
  assessmentMethods,
  assessmentObjectives,
  testingProcedures,
  references,
  refCode,
  controlId,
  subcontrolId,
  isSubcontrol,
}) => {
  const { successNotification, errorNotification } = useNotification()

  const filteredQuestions = useMemo(() => {
    return (controlQuestions ?? []).filter((q) => q.trim().length > 0)
  }, [controlQuestions])

  const referenceItems = useMemo(() => {
    return (references ?? []).filter((item) => item.name.length > 0)
  }, [references])

  const sortedObjectives = useMemo(() => {
    if (!assessmentObjectives?.length) return []
    return [...assessmentObjectives].sort((a, b) => a.id.localeCompare(b.id))
  }, [assessmentObjectives])

  const hasGuidanceData = Boolean(
    implementationGuidance?.length || filteredQuestions.length || referenceItems.length || assessmentMethods?.length || sortedObjectives.length || testingProcedures?.length,
  )

  const handleCopyReferences = async () => {
    if (!referenceItems.length) return

    try {
      const text = referenceItems.map((item) => (item.url ? `${item.name} - ${item.url}` : item.name)).join('\n')

      await navigator.clipboard.writeText(text)
      successNotification({ description: 'References copied to clipboard.' })
    } catch {
      errorNotification({ description: 'Failed to copy references.' })
    }
  }

  if (!hasGuidanceData) {
    return <p className="text-text-informational italic mt-6">No guidance available.</p>
  }

  const sections = [
    {
      key: 'implementation-guidance',
      label: 'Implementation guidance',
      hasData: !!implementationGuidance?.length,
      render: () => (
        <div className="space-y-4">
          {implementationGuidance!.map(({ referenceId, guidance }) => (
            <Card key={referenceId} className="p-4">
              <ol className="text-sm text-muted-foreground list-inside space-y-2">
                {guidance.map((item, index) => (
                  <li key={`${referenceId}-${index}`}>{item.trim()}</li>
                ))}
              </ol>
            </Card>
          ))}
        </div>
      ),
    },
    {
      key: 'assessment-methods',
      label: 'Assessment methods',
      hasData: !!assessmentMethods?.length,
      render: () => (
        <div className="space-y-4">
          {assessmentMethods!.map((method) => (
            <Card key={method.id} className="p-4">
              <div className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: method.method }} />
            </Card>
          ))}
        </div>
      ),
    },
    {
      key: 'assessment-objectives',
      label: 'Assessment objectives',
      hasData: !!sortedObjectives.length,
      render: () => (
        <div className="space-y-4">
          {sortedObjectives.map((objective) => (
            <Card key={objective.id} className="p-4">
              <div className="text-sm text-muted-foreground">{objective.objective}</div>
            </Card>
          ))}
        </div>
      ),
    },
    {
      key: 'control-questions',
      label: 'Control questions',
      hasData: !!filteredQuestions.length,
      render: () => (
        <div className="space-y-4">
          {filteredQuestions.map((question, index) => (
            <Card key={`question-${index}`} className="p-4">
              <p className="text-sm text-muted-foreground">{question}</p>
            </Card>
          ))}
        </div>
      ),
    },
    {
      key: 'testing-procedures',
      label: 'Testing procedures',
      hasData: !!testingProcedures?.length,
      render: () => (
        <div className="space-y-4">
          {testingProcedures!.map((item, index) => {
            const title = refCode ? `Control ${refCode} Test - ${index + 1}` : `Control Test - ${index + 1}`
            const initialData = isSubcontrol ? (subcontrolId ? { subcontrolIDs: [subcontrolId] } : undefined) : controlId ? { controlIDs: [controlId] } : undefined
            const defaultSelectedObject = isSubcontrol ? ObjectTypeObjects.SUB_CONTROL : ObjectTypeObjects.CONTROL

            return (
              <Card key={`testing-${index}`} className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm text-muted-foreground">{item}</div>
                  <CreateTaskDialog
                    defaultSelectedObject={defaultSelectedObject}
                    initialData={initialData}
                    initialValues={{ title, details: item }}
                    trigger={
                      <Button type="button" variant="secondary" className="h-8 px-3" icon={<PlusCircle size={14} />} iconPosition="left">
                        Create Task
                      </Button>
                    }
                  />
                </div>
              </Card>
            )
          })}
        </div>
      ),
    },
    {
      key: 'references',
      label: 'References',
      hasData: !!referenceItems.length,
      headerAction: (
        <Button type="button" variant="secondary" className="h-8 px-3" icon={<CopyIcon size={14} />} iconPosition="left" onClick={handleCopyReferences}>
          Copy All References
        </Button>
      ),
      render: () => (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button type="button" variant="secondary" className="h-8 px-3" icon={<CopyIcon size={14} />} iconPosition="left" onClick={handleCopyReferences}>
              Copy All References
            </Button>
          </div>
          {referenceItems.map((item, index) => (
            <Card key={`ref-${index}`} className="p-4">
              <p className="font-semibold">{item.name}</p>
              {item.url ? (
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-btn-primary hover:underline">
                  {item.url}
                </a>
              ) : (
                <p className="text-sm text-muted-foreground mt-2">No link provided.</p>
              )}
            </Card>
          ))}
        </div>
      ),
    },
  ].filter((section) => section.hasData)

  return (
    <Accordion type="multiple" defaultValue={sections.map((s) => s.key)} className="w-full space-y-4">
      {sections.map((section) => (
        <AccordionItem key={section.key} value={section.key} className="border-b border-border pb-4 last:border-b-0">
          <ActivityAccordionTrigger label={section.label} />
          <AccordionContent className="pt-4">{section.render()}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

export default GuidanceTab
