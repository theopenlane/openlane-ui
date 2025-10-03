import React from 'react'
import { Rectangle } from './shadow-rectangle'
import { Card } from '@repo/ui/cardpanel'
import { Frame } from 'lucide-react'

const FrameworkBasedIllustration = () => {
  return (
    <Card className="relative h-36 w-full bg-secondary px-11 overflow-hidden">
      <Card className="p-4 pb-0 relative h-32 w-full flex bg-card mt-6 flex-col gap-4">
        <div className="flex w-full justify-between items-center">
          <Frame size={16} className="text-btn-secondary" />
          <div className="h-3 w-3 bg-border rounded-full" />
        </div>
        <div className="flex gap-3 h-full">
          <div className="flex-1 bg-border rounded-sm"></div>
          <div className="flex-1 bg-border rounded-sm border border-btn-secondary shadow-primary"></div>
          <div className="flex-1 bg-border rounded-sm"></div>
          <div className="flex-1 bg-border rounded-sm"></div>
        </div>
      </Card>
      <Rectangle className="absolute top-2/4 left-0" />
    </Card>
  )
}

export default FrameworkBasedIllustration
