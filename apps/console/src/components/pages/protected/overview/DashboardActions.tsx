import { Card, CardContent, CardTitle } from '@repo/ui/cardpanel'
import React from 'react'
import { BookOpenCheck, ListChecks, SlidersHorizontal, SquarePlus } from 'lucide-react'

const DashboardActions = () => {
  return (
    <div className="grid grid-cols-4 gap-4">
      <Card>
        <CardTitle className="p-[24px] pb-0">
          <div className="p-2 rounded-md bg-success/12 inline-flex items-center justify-center">
            <SlidersHorizontal size={20} className="text-success" />
          </div>
        </CardTitle>
        <CardContent className="pt-[12px]">View All Controls</CardContent>
      </Card>

      <Card>
        <CardTitle className="p-[24px] pb-0">
          <div className="p-2 rounded-md bg-danger/12 inline-flex items-center justify-center">
            <SquarePlus size={20} className="text-danger" />
          </div>
        </CardTitle>
        <CardContent className="pt-[12px]">Create New Risk</CardContent>
      </Card>

      <Card>
        <CardTitle className="p-[24px] pb-0">
          <div className="p-2 rounded-md bg-info/12 inline-flex items-center justify-center">
            <ListChecks size={20} className="text-info" />
          </div>
        </CardTitle>
        <CardContent className="pt-[12px]">View My Tasks</CardContent>
      </Card>

      <Card>
        <CardTitle className="p-[24px] pb-0">
          <div className="p-2 rounded-md bg-warning/12 inline-flex items-center justify-center">
            <BookOpenCheck size={20} className="text-warning" />
          </div>
        </CardTitle>
        <CardContent className="pt-[12px]">Review / Edit Policies</CardContent>
      </Card>
    </div>
  )
}

export default DashboardActions
