export type MembershipVendor = {
  id: string
  name: string
}

export type GroupedMembership = {
  id: string
  groupId: string | null
  groupName: string
  role: string
  addedAt: string | null
  removedAt: string | null
  vendor: MembershipVendor | null
}

export type MembershipList = {
  items: GroupedMembership[]
  totalCount: number
}

type MembershipEntityEdge = { node?: { id?: string | null; name?: string | null } | null } | null

type MembershipEntityConnection = {
  edges?: ReadonlyArray<MembershipEntityEdge> | null
}

type MembershipIntegration = {
  id?: string | null
  entities?: MembershipEntityConnection | null
}

type MembershipEdgeNode = {
  id: string
  role?: string | null
  addedAt?: string | null
  removedAt?: string | null
  createdAt?: string | null
  directoryGroup: {
    id?: string | null
    displayName?: string | null
    integration?: MembershipIntegration | null
  }
}

type MembershipEdge = { node?: MembershipEdgeNode | null } | null

export type MembershipConnection = {
  totalCount: number
  edges?: ReadonlyArray<MembershipEdge> | null
}

export const resolveSingleEntityVendor = (entities: MembershipEntityConnection | null | undefined): MembershipVendor | null => {
  const edges = entities?.edges ?? []
  const nodes = edges.flatMap((edge) => {
    const node = edge?.node
    if (!node?.id || !node.name) return []
    return [{ id: node.id, name: node.name }]
  })
  return nodes.length === 1 ? nodes[0] : null
}

const compareMemberships = (a: GroupedMembership, b: GroupedMembership): number => {
  const aActive = a.removedAt === null
  const bActive = b.removedAt === null
  if (aActive !== bActive) return aActive ? -1 : 1
  if (a.removedAt && b.removedAt) {
    const diff = new Date(b.removedAt).getTime() - new Date(a.removedAt).getTime()
    if (diff !== 0) return diff
  }
  return b.groupName.localeCompare(a.groupName)
}

export const buildMembershipList = (connection: MembershipConnection | null | undefined): MembershipList => {
  const items: GroupedMembership[] = []
  if (!connection) return { items, totalCount: 0 }
  for (const edge of connection.edges ?? []) {
    const node = edge?.node
    if (!node) continue
    items.push({
      id: node.id,
      groupId: node.directoryGroup?.id ?? null,
      groupName: node.directoryGroup?.displayName ?? '—',
      role: node.role ?? '',
      addedAt: node.addedAt ?? node.createdAt ?? null,
      removedAt: node.removedAt ?? null,
      vendor: resolveSingleEntityVendor(node.directoryGroup?.integration?.entities),
    })
  }
  items.sort(compareMemberships)
  return { items, totalCount: connection.totalCount }
}
