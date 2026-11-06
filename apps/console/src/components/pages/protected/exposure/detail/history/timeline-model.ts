import { ObjectTypes } from '@repo/codegen/src/type-names'
import { type TimelineNode } from '@/lib/graphql-hooks/associations-timeline'
import { type Connection, getNodes } from '@/lib/graphql-hooks/connection'
import { ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types'
import { htmlToInlineText } from '@/lib/html/html-to-text'
import { formatDate } from '@/utils/date'
import { toHumanLabel } from '@/utils/strings'
import { exposureAssetLabel } from '../exposure-asset-label'
import { type TOwnershipChange } from './history-events'

const COMMENT_EXCERPT_LENGTH = 80

type TResolveAuthor = (id: string | null | undefined) => string | null

type THistoryEdgeNode = {
  id: string
  createdAt?: string | null
  createdBy?: string | null
  title?: string | null
  displayID?: string | null
  name?: string
  displayName?: string | null
  text?: string
}

type THistoryEdge = {
  key: 'tasks' | 'comments' | 'assets' | 'remediations' | 'reviews'
  noun: string
  type: string
  verb: string
  sheetKind?: ObjectAssociationNodeEnum
  name: (node: THistoryEdgeNode) => string
}

const commentExcerpt = (value: string | undefined) => {
  const plain = htmlToInlineText(value ?? '')
  return plain.length > COMMENT_EXCERPT_LENGTH ? `${plain.slice(0, COMMENT_EXCERPT_LENGTH)}…` : plain || 'Comment'
}

const HISTORY_EDGES: THistoryEdge[] = [
  { key: 'tasks', noun: 'task', type: toHumanLabel(ObjectTypes.TASK), verb: 'created', sheetKind: ObjectAssociationNodeEnum.TASK, name: (node) => node.title || node.displayID || node.id },
  { key: 'comments', noun: 'comment', type: 'Comment', verb: 'added', name: (node) => commentExcerpt(node.text) },
  {
    key: 'assets',
    noun: 'asset',
    type: toHumanLabel(ObjectTypes.ASSET),
    verb: 'created',
    sheetKind: ObjectAssociationNodeEnum.ASSET,
    name: (node) => exposureAssetLabel({ name: node.name ?? node.id, displayName: node.displayName }),
  },
  {
    key: 'remediations',
    noun: 'remediation',
    type: toHumanLabel(ObjectTypes.REMEDIATION),
    verb: 'created',
    sheetKind: ObjectAssociationNodeEnum.REMEDIATION,
    name: (node) => node.title || node.displayID || node.id,
  },
  { key: 'reviews', noun: 'review', type: toHumanLabel(ObjectTypes.REVIEW), verb: 'created', sheetKind: ObjectAssociationNodeEnum.REVIEW, name: (node) => node.title || node.id },
]

export type TExposureHistoryEdges = Record<THistoryEdge['key'], Connection<THistoryEdgeNode> & { totalCount: number }>

const edgeNodes = (edges: TExposureHistoryEdges | undefined, key: THistoryEdge['key']): THistoryEdgeNode[] => (edges ? getNodes(edges[key]) : [])

const byLine = (phrase: string, actorId: string | null | undefined, at: string, resolveAuthor: TResolveAuthor) => {
  const actor = actorId ? resolveAuthor(actorId) : null
  return `${phrase}${actor ? ` by ${actor}` : ''} on ${formatDate(at)}`
}

export const historyEdgeAuthorIds = (edges: TExposureHistoryEdges | undefined) => HISTORY_EDGES.flatMap(({ key }) => edgeNodes(edges, key).map((node) => node.createdBy))

export type TExposureHistoryEntity = {
  id: string
  createdAt?: string | null
  createdBy?: string | null
  source?: string | null
}

type TBuildArgs = {
  edges: TExposureHistoryEdges | undefined
  ownershipChanges: TOwnershipChange[]
  entity: TExposureHistoryEntity
  title: string
  objectType: ObjectTypes
  entityName: string
  resolveAuthor: TResolveAuthor
}

const isBefore = (at: string, reference: string) => new Date(at).getTime() < new Date(reference).getTime()

export const buildExposureTimeline = ({ edges, ownershipChanges, entity, title, objectType, entityName, resolveAuthor }: TBuildArgs): TimelineNode[] => {
  const entityCreatedAt = entity.createdAt
  const linked: TimelineNode[] = HISTORY_EDGES.flatMap(({ key, type, verb, sheetKind, name }) =>
    edgeNodes(edges, key).flatMap((node) => {
      if (!node.createdAt) return []
      const created = byLine(verb, node.createdBy, node.createdAt, resolveAuthor)
      return entityCreatedAt && isBefore(node.createdAt, entityCreatedAt)
        ? [{ id: node.id, name: name(node), type, sheetKind, createdAt: entityCreatedAt, subtext: `associated with this ${entityName} · ${created}` }]
        : [{ id: node.id, name: name(node), type, sheetKind, createdAt: node.createdAt, subtext: created }]
    }),
  )

  const ownership: TimelineNode[] = ownershipChanges.map((change) => ({
    id: change.id,
    name: change.to ?? 'Unassigned',
    type: change.field,
    createdAt: change.at,
    subtext: byLine(change.from ? `changed from ${change.from}` : 'set', change.actorId, change.at, resolveAuthor),
  }))

  const creation: TimelineNode[] = entityCreatedAt
    ? [
        {
          id: entity.id,
          name: title,
          type: toHumanLabel(objectType),
          role: 'source',
          createdAt: entityCreatedAt,
          subtext: byLine(entity.source ? `created from ${entity.source}` : 'created', entity.createdBy, entityCreatedAt, resolveAuthor),
        },
      ]
    : []

  return [...linked, ...ownership, ...creation].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export const hiddenEdgeCounts = (edges: TExposureHistoryEdges | undefined) =>
  edges
    ? HISTORY_EDGES.flatMap(({ key, noun }) => {
        const hidden = edges[key].totalCount - (edges[key].edges?.length ?? 0)
        return hidden > 0 ? [{ noun, hidden }] : []
      })
    : []
