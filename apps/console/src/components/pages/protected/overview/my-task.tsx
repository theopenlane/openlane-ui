import { Card, CardContent, CardTitle } from '@repo/ui/cardpanel'
import { Calendar, ChevronRight } from 'lucide-react'
import React, { Suspense } from 'react'
import Image from 'next/image'
import CalendarArrow from '@/assets/CalendarArrow'
import SquareArrow from '@/assets/SquareArrow'
import { useSession } from 'next-auth/react'
import { addDays, formatDistanceToNowStrict, isBefore, parseISO } from 'date-fns'
import { useUserTasks } from '@/lib/graphql-hooks/tasks'
import { Task } from '@repo/codegen/src/schema'
import clsx from 'clsx'
import { useRouter } from 'next/navigation'

const dueSoonLimit = addDays(new Date(), 7)

const MyTaskContent = ({ userId }: { userId: string }) => {
  const { data } = useUserTasks(userId)
  const router = useRouter()

  const tasks = data?.tasks?.edges?.map((edge) => edge?.node ?? ({} as Task)) || []

  const dueSoonTasks = tasks.filter((task) => isBefore(new Date(task.due), dueSoonLimit))
  const upcomingTasks = tasks.filter((task) => !isBefore(new Date(task.due), dueSoonLimit))

  dueSoonTasks.sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime())
  upcomingTasks.sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime())

  const displayedTasks = [...dueSoonTasks, ...upcomingTasks].slice(0, 3)

  const dueSoonCount = dueSoonTasks.length
  const upcomingCount = upcomingTasks.length

  if (dueSoonCount === 0 && upcomingCount === 0) {
    return (
      <Card className="size-fit">
        <CardTitle className="text-lg font-semibold">My Task</CardTitle>
        <CardContent className="flex flex-col items-center text-center">
          <div className="grid grid-cols-2 gap-6 mb-6 w-full">
            <div className="flex flex-col items-center justify-center py-4 px-8 border rounded-lg w-40">
              <span className="text-sm">Due soon</span>
              <span className="text-2xl font-bold">0</span>
            </div>
            <div className="flex flex-col items-center justify-center py-4 px-8 border rounded-lg w-40">
              <span className="text-sm">Upcoming</span>
              <span className="text-2xl font-bold">0</span>
            </div>
          </div>
          <p className="text-lg font-medium">🎉 Yay! You're all caught up!</p>
          <p>No tasks to do—enjoy the peace and quiet.</p>
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
            <span className="text-2xl font-bold">{dueSoonCount}</span>
            {dueSoonCount > 0 && (
              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs flex items-center justify-center rounded-full">
                <Image src={'/icons/alert.svg'} alt="alert Icon" width={25} height={25} />
              </div>
            )}
          </div>
          <div className="flex flex-col items-center justify-center py-4 px-8 border rounded-lg">
            <span className="text-sm text-muted-foreground">Upcoming task</span>
            <span className="text-2xl font-bold">{upcomingCount}</span>
          </div>
        </div>

        <div className="space-y-3">
          {displayedTasks.map((task) => {
            const dueDate = parseISO(task.due)
            const distance = formatDistanceToNowStrict(dueDate)
            const isDue = isBefore(dueDate, new Date())

            return (
              <div key={task.id} className="flex items-center ">
                <div className={clsx('flex items-center gap-2 w-full', isDue && 'text-destructive')}>
                  {isDue ? <CalendarArrow /> : <Calendar strokeWidth={1} size={16} />}
                  <span className="text-sm font-medium ">{distance}</span>
                </div>
                <div className="flex items-center gap-2 w-full">
                  <SquareArrow className={clsx(!isDue && 'rotate-90 text-blue-500', isDue && 'text-yellow-500')} />
                  <span className="text-sm font-medium truncate w-56">{task.title}</span>
                </div>
              </div>
            )
          })}
        </div>

        <div onClick={() => router.push('/tasks')} className="mt-7 text-sm text-primary flex items-center cursor-pointer">
          Show more Tasks <ChevronRight size={16} className="ml-1" />
        </div>
      </CardContent>
    </Card>
  )
}

const MyTask = ({ status = 'default' }) => {
  const { data: sessionData } = useSession()
  const userId = sessionData?.user?.userId

  if (!userId) {
    return (
      <Card className="size-fit">
        <CardTitle className="text-lg font-semibold">My Task</CardTitle>
        <CardContent className="text-center text-red-500">Error: No user found</CardContent>
      </Card>
    )
  }

  return (
    <Suspense
      fallback={
        <Card className="size-fit">
          <CardTitle className="text-lg font-semibold">My Task</CardTitle>
          <CardContent className="text-center">Loading...</CardContent>
        </Card>
      }
    >
      <MyTaskContent userId={userId} />
    </Suspense>
  )
}

export default MyTask
