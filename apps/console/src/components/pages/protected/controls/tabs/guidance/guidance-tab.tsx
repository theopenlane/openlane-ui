'use client'

import React, { useMemo } from 'react'
import { Card } from '@repo/ui/cardpanel'
import { Button } from '@repo/ui/button'
import { CopyIcon, PlusCircle } from 'lucide-react'
import { CreateTaskDialog } from '@/components/pages/protected/tasks/create-task/dialog/create-task-dialog'
import { ObjectTypeObjects } from '@/components/shared/objectAssociation/object-assoiation-config'
import { useNotification } from '@/hooks/useNotification'

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
  prose: string
}

interface TestingProcedure {
  items: string[]
}

interface GuidanceTabProps {
  implementationGuidance?: ImplementationGuidance[] | null
  controlQuestions?: string[] | null
  assessmentMethods?: AssessmentMethod[] | null
  assessmentObjectives?: AssessmentObjective[] | null
  testingProcedures?: TestingProcedure | null
  refCode?: string
  controlId?: string
  subcontrolId?: string
  isSubcontrol?: boolean
}

type ReferenceItem = {
  id: string
  name: string
  link?: string
}

type ControlQuestionItem = {
  name: string
  url?: string
}

type GuidanceResolved = GuidanceTabProps & {
  references?: ReferenceItem[]
}

const normalizeReference = (input: string): ControlQuestionItem => {
  const htmlAnchorMatch = input.match(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/i)

  if (htmlAnchorMatch) {
    const url = htmlAnchorMatch[1]
    const text = htmlAnchorMatch[2]?.replace(/<[^>]+>/g, '').trim()
    const name = text || url
    return { name, url }
  }

  const urlMatch = input.match(/https?:\/\/[^\s)\]]+/i)
  if (urlMatch) {
    const url = urlMatch[0]
    const name = input
      .replace(url, '')
      .replace(/[-–—|]+/g, ' ')
      .trim()
    return { name: name || url, url }
  }

  return { name: input.trim() }
}

