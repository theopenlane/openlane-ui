export type GroupedMembership = {
  id: string
  groupName: string
  role: string
  addedAt: string | null
  removedAt: string | null
}

export type MembershipList = {
  items: GroupedMembership[]
  totalCount: number
}

type MembershipEdgeNode = {
  id: string
  role?: string | null
  addedAt?: string | null
  removedAt?: string | null
  createdAt?: string | null
  directoryGroup: { displayName?: string | null }
}

type MembershipEdge = { node?: MembershipEdgeNode | null } | null

export type MembershipConnection = {
  totalCount: number
  edges?: ReadonlyArray<MembershipEdge> | null
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
      groupName: node.directoryGroup?.displayName ?? '—',
      role: node.role ?? '',
      addedAt: node.addedAt ?? node.createdAt ?? null,
      removedAt: node.removedAt ?? null,
    })
  }
  items.sort(compareMemberships)
  return { items, totalCount: connection.totalCount }
}
