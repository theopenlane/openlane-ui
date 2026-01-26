export type TPaginationQuery = {
  first?: number
  after?: string | null
  last?: number
  before?: string | null
}

export type TPagination = {
  page: number
  pageSize: number
  query: TPaginationQuery
}

export type TPageInfo = {
  endCursor?: any | null
  startCursor?: any | null
  hasNextPage?: boolean
  hasPreviousPage?: boolean
}

export type TPaginationMeta = { totalCount?: number; pageInfo?: TPageInfo; isLoading?: boolean }
