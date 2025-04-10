export type TPaginationQuery = { first?: number; after?: string | null } | { last: number; before?: string | null } | { last: number } | { first: number }

export type TPagination = {
  page: number
  pageSize: number
  query: TPaginationQuery
}

export type TPageInfo = {
  hasNextPage: boolean
  hasPreviousPage: boolean
  endCursor?: any | null
  startCursor?: any | null
}
