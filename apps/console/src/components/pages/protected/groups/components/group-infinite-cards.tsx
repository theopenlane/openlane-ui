import GroupsCard from '@/components/pages/protected/groups/components/groups-cards.tsx'
import InfiniteScroll from '@repo/ui/infinite-scroll'
import React, { useEffect } from 'react'
import { useGetAllGroupsInfinite } from '@/lib/graphql-hooks/group'
import { type GroupOrder, type GroupWhereInput } from '@repo/codegen/src/schema.ts'
import { CARD_DEFAULT_PAGINATION } from '@/constants/pagination.ts'
import { useOrgTablePagination } from '@/hooks/use-org-table-state'

type TGroupInfiniteCardsProps = {
  whereFilter: GroupWhereInput | null
  orderByFilter: GroupOrder[] | GroupOrder | undefined
}

const GroupInfiniteCards = ({ whereFilter, orderByFilter }: TGroupInfiniteCardsProps) => {
  const [cardPagination, setCardPagination] = useOrgTablePagination(CARD_DEFAULT_PAGINATION)
  const { groups, isError, paginationMeta, fetchNextPage } = useGetAllGroupsInfinite({
    where: whereFilter,
    orderBy: orderByFilter,
    pagination: cardPagination,
    enabled: !!whereFilter,
  })

  useEffect(() => {
    if (cardPagination.page === 1) {
      return
    }
    fetchNextPage()
  }, [cardPagination, fetchNextPage])

  return (
    <InfiniteScroll pagination={cardPagination} onPaginationChange={setCardPagination} paginationMeta={paginationMeta} key="card">
      <GroupsCard isError={isError} groups={groups} />
    </InfiniteScroll>
  )
}

export default GroupInfiniteCards
