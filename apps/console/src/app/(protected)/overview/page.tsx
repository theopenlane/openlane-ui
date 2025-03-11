'use client'
import React, { useState } from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import { Select, SelectTrigger, SelectContent, SelectItem } from '@repo/ui/select'
import { ProgramCreate } from '@/components/pages/protected/program/program-create'
import { Button } from '@repo/ui/button'
import { ListPlus } from 'lucide-react'
import MyTask from '@/components/pages/protected/overview/my-task'
import PendingActions from '@/components/pages/protected/overview/pending-actions'
import { LineChartExample } from '@repo/ui/line-chart-example'
import { Card } from '@repo/ui/cardpanel'
import StatsCards from '@/components/shared/stats-cards/stats-cards'
import Risks from '@/components/pages/protected/overview/risks'
import Questionnaire from '@/components/pages/protected/overview/questionnaire'

const Page: React.FC = () => {
  const [selectedObject, setSelectedObject] = useState<string>('All programs')

  return (
    <>
      <PageHeading
        heading={
          <div className="flex justify-between items-center">
            <h1>Overview</h1>
            <div className="flex gap-2.5">
              <Select onValueChange={(val: string) => setSelectedObject(val)}>
                <SelectTrigger className="w-48 border rounded-md px-3 py-2 flex items-center justify-between">{selectedObject}</SelectTrigger>
                <SelectContent className="border rounded-md shadow-md">
                  <SelectItem value="All programs">All programs</SelectItem>
                  <SelectItem value="Option 1">Option 1</SelectItem>
                  <SelectItem value="Option 2">Option 2</SelectItem>
                </SelectContent>
              </Select>
              <ProgramCreate />
              <Button iconPosition="left" icon={<ListPlus size={16} />}>
                Create Task
              </Button>
            </div>
          </div>
        }
      />
      <div className="flex flex-col gap-7 ">
        <div className="flex flex-wrap gap-7">
          <MyTask />
          <PendingActions />
        </div>
        <Card>
          <LineChartExample />
        </Card>
        <StatsCards />
        <Risks />
        <Questionnaire />
      </div>
    </>
  )
}

export default Page
