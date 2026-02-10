'use client'

import React from 'react'
import { Accordion, AccordionContent, AccordionItem } from '@radix-ui/react-accordion'
import ActivityAccordionTrigger from './activity-accordion-trigger'
import ActivityTasksSection from './activity-tasks-section'
import ActivityCommentsSection from './activity-comments-section'

type ActivityTabProps = {
  controlId?: string
  subcontrolIds: string[]
}

const ActivityTab: React.FC<ActivityTabProps> = ({ controlId, subcontrolIds }) => (
  <Accordion type="multiple" defaultValue={['tasks', 'comments']} className="w-full space-y-4">
    <AccordionItem value="tasks" className="border-b border-border pb-4 last:border-b-0">
      <ActivityAccordionTrigger label="Tasks" />
      <AccordionContent className="pt-4">
        <ActivityTasksSection controlId={controlId} subcontrolIds={subcontrolIds} />
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

export default ActivityTab
