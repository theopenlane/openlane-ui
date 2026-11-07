export type Edge<T> = { node?: T | null } | null

export const getNodes = <T>(connection?: { edges?: Array<Edge<T>> | null } | null): T[] => (connection?.edges ?? []).flatMap((edge) => (edge?.node ? [edge.node] : []))
