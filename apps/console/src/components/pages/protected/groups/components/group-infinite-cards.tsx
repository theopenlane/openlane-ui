import GroupsCard from '@/components/pages/protected/groups/components/groups-cards.tsx'
import InfiniteScroll from '@repo/ui/infinite-scroll'
import React from 'react'
import { useGetAllGroups } from '@/lib/graphql-hooks/groups.ts'
import { TPagination } from '@repo/ui/pagination-types'
import { GroupOrder } from '@repo/codegen/src/schema.ts'

type TGroupInfiniteCardsProps = {
  pagination: TPagination
  onPaginationChange: (pagination: TPagination) => void
  whereFilter: Record<string, any>
  orderByFilter: GroupOrder[] | GroupOrder | undefined
}

const GroupInfiniteCards = ({ pagination, onPaginationChange, whereFilter, orderByFilter }: TGroupInfiniteCardsProps) => {
  const { groups, isError, paginationMeta } = useGetAllGroups({
    where: whereFilter,
    orderBy: orderByFilter,
    pagination: pagination,
  })

  return (
    <InfiniteScroll pagination={pagination} onPaginationChange={onPaginationChange} paginationMeta={paginationMeta} key="card">
      <GroupsCard isError={isError} groups={groups} />
    </InfiniteScroll>
  )
}

export default GroupInfiniteCards
