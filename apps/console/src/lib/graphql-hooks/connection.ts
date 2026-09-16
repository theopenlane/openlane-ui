import { type PageInfo } from '@repo/codegen/src/schema'

export type Edge<T> = { node?: T | null } | null

export type Connection<T> = {
  edges?: Array<Edge<T>> | null
  totalCount?: number | null
  pageInfo?: PageInfo | null
}

export const getNodes = <T>(connection?: Connection<T> | null): T[] => (connection?.edges ?? []).flatMap((edge) => (edge?.node ? [edge.node] : []))
