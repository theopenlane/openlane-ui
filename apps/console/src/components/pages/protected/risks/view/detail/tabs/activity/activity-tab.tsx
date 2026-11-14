'use client'

import React from 'react'
import { Accordion, AccordionContent, AccordionItem } from '@radix-ui/react-accordion'
import ActivityAccordionTrigger from '@/components/shared/crud-base/tabs/activity-accordion-trigger'
import CommentsSection from '@/components/shared/comments/comments-section'
import { useRiskComments } from '@/lib/graphql-hooks/risk'
import ActivityTasksSection from './activity-tasks-section'

type ActivityTabProps = {
  riskId: string
}

const ActivityTab: React.FC<ActivityTabProps> = ({ riskId }) => {
  const comments = useRiskComments(riskId)

  return (
    <Accordion type="multiple" defaultValue={['tasks', 'comments']} className="w-full space-y-4">
      <AccordionItem value="tasks" className="border-b border-border pb-4 last:border-b-0">
        <ActivityAccordionTrigger label="Tasks" />
        <AccordionContent className="pt-4">
          <ActivityTasksSection riskId={riskId} />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="comments" className="border-b border-border pb-4 last:border-b-0">
        <ActivityAccordionTrigger label="Comments" />
        <AccordionContent className="pt-4">
          <CommentsSection key={riskId} showHeading={false} {...comments} />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

export default ActivityTab
