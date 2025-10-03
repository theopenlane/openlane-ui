import React from 'react'
import { ShieldCheck } from 'lucide-react'
import { Rectangle } from './shadow-rectangle'
import { Card } from '@repo/ui/cardpanel'

const Soc2Illustration = () => {
  return (
    <Card className="relative h-36 w-full bg-secondary px-11 overflow-hidden">
      <Card className="p-4 relative h-32 w-full flex bg-card mt-6 flex-col">
        <div className="flex w-full justify-between items-center">
          <ShieldCheck size={16} className="text-btn-secondary" />
          <div className="h-3 w-3 bg-border rounded-full" />
        </div>
        <div className=" mt-4  w-2/3 rounded-md border border-btn-secondary bg-transparent shadow-primary h-4.5" />
        <div className="mt-4 h-2 w-4/5 rounded-full bg-muted" />
        <div className="mt-2.5  h-2 w-3/5 rounded-full bg-border" />
      </Card>
      <Rectangle className="absolute top-2/4 left-0" />
    </Card>
  )
}

export default Soc2Illustration
