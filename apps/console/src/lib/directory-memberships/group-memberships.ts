import { DirectoryMembershipDirectoryMembershipRole } from '@repo/codegen/src/schema'

export type GroupedMembership = {
  id: string
  groupName: string
  addedAt: string | null
  removedAt: string | null
}

export type MembershipRoleBucket = {
  items: GroupedMembership[]
  totalCount: number
}

export type MembershipsByRole = Record<DirectoryMembershipDirectoryMembershipRole, MembershipRoleBucket>

type MembershipEdgeNode = {
  id: string
  addedAt?: string | null
  removedAt?: string | null
  directoryGroup: { displayName?: string | null }
}

type MembershipEdge = { node?: MembershipEdgeNode | null } | null

export type MembershipConnection = {
  totalCount: number
  edges?: ReadonlyArray<MembershipEdge> | null
}

type RoleConnections = {
  owner?: MembershipConnection | null
  manager?: MembershipConnection | null
  member?: MembershipConnection | null
}

const emptyBucket = (): MembershipRoleBucket => ({ items: [], totalCount: 0 })

const compareMemberships = (a: GroupedMembership, b: GroupedMembership): number => {
  const aActive = a.removedAt === null
  const bActive = b.removedAt === null
  if (aActive !== bActive) return aActive ? -1 : 1
  if (!aActive && !bActive) {
    const diff = new Date(b.removedAt as string).getTime() - new Date(a.removedAt as string).getTime()
    if (diff !== 0) return diff
  }
  return b.groupName.localeCompare(a.groupName)
}

const connectionToBucket = (connection: MembershipConnection | null | undefined): MembershipRoleBucket => {
  if (!connection) return emptyBucket()
  const items: GroupedMembership[] = []
  for (const edge of connection.edges ?? []) {
    const node = edge?.node
    if (!node) continue
    items.push({
      id: node.id,
      groupName: node.directoryGroup?.displayName ?? '—',
      addedAt: node.addedAt ?? null,
      removedAt: node.removedAt ?? null,
    })
  }
  items.sort(compareMemberships)
  return { items, totalCount: connection.totalCount }
}

export const buildMembershipsByRole = (connections: RoleConnections): MembershipsByRole => ({
  [DirectoryMembershipDirectoryMembershipRole.OWNER]: connectionToBucket(connections.owner),
  [DirectoryMembershipDirectoryMembershipRole.MANAGER]: connectionToBucket(connections.manager),
  [DirectoryMembershipDirectoryMembershipRole.MEMBER]: connectionToBucket(connections.member),
})

export const totalMembershipCount = (memberships: MembershipsByRole): number =>
  memberships[DirectoryMembershipDirectoryMembershipRole.OWNER].totalCount +
  memberships[DirectoryMembershipDirectoryMembershipRole.MANAGER].totalCount +
  memberships[DirectoryMembershipDirectoryMembershipRole.MEMBER].totalCount

export const ROLE_ORDER: ReadonlyArray<{ key: DirectoryMembershipDirectoryMembershipRole; label: string }> = [
  { key: DirectoryMembershipDirectoryMembershipRole.OWNER, label: 'Owners' },
  { key: DirectoryMembershipDirectoryMembershipRole.MANAGER, label: 'Managers' },
  { key: DirectoryMembershipDirectoryMembershipRole.MEMBER, label: 'Members' },
]
