import { type PageInfo } from '@repo/codegen/src/schema'
import { type Edge } from '@repo/dally/connection'

export { getNodes, type Edge } from '@repo/dally/connection'

export type Connection<T> = {
  edges?: Array<Edge<T>> | null
  totalCount?: number | null
  pageInfo?: PageInfo | null
}
