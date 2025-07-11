import { Card, CardContent, CardTitle } from '@repo/ui/cardpanel'
import { Calendar, ChevronRight } from 'lucide-react'
import React, { Suspense } from 'react'
import Image from 'next/image'
import CalendarArrow from '@/assets/CalendarArrow'
import SquareArrow from '@/assets/SquareArrow'
import { useSession } from 'next-auth/react'
import { addDays, formatDistanceToNowStrict, isAfter, isBefore, parseISO } from 'date-fns'
import { useTasksWithFilter } from '@/lib/graphql-hooks/tasks'
import { Task, TaskTaskStatus } from '@repo/codegen/src/schema'
import clsx from 'clsx'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

const now = new Date()
const dueSoonLimit = addDays(now, 7)
const upcomingUpper = addDays(now, 30)

const MyTaskContent = ({ userId }: { userId: string }) => {
  const searchParams = useSearchParams()
  const programId = searchParams.get('id')

  const where = {
    assigneeID: userId,
    dueLTE: upcomingUpper.toISOString(),
    hasProgramsWith: programId ? [{ id: programId }] : undefined,
    statusNotIn: [TaskTaskStatus.COMPLETED, TaskTaskStatus.WONT_DO],
  }

  const { data } = useTasksWithFilter({ where })

  const router = useRouter()

  const tasks = data?.tasks?.edges?.map((edge) => edge?.node ?? ({} as Task)) || []

  const dueSoonTasks = tasks
    .filter((task) => task.due && isAfter(new Date(task.due), now) && isBefore(new Date(task.due), dueSoonLimit))
    .sort((a, b) => new Date(a.due!).getTime() - new Date(b.due!).getTime())

  const upcomingTasks = tasks
    .filter((task) => task.due && isAfter(new Date(task.due), dueSoonLimit) && isBefore(new Date(task.due), upcomingUpper))
    .sort((a, b) => new Date(a.due!).getTime() - new Date(b.due!).getTime())

  const overdueTasks = tasks.filter((task) => task.due && isBefore(new Date(task.due), now)).sort((a, b) => new Date(b.due!).getTime() - new Date(a.due!).getTime())

  const displayedTasks = [...overdueTasks, ...dueSoonTasks, ...upcomingTasks].slice(0, 3)

  const dueSoonCount = dueSoonTasks.length
  const upcomingCount = upcomingTasks.length
  const overdueCount = overdueTasks.length

  const filters = [
    {
      field: 'hasProgramsWith',
      value: programId,
      type: 'selectIs',
      operator: 'EQ',
    },
  ]

  const encodedFilters = encodeURIComponent(JSON.stringify(filters))
  const tasksRedirectURL = programId ? `/tasks?regularFilters=${encodedFilters}` : '/tasks'

  if (dueSoonCount === 0 && upcomingCount === 0 && overdueCount === 0) {
    return (
      //TODO: add size fit when we have pending actions, currently no api
      <Card>
        <CardTitle className="text-lg font-semibold">My Tasks</CardTitle>
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
          <p className="text-lg font-medium">🎉 Yay! You&apos;re all caught up!</p>
          <p className="text-sm text-muted-foreground mt-1">No tasks to do—enjoy the peace and quiet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardTitle className="text-lg font-semibold">My Tasks</CardTitle>
      <CardContent>
        <div className="grid grid-cols-2 gap-12 mb-7">
          <div className="flex flex-col items-center justify-center py-4 px-8 border rounded-lg relative">
            <span className="text-sm text-muted-foreground">Task due soon</span>
            <span className="text-2xl font-bold">{dueSoonCount + overdueCount}</span>
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
            const dueDate = parseISO(task.due ?? new Date().toISOString())
            const distance = formatDistanceToNowStrict(dueDate)

            const isDue = isBefore(dueDate, new Date())
            const isSoon = isBefore(new Date(dueDate), dueSoonLimit)
            const isUpcoming = isAfter(new Date(dueDate), dueSoonLimit) && isBefore(new Date(dueDate), upcomingUpper)

            return (
              <Link key={task.id} href={`/tasks?id=${task.id}`} className="grid grid-cols-[120px_1fr] items-center gap-[20px] size-fit">
                {' '}
                <div className={clsx('flex items-center gap-2', ((isDue || isSoon) && 'text-destructive') || (isUpcoming && 'text-green-500'))}>
                  {isDue ? (
                    <>
                      <CalendarArrow />
                      <span className="text-sm font-medium">Overdue</span>
                    </>
                  ) : (
                    <>
                      <Calendar strokeWidth={1} size={16} />
                      <span className="text-sm font-medium">{distance}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <SquareArrow className={clsx(!isDue && 'rotate-90 text-blue-500', isDue && 'text-yellow-500')} />
                  <span className="text-sm font-medium truncate max-w-56">{task.title}</span>
                </div>
              </Link>
            )
          })}
        </div>

        <div onClick={() => router.push(tasksRedirectURL)} className="mt-7 text-sm text-primary flex items-center cursor-pointer">
          Show more Tasks <ChevronRight size={16} className="ml-1" />
        </div>
      </CardContent>
    </Card>
  )
}

const MyTask = () => {
  const { data: sessionData } = useSession()
  const userId = sessionData?.user?.userId

  if (!userId) {
    return (
      <Card>
        <CardTitle className="text-lg font-semibold">My Tasks</CardTitle>
        <CardContent className="text-center text-red-500">Error: No user found</CardContent>
      </Card>
    )
  }

  return (
    <Suspense
      fallback={
        <Card>
          <CardTitle className="text-lg font-semibold">My Tasks</CardTitle>
          <CardContent className="text-center">Loading...</CardContent>
        </Card>
      }
    >
      <MyTaskContent userId={userId} />
    </Suspense>
  )
}

export default MyTask
