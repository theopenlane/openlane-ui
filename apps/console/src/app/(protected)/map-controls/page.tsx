'use client'
import React from 'react'

import MapControlsRelations from '@/components/pages/protected/map-controls/map-controls-relations'
import MapControlsCard from '@/components/pages/protected/map-controls/map-controls-card'
import Intersection from '@/assets/Intersection'

const Page: React.FC = () => {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Map Controls</h1>
        <p className="text-muted-foreground mt-1">
          Define how controls relate across frameworks o- custom sets—whether they’re equivalent, overlapping, or one is a subset of another. Use these mappings to reduce duplication, surface gaps,
          and create a unified view of your compliance posture.
        </p>
      </div>
      <div className="grid grid-cols-[2fr_1fr] gap-6">
        <div className="flex flex-col">
          <MapControlsCard title="From" />
          <div className="flex flex-col items-center">
            <div className="border-l h-4" />
            <Intersection />
            <div className="border-l h-4" />
          </div>
          <MapControlsCard title="To" />
        </div>
        <MapControlsRelations />
      </div>
    </div>
  )
}

export default Page
