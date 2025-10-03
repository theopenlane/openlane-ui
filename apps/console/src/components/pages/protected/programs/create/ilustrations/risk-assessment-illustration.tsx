import React from 'react'
import { Check, SearchCheck } from 'lucide-react'
import { Rectangle } from './shadow-rectangle'
import { Card } from '@repo/ui/cardpanel'

const RiskAssessmentIllustration = () => {
  return (
    <Card className="relative h-36 w-full bg-secondary px-11 overflow-hidden">
      <Card className="p-4 relative h-32 w-full flex bg-card mt-6 flex-col">
        <div className="flex w-full justify-between items-center">
          <SearchCheck size={16} className="text-btn-secondary" />
          <div className="h-3 w-3 bg-border rounded-full" />
        </div>
        <div className="flex items-center gap-2 mt-4">
          <div className="rounded-full border border-btn-secondary bg-transparent shadow-primary h-5 w-5 flex items-center justify-center">
            <Check size={12} className="text-btn-secondary" />
          </div>
          <div className="h-2 w-3/5 rounded-full bg-border" />
        </div>
        <div className="flex items-center gap-2 mt-2.5">
          <div className="h-5 w-5 bg-muted rounded-full" />
          <div className="h-2 w-3/5 rounded-full bg-border" />
        </div>
        <div className="flex items-center gap-2 mt-2.5">
          <div className="h-5 w-5 bg-muted rounded-full" />
          <div className="h-2 w-3/5 rounded-full bg-border" />
        </div>
      </Card>
      <Rectangle className="absolute top-2/4 left-0" />
    </Card>
  )
}

export default RiskAssessmentIllustration
