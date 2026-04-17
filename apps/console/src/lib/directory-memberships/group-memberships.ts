import { DirectoryMembershipDirectoryMembershipRole } from '@repo/codegen/src/schema'

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
  addedAt?: string | null
  removedAt?: string | null
  createdAt?: string | null
  directoryGroup: { displayName?: string | null }
}

type MembershipEdge = { node?: MembershipEdgeNode | null } | null

type MembershipConnection = {
  totalCount: number
  edges?: ReadonlyArray<MembershipEdge> | null
}

type RoleConnections = {
  owner?: MembershipConnection | null
  manager?: MembershipConnection | null
  member?: MembershipConnection | null
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

const pushConnectionItems = (target: GroupedMembership[], connection: MembershipConnection | null | undefined, role: string): number => {
  if (!connection) return 0
  for (const edge of connection.edges ?? []) {
    const node = edge?.node
    if (!node) continue
    target.push({
      id: node.id,
      groupName: node.directoryGroup?.displayName ?? '—',
      role,
      addedAt: node.addedAt ?? node.createdAt ?? null,
      removedAt: node.removedAt ?? null,
    })
  }
  return connection.totalCount
}

export const buildMembershipList = (connections: RoleConnections): MembershipList => {
  const items: GroupedMembership[] = []
  let totalCount = 0
  totalCount += pushConnectionItems(items, connections.owner, DirectoryMembershipDirectoryMembershipRole.OWNER)
  totalCount += pushConnectionItems(items, connections.manager, DirectoryMembershipDirectoryMembershipRole.MANAGER)
  totalCount += pushConnectionItems(items, connections.member, DirectoryMembershipDirectoryMembershipRole.MEMBER)
  items.sort(compareMemberships)
  return { items, totalCount }
}
