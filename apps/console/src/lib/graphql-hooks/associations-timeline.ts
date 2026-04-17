'use client'

import { useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { GET_FINDING_ASSOCIATIONS_TIMELINE } from '@repo/codegen/query/finding'
import { GET_RISK_ASSOCIATIONS_TIMELINE } from '@repo/codegen/query/risk'
import { GET_VULNERABILITY_ASSOCIATIONS_TIMELINE } from '@repo/codegen/query/vulnerability'
import { GET_IDENTITY_HOLDER_ASSOCIATIONS_TIMELINE } from '@repo/codegen/query/identity-holder'
import {
  type GetFindingAssociationsTimelineQuery,
  type GetFindingAssociationsTimelineQueryVariables,
  type GetRiskAssociationsTimelineQuery,
  type GetRiskAssociationsTimelineQueryVariables,
  type GetVulnerabilityAssociationsTimelineQuery,
  type GetVulnerabilityAssociationsTimelineQueryVariables,
  type GetIdentityHolderAssociationsTimelineQuery,
  type GetIdentityHolderAssociationsTimelineQueryVariables,
} from '@repo/codegen/src/schema'
import { ObjectNames, ObjectTypes } from '@repo/codegen/src/type-names'
import { DirectoryMembershipDirectoryMembershipRole } from '@repo/codegen/src/schema'
import { formatDate } from '@/utils/date'

export type TimelineNode = {
  id: string
  name: string
  type: string
  createdAt: string
  source?: string | null
  href?: string
  role?: 'source' | 'linked'
  subtext?: string
}

type EdgeNode = {
  id: string
  createdAt?: string | null
  source?: string | null
  createdBy?: string | null
  displayID?: string | null
  displayName?: string | null
  name?: string | null
  title?: string | null
  refCode?: string | null
  target?: string | null
}

type ConnectionEdge = { node?: EdgeNode | null }
type Connection = { edges?: (ConnectionEdge | null)[] | null }

const nodeName = (node: EdgeNode, type: string): string => {
  if (type === ObjectTypes.CONTROL || type === ObjectTypes.SUBCONTROL) return node.refCode ?? node.displayID ?? node.id
  return node.displayName ?? node.name ?? node.title ?? node.target ?? node.displayID ?? node.id
}

type ExtractOptions = {
  scansAreSource?: boolean
}

const extractNodes = (connection: Connection | null | undefined, type: string, options: ExtractOptions = {}): TimelineNode[] => {
  if (!connection?.edges) return []
  const result: TimelineNode[] = []
  for (const e of connection.edges) {
    const node = e?.node
    if (!node?.createdAt) continue

    const isScan = type === ObjectTypes.SCAN
    const isRisk = type === ObjectTypes.RISK

    result.push({
      id: node.id,
      name: nodeName(node, type),
      type,
      createdAt: node.createdAt,
      source: isRisk ? (node.createdBy ?? null) : (node.source ?? (isScan ? (node.createdBy ?? null) : null)),
      href: isScan ? `/exposure/scans?id=${node.id}` : undefined,
      role: isScan && options.scansAreSource ? 'source' : 'linked',
    })
  }
  return result
}

export const useFindingTimeline = (findingId?: string) => {
  const { client } = useGraphQLClient()
  return useQuery<GetFindingAssociationsTimelineQuery>({
    queryKey: ['findingTimeline', findingId],
    enabled: !!findingId,
    staleTime: 0,
    queryFn: async () =>
      client.request<GetFindingAssociationsTimelineQuery, GetFindingAssociationsTimelineQueryVariables>(GET_FINDING_ASSOCIATIONS_TIMELINE, {
        findingId: findingId as string,
      }),
  })
}

export const extractFindingTimelineNodes = (data: GetFindingAssociationsTimelineQuery | undefined): TimelineNode[] => {
  if (!data) return []
  const f = data.finding
  return [
    ...extractNodes(f.controls as Connection, 'Control'),
    ...extractNodes(f.subcontrols as Connection, 'Subcontrol'),
    ...extractNodes(f.risks as Connection, 'Risk'),
    ...extractNodes(f.programs as Connection, 'Program'),
    ...extractNodes(f.tasks as Connection, 'Task'),
    ...extractNodes(f.assets as Connection, 'Asset'),
    ...extractNodes(f.scans as Connection, 'Scan', { scansAreSource: true }),
    ...extractNodes(f.remediations as Connection, 'Remediation'),
    ...extractNodes(f.reviews as Connection, 'Review'),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export const useRiskTimeline = (riskId?: string) => {
  const { client } = useGraphQLClient()
  return useQuery<GetRiskAssociationsTimelineQuery>({
    queryKey: ['riskTimeline', riskId],
    enabled: !!riskId,
    staleTime: 0,
    queryFn: async () =>
      client.request<GetRiskAssociationsTimelineQuery, GetRiskAssociationsTimelineQueryVariables>(GET_RISK_ASSOCIATIONS_TIMELINE, {
        riskId: riskId as string,
      }),
  })
}

export const extractRiskTimelineNodes = (data: GetRiskAssociationsTimelineQuery | undefined): TimelineNode[] => {
  if (!data) return []
  const r = data.risk
  return [
    ...extractNodes(r.procedures as Connection, 'Procedure'),
    ...extractNodes(r.controls as Connection, 'Control'),
    ...extractNodes(r.subcontrols as Connection, 'Subcontrol'),
    ...extractNodes(r.programs as Connection, 'Program'),
    ...extractNodes(r.tasks as Connection, 'Task'),
    ...extractNodes(r.assets as Connection, 'Asset'),
    ...extractNodes(r.scans as Connection, 'Scan'),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export const useVulnerabilityTimeline = (vulnerabilityId?: string) => {
  const { client } = useGraphQLClient()
  return useQuery<GetVulnerabilityAssociationsTimelineQuery>({
    queryKey: ['vulnerabilityTimeline', vulnerabilityId],
    enabled: !!vulnerabilityId,
    staleTime: 0,
    queryFn: async () =>
      client.request<GetVulnerabilityAssociationsTimelineQuery, GetVulnerabilityAssociationsTimelineQueryVariables>(GET_VULNERABILITY_ASSOCIATIONS_TIMELINE, {
        vulnerabilityId: vulnerabilityId as string,
      }),
  })
}

export const extractVulnerabilityTimelineNodes = (data: GetVulnerabilityAssociationsTimelineQuery | undefined): TimelineNode[] => {
  if (!data) return []
  const v = data.vulnerability
  return [
    ...extractNodes(v.controls as Connection, 'Control'),
    ...extractNodes(v.risks as Connection, 'Risk'),
    ...extractNodes(v.findings as Connection, 'Finding'),
    ...extractNodes(v.assets as Connection, 'Asset'),
    ...extractNodes(v.scans as Connection, 'Scan', { scansAreSource: true }),
    ...extractNodes(v.remediations as Connection, 'Remediation'),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export const useIdentityHolderTimeline = (identityHolderId?: string) => {
  const { client } = useGraphQLClient()
  return useQuery<GetIdentityHolderAssociationsTimelineQuery>({
    queryKey: ['identityHolderTimeline', identityHolderId],
    enabled: !!identityHolderId,
    staleTime: 0,
    queryFn: async () =>
      client.request<GetIdentityHolderAssociationsTimelineQuery, GetIdentityHolderAssociationsTimelineQueryVariables>(GET_IDENTITY_HOLDER_ASSOCIATIONS_TIMELINE, {
        identityHolderId: identityHolderId as string,
      }),
  })
}

export const extractIdentityHolderTimelineNodes = (data: GetIdentityHolderAssociationsTimelineQuery | undefined): TimelineNode[] => {
  const ih = data?.identityHolder
  if (!ih) return []

  const nodes: TimelineNode[] = []

  for (const edge of ih.assessmentResponses?.edges ?? []) {
    const n = edge?.node
    if (!n?.createdAt) continue
    nodes.push({
      id: n.id,
      name: n.assessment?.name ?? 'Assessment',
      type: ObjectNames.ASSESSMENT_RESPONSE,
      createdAt: n.completedAt ?? n.createdAt,
      subtext: n.completedAt ? 'filled out questionnaire' : 'assigned questionnaire',
    })
  }

  for (const edge of ih.directoryAccounts?.edges ?? []) {
    const n = edge?.node
    if (!n) continue
    const integrationName = n.integration?.name ?? n.directoryName ?? null

    const roleConnections = [
      { role: DirectoryMembershipDirectoryMembershipRole.OWNER, connection: n.ownerMemberships },
      { role: DirectoryMembershipDirectoryMembershipRole.MANAGER, connection: n.managerMemberships },
      { role: DirectoryMembershipDirectoryMembershipRole.MEMBER, connection: n.memberMemberships },
    ] as const

    const accountCreatedAt =
      n.createdAt ??
      roleConnections
        .flatMap(({ connection }) => connection?.edges ?? [])
        .map((e) => e?.node?.addedAt ?? e?.node?.createdAt ?? null)
        .filter((t): t is string => t !== null)
        .sort()[0] ??
      null

    if (accountCreatedAt) {
      nodes.push({
        id: n.id,
        name: n.displayName ?? n.canonicalEmail ?? integrationName ?? n.id,
        type: ObjectNames.DIRECTORY_ACCOUNT,
        createdAt: accountCreatedAt,
        subtext: integrationName ? `found via ${integrationName} on ${formatDate(accountCreatedAt)}` : `found via integration on ${formatDate(accountCreatedAt)}`,
      })
    }

    for (const { role, connection } of roleConnections) {
      for (const membershipEdge of connection?.edges ?? []) {
        const m = membershipEdge?.node
        if (!m) continue
        const groupName = m.directoryGroup?.displayName ?? 'group'
        const addedAt = m.addedAt ?? m.createdAt ?? null
        const roleLabel = role.toLowerCase()
        const sourceLabel = integrationName ? `${roleLabel} in ${integrationName}` : roleLabel

        if (addedAt) {
          nodes.push({
            id: `${m.id}-added`,
            name: groupName,
            type: ObjectNames.DIRECTORY_GROUP,
            createdAt: addedAt,
            subtext: `added as ${sourceLabel} on ${formatDate(addedAt)}`,
          })
        }
        if (m.removedAt) {
          nodes.push({
            id: `${m.id}-removed`,
            name: groupName,
            type: ObjectNames.DIRECTORY_GROUP,
            createdAt: m.removedAt,
            subtext: `removed as ${sourceLabel} on ${formatDate(m.removedAt)}`,
          })
        }
      }
    }
  }

  if (ih.user?.createdAt) {
    nodes.push({
      id: ih.user.id,
      name: ih.user.displayName ?? ih.user.email ?? 'Openlane user',
      type: ObjectNames.USER,
      createdAt: ih.user.createdAt,
      subtext: 'added to Openlane',
    })
  }

  return nodes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}
