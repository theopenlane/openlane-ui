'use client'

import React from 'react'
import { Accordion, AccordionContent, AccordionItem } from '@radix-ui/react-accordion'
import ActivityAccordionTrigger from '@/components/shared/crud-base/tabs/activity-accordion-trigger'
import ActivityCommentsSection from './activity-comments-section'

type ActivityTabProps = {
  vendorId: string
}

const ActivityTab: React.FC<ActivityTabProps> = ({ vendorId }) => (
  <Accordion type="multiple" defaultValue={['comments']} className="w-full space-y-4">
    <AccordionItem value="comments" className="border-b border-border pb-4 last:border-b-0">
      <ActivityAccordionTrigger label="Comments" />
      <AccordionContent className="pt-4">
        <ActivityCommentsSection vendorId={vendorId} />
      </AccordionContent>
    </AccordionItem>
  </Accordion>
)

export default ActivityTab
