'use client'

import React from 'react'
import { Accordion, AccordionContent, AccordionItem } from '@radix-ui/react-accordion'
import ActivityAccordionTrigger from './activity-accordion-trigger'
import ActivityTasksSection from './activity-tasks-section'

type ActivityTabProps = {
  riskId: string
}

const ActivityTab: React.FC<ActivityTabProps> = ({ riskId }) => (
  <Accordion type="multiple" defaultValue={['tasks', 'comments']} className="w-full space-y-4">
    <AccordionItem value="tasks" className="border-b border-border pb-4 last:border-b-0">
      <ActivityAccordionTrigger label="Tasks" />
      <AccordionContent className="pt-4">
        <ActivityTasksSection riskId={riskId} />
      </AccordionContent>
    </AccordionItem>
  </Accordion>
)

export default ActivityTab
