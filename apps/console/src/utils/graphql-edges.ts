export const edgeNodes = <TNode>(connection?: { edges?: Array<{ node?: TNode | null } | null> | null } | null): TNode[] => (connection?.edges ?? []).flatMap((edge) => (edge?.node ? [edge.node] : []))

export const firstEdgeNode = <TNode>(connection?: { edges?: Array<{ node?: TNode | null } | null> | null } | null): TNode | null => edgeNodes(connection)[0] ?? null
