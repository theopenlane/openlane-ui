import GroupsCard from '@/components/pages/protected/groups/components/groups-cards.tsx'
import InfiniteScroll from '@repo/ui/infinite-scroll'
import React, { useEffect, useState } from 'react'
import { useGetAllGroupsInfinite } from '@/lib/graphql-hooks/groups.ts'
import { TPagination } from '@repo/ui/pagination-types'
import { GroupOrder } from '@repo/codegen/src/schema.ts'
import { CARD_DEFAULT_PAGINATION } from '@/constants/pagination.ts'

type TGroupInfiniteCardsProps = {
  whereFilter: Record<string, any> | null
  orderByFilter: GroupOrder[] | GroupOrder | undefined
}

const GroupInfiniteCards = ({ whereFilter, orderByFilter }: TGroupInfiniteCardsProps) => {
  const [cardPagination, setCardPagination] = useState<TPagination>(CARD_DEFAULT_PAGINATION)
  const { groups, isError, paginationMeta, fetchNextPage } = useGetAllGroupsInfinite({
    where: whereFilter,
    orderBy: orderByFilter,
    pagination: cardPagination,
    enabled: !!whereFilter,
  })

  const handlePaginationChange = (pagination: TPagination) => {
    setCardPagination(pagination)
  }

  useEffect(() => {
    if (cardPagination.page === 1) {
      return
    }
    fetchNextPage()
  }, [cardPagination])

  return (
    <InfiniteScroll pagination={cardPagination} onPaginationChange={handlePaginationChange} paginationMeta={paginationMeta} key="card">
      <GroupsCard isError={isError} groups={groups} />
    </InfiniteScroll>
  )
}

export default GroupInfiniteCards
