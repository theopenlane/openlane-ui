// components/pages/protected/map-controls/page.tsx
'use client'
import React, { useState } from 'react'

import Intersection from '@/assets/Intersection'
import MapControlsCard from '@/components/pages/protected/map-controls/map-controls-card'
import MapControlsRelations from '@/components/pages/protected/map-controls/map-controls-relations'
import { Accordion } from '@radix-ui/react-accordion'
import Subset from '@/assets/Subset'
import Equals from '@/assets/Equals'
import { useControlSelect } from '@/lib/graphql-hooks/controls'
import Partial from '@/assets/Partial'
import SupersetDark from '@/assets/SupersetDark'
import SupersetLight from '@/assets/SupersetLight '

const Page: React.FC = () => {
  const [expandedCard, setExpandedCard] = useState<'From' | 'To' | ''>('From')

  const handleCardToggle = (title: 'From' | 'To') => {
    if (expandedCard === title) {
      setExpandedCard('')
    } else {
      setExpandedCard(title)
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Map Controls</h1>
        <p className="text-muted-foreground mt-1">
          Define how controls relate across frameworks – custom sets—whether they’re equivalent, overlapping, or one is a subset of another. Use these mappings to reduce duplication, surface gaps, and
          create a unified view of your compliance posture.
        </p>
      </div>
      <div className="grid grid-cols-[2fr_1fr] gap-6">
        <div className="flex flex-col">
          <Accordion type="single" collapsible value={expandedCard} className="w-full">
            <MapControlsCard title="From" expandedCard={expandedCard} setExpandedCard={() => handleCardToggle('From')} />
            <div className="flex flex-col items-center">
              <div className="border-l h-4" />
              <div className="h-12 w-12 bg-card flex items-center justify-center rounded-full">
                {/* <Intersection /> */}
                {/* <Equals /> */}
                {/* <Subset /> */}
                {/* <Partial /> */}
                <Superset />
              </div>
              <div className="border-l h-4" />
            </div>
            <MapControlsCard title="To" expandedCard={expandedCard} setExpandedCard={() => handleCardToggle('To')} />
          </Accordion>
        </div>
        <MapControlsRelations />
      </div>
    </div>
  )
}

export default Page

const Superset = () => {
  return (
    <>
      <div className="block dark:hidden">
        <SupersetLight />
      </div>
      <div className="hidden dark:block">
        <SupersetDark />
      </div>
    </>
  )
}
