import { Card, CardContent, CardTitle } from '@repo/ui/cardpanel'
import { Calendar, ChevronRight } from 'lucide-react'
import React from 'react'
import Image from 'next/image'
import CalendarArrow from '@/assets/CalendarArrow'
import SquareArrow from '@/assets/SquareArrow'
import { ClipboardCheck } from 'lucide-react'

const MyTask = ({ status = 'default' }) => {
  if (status === 'finished') {
    return (
      <Card className="size-fit">
        <CardTitle className="text-lg font-semibold">My Task</CardTitle>
        <CardContent className="flex flex-col items-center text-center">
          <div className="grid grid-cols-2 gap-6 mb-6 w-full">
            <div className="flex flex-col items-center justify-center py-4 px-8 border rounded-lg w-40">
              <span className="text-sm ">Due soon</span>
              <span className="text-2xl font-bold">0</span>
            </div>
            <div className="flex flex-col items-center justify-center py-4 px-8 border rounded-lg w-40">
              <span className="text-sm ">Upcoming</span>
              <span className="text-2xl font-bold">0</span>
            </div>
          </div>
          <p className="text-lg font-medium">🎉 Yay! You're all caught up!</p>
          <p>No tasks to do—enjoy the peace and quiet.</p>
        </CardContent>
      </Card>
    )
  }

  if (status === 'no-data') {
    return (
      <Card className="size-fit">
        <CardTitle className="text-lg font-semibold">My Task</CardTitle>
        <CardContent className="flex flex-col items-center text-center p-6">
          <ClipboardCheck size={48} className="text-gray-400 mb-4" />
          <p className="text-lg font-medium">You aren’t assigned to any task</p>
          <p className="text-gray-400">Filter dripper pot espresso milk espresso acerbic</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="size-fit">
      <CardTitle className="text-lg font-semibold">My Task</CardTitle>
      <CardContent>
        {/* Task Summary */}
        <div className="grid grid-cols-2 gap-12 mb-7">
          <div className="flex flex-col items-center justify-center py-4 px-8 border rounded-lg relative">
            <span className="text-sm text-muted-foreground">Task due soon</span>
            <span className="text-2xl font-bold">1</span>
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs flex items-center justify-center rounded-full">
              <Image src={'/icons/alert.svg'} alt="alert Icon" width={25} height={25} />
            </div>
          </div>
          <div className="flex flex-col items-center justify-center py-4 px-8 border rounded-lg">
            <span className="text-sm text-muted-foreground">Upcoming task</span>
            <span className="text-2xl font-bold">2</span>
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-destructive">
              <CalendarArrow />
              <span className="text-sm font-medium">2 days</span>
            </div>
            <div className="flex items-center gap-2">
              <SquareArrow className=" text-yellow-500" />
              <span className="text-sm font-medium">Complete Risk Assessment</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar strokeWidth={1} size={16} className="" />
              <span className="text-sm font-medium">3 days</span>
            </div>
            <div className="flex items-center gap-2">
              <SquareArrow className="text-blue-500 rotate-90" />
              <span className="text-sm font-medium">Submit Evidence</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar strokeWidth={1} size={16} className="" />
              <span className="text-sm font-medium">8 days</span>
            </div>
            <div className="flex items-center gap-2">
              <SquareArrow className="text-blue-500 rotate-90" />
              <span className="text-sm font-medium">Review Compliance Report</span>
            </div>
          </div>
        </div>

        {/* Show More Tasks */}
        <div className="mt-7 text-sm text-primary flex items-center cursor-pointer">
          Show more Task <ChevronRight size={16} className="ml-1" />
        </div>
      </CardContent>
    </Card>
  )
}

export default MyTask
