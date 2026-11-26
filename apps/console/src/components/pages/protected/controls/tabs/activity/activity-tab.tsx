'use client'

import React, { useMemo } from 'react'
import { useParams } from 'next/navigation'
import { type TaskWhereInput } from '@repo/codegen/src/schema'
import { Accordion, AccordionContent, AccordionItem } from '@radix-ui/react-accordion'
import ActivityAccordionTrigger from '@/components/shared/crud-base/tabs/activity-accordion-trigger'
import ActivityTasksSection from './activity-tasks-section'
import ActivityCommentsSection from './activity-comments-section'

type ActivityTabProps = {
  controlId?: string
  subcontrolIds: string[]
}

const ActivityTab: React.FC<ActivityTabProps> = ({ controlId, subcontrolIds }) => {
  const { subcontrolId } = useParams<{ subcontrolId?: string }>()
  const isSubcontrolPage = Boolean(subcontrolId)
  const associationFilter = useMemo<TaskWhereInput>(() => {
    if (isSubcontrolPage) {
      return subcontrolIds.length > 0 ? { hasSubcontrolsWith: [{ idIn: subcontrolIds }] } : {}
    }

    return controlId ? { hasControlsWith: [{ id: controlId }] } : {}
  }, [controlId, isSubcontrolPage, subcontrolIds])

  return (
    <Accordion type="multiple" defaultValue={['tasks', 'comments']} className="w-full space-y-4">
      <AccordionItem value="tasks" className="border-b border-border pb-4 last:border-b-0">
        <ActivityAccordionTrigger label="Tasks" />
        <AccordionContent className="pt-4">
          <ActivityTasksSection associationFilter={associationFilter} emptyDescription="Use tasks to track work related to this control. Add a task to get started." />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="comments" className="border-b border-border pb-4 last:border-b-0">
        <ActivityAccordionTrigger label="Comments" />
        <AccordionContent className="pt-4">
          <ActivityCommentsSection />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

export default ActivityTab
