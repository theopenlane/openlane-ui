import InfiniteScroll from '@repo/ui/infinite-scroll'
import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { TPagination } from '@repo/ui/pagination-types'
import { CARD_DEFAULT_PAGINATION } from '@/constants/pagination.ts'
import TaskCards from '@/components/pages/protected/tasks/cards/task-cards.tsx'
import { useTasksWithFilterInfinite } from '@/lib/graphql-hooks/tasks.ts'
import { TaskOrder } from '@repo/codegen/src/schema.ts'

type TTaskInfiniteCardsProps = {
  whereFilter: Record<string, any> | null
  orderByFilter: TaskOrder[] | TaskOrder | undefined
}

const TaskInfiniteCards = forwardRef(({ whereFilter, orderByFilter }: TTaskInfiniteCardsProps, ref) => {
  const [cardPagination, setCardPagination] = useState<TPagination>(CARD_DEFAULT_PAGINATION)
  const { tasks, isError, paginationMeta, fetchNextPage } = useTasksWithFilterInfinite({
    where: whereFilter,
    orderBy: orderByFilter,
    pagination: cardPagination,
    enabled: !!whereFilter,
  })

  const handlePaginationChange = (pagination: TPagination) => {
    setCardPagination(pagination)
  }

  useImperativeHandle(ref, () => ({
    exportData: () => tasks,
  }))

  useEffect(() => {
    if (cardPagination.page === 1) {
      return
    }
    fetchNextPage()
  }, [cardPagination, fetchNextPage])

  return (
    <InfiniteScroll pagination={cardPagination} onPaginationChange={handlePaginationChange} paginationMeta={paginationMeta} key="card">
      <TaskCards isError={isError} tasks={tasks} />
    </InfiniteScroll>
  )
})

TaskInfiniteCards.displayName = 'TaskInfiniteCards'

export default TaskInfiniteCards