const GuidanceTab: React.FC<GuidanceTabProps> = ({
  implementationGuidance,
  controlQuestions,
  assessmentMethods,
  assessmentObjectives,
  testingProcedures,
  refCode,
  controlId,
  subcontrolId,
  isSubcontrol,
}) => {
  const { successNotification, errorNotification } = useNotification()

  const resolved = useMemo<GuidanceResolved>(
    () => ({
      implementationGuidance,
      controlQuestions,
      assessmentMethods,
      assessmentObjectives,
      testingProcedures,
      refCode,
      controlId,
      subcontrolId,
      isSubcontrol,
      references: undefined,
    }),
    [implementationGuidance, controlQuestions, assessmentMethods, assessmentObjectives, testingProcedures, refCode, controlId, subcontrolId, isSubcontrol],
  )

  const controlQuestionItems = useMemo<ControlQuestionItem[]>(() => {
    return (resolved.controlQuestions ?? []).map((item) => normalizeReference(item)).filter((item) => item.name.length > 0)
  }, [resolved.controlQuestions])

  const referenceItems = useMemo(() => {
    return (resolved.references ?? []).filter((item) => item.name.length > 0)
  }, [resolved.references])

  const sortedObjectives = useMemo(() => {
    if (!resolved.assessmentObjectives?.length) return []
    return [...resolved.assessmentObjectives].sort((a, b) => a.id.localeCompare(b.id))
  }, [resolved.assessmentObjectives])

  const testingItems = useMemo(() => {
    if (!resolved.testingProcedures) return []
    const maybeArray = resolved.testingProcedures as unknown as TestingProcedure[]
    if (Array.isArray(maybeArray)) {
      return maybeArray.flatMap((procedure) => procedure?.items ?? [])
    }
    return resolved.testingProcedures.items ?? []
  }, [resolved.testingProcedures])

  const hasGuidanceData = Boolean(
    resolved.implementationGuidance?.length || controlQuestionItems.length || referenceItems.length || resolved.assessmentMethods?.length || sortedObjectives.length || testingItems.length,
  )

  const handleCopyReferences = async () => {
    if (!referenceItems.length) return

    try {
      const text = referenceItems.map((item) => (item.link ? `${item.name} - ${item.link}` : item.name)).join('\n')

      await navigator.clipboard.writeText(text)
      successNotification({ description: 'References copied to clipboard.' })
    } catch {
      errorNotification({ description: 'Failed to copy references.' })
    }
  }

  if (!hasGuidanceData) {
    return <p className="text-text-informational italic mt-6">No guidance available.</p>
  }

  return (
    <div className="space-y-6 mt-6">
      {implementationGuidance?.length ? (
        <section className="space-y-4">
          <h3 className="text-base font-semibold">Implementation guidance</h3>
          <div className="space-y-4">
            {resolved.implementationGuidance?.map(({ referenceId, guidance }) => (
              <Card key={referenceId} className="p-4">
                <ol className="text-sm text-muted-foreground list-inside space-y-2">
                  {guidance.map((item, index) => (
                    <li key={`${referenceId}-${index}`}>{item.trim()}</li>
                  ))}
                </ol>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {resolved.assessmentMethods?.length ? (
        <section className="space-y-4">
          <h3 className="text-base font-semibold">Assessment methods</h3>
          <div className="space-y-4">
            {resolved.assessmentMethods.map((method) => (
              <Card key={method.id} className="p-4">
                <div className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: method.method }} />
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {sortedObjectives.length ? (
        <section className="space-y-4">
          <h3 className="text-base font-semibold">Assessment objectives</h3>
          <div className="space-y-4">
            {sortedObjectives.map((objective) => (
              <Card key={objective.id} className="p-4">
                <div className="text-sm text-muted-foreground">{objective.prose}</div>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {controlQuestionItems.length ? (
        <section className="space-y-4">
          <h3 className="text-base font-semibold">Control questions</h3>
          <div className="space-y-4">
            {controlQuestionItems.map((item, index) => (
              <Card key={`question-${index}`} className="p-4">
                <p className="text-sm text-muted-foreground">{item.name}</p>
                {item.url ? (
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-btn-primary hover:underline">
                    {item.url}
                  </a>
                ) : null}
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {testingItems.length ? (
        <section className="space-y-4">
          <h3 className="text-base font-semibold">Testing procedures</h3>
          <div className="space-y-4">
            {testingItems.map((item, index) => {
              const title = resolved.refCode ? `Control ${resolved.refCode} Test - ${index + 1}` : `Control Test - ${index + 1}`
              const initialData = resolved.isSubcontrol
                ? resolved.subcontrolId
                  ? { subcontrolIDs: [resolved.subcontrolId] }
                  : undefined
                : resolved.controlId
                ? { controlIDs: [resolved.controlId] }
                : undefined
              const defaultSelectedObject = resolved.isSubcontrol ? ObjectTypeObjects.SUB_CONTROL : ObjectTypeObjects.CONTROL

              return (
                <Card key={`testing-${index}`} className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm text-muted-foreground ">{item}</div>
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
        </section>
      ) : null}

      {referenceItems.length ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-semibold">References</h3>
            <Button type="button" variant="secondary" className="h-8 px-3" icon={<CopyIcon size={14} />} iconPosition="left" onClick={handleCopyReferences}>
              Copy All References
            </Button>
          </div>
          <div className="space-y-4">
            {referenceItems.map((item) => (
              <Card key={item.id} className="p-4">
                <p className="font-semibold">{item.name}</p>
                {item.link ? (
                  <a href={item.link} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-btn-primary hover:underline">
                    {item.link}
                  </a>
                ) : (
                  <p className="text-sm text-muted-foreground mt-2">No link provided.</p>
                )}
              </Card>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}

export default GuidanceTab
