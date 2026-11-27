import { ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types'
import { getFindingSeverity, getFindingTitle } from '@/components/pages/protected/findings/finding-display'
import { getVulnerabilitySeverity, getVulnerabilityTitle } from '@/components/pages/protected/vulnerabilities/vulnerability-display'
import { type AssetFindingNode, type AssetRiskNode, type AssetVulnerabilityNode, CLOSED_RISK_STATUSES } from '@/lib/graphql-hooks/asset-detail'
import { isSlaPastDue, type SlaDaysByLevel } from '@/lib/sla'
import { SEVERITY_LEVELS, toSeverityLevel, type TSeverityLevel } from '@/utils/severity'
import { getSlaDueDate } from '@/utils/vulnerability-due-date'

export type TExposureKind = ObjectAssociationNodeEnum.VULNERABILITY | ObjectAssociationNodeEnum.FINDING | ObjectAssociationNodeEnum.RISKS

export const EXPOSURE_KINDS: TExposureKind[] = [ObjectAssociationNodeEnum.VULNERABILITY, ObjectAssociationNodeEnum.FINDING, ObjectAssociationNodeEnum.RISKS]

export type TExposureItem = {
  id: string
  kind: TExposureKind
  title: string
  subtitle: string | null
  severity: string | null
  level: TSeverityLevel | null
  isOpen: boolean
  status: string | null
  source: string | null
  sourceDefinitionID: string | null
  dueDate: Date | null
  createdAt: string | null
  createdBy: string | null
}

const subtitleFor = (title: string, ...candidates: (string | null | undefined)[]) => candidates.find((candidate) => candidate?.trim() && candidate.trim() !== title)?.trim() ?? null

type TExposureNodes = {
  vulnerabilities?: AssetVulnerabilityNode[]
  findings?: AssetFindingNode[]
  risks?: AssetRiskNode[]
}

export const buildExposureItems = ({ vulnerabilities = [], findings = [], risks = [] }: TExposureNodes, slaDaysByLevel: SlaDaysByLevel): TExposureItem[] => {
  const items: TExposureItem[] = [
    ...vulnerabilities.map((node): TExposureItem => {
      const title = getVulnerabilityTitle(node)
      const severity = getVulnerabilitySeverity(node)
      return {
        id: node.id,
        kind: ObjectAssociationNodeEnum.VULNERABILITY,
        title,
        subtitle: subtitleFor(title, node.summary, node.displayName),
        severity,
        level: toSeverityLevel(severity),
        isOpen: node.open === true,
        status: node.vulnerabilityStatusName ?? null,
        source: node.source?.trim() || null,
        sourceDefinitionID: node.sourceDefinitionID ?? null,
        dueDate: getSlaDueDate(node, slaDaysByLevel),
        createdAt: node.createdAt ?? null,
        createdBy: node.createdBy ?? null,
      }
    }),
    ...findings.map((node): TExposureItem => {
      const title = getFindingTitle(node)
      const severity = getFindingSeverity(node)
      return {
        id: node.id,
        kind: ObjectAssociationNodeEnum.FINDING,
        title,
        subtitle: subtitleFor(title, node.category),
        severity,
        level: toSeverityLevel(severity),
        isOpen: node.open === true,
        status: node.findingStatusName ?? null,
        source: node.source?.trim() || null,
        sourceDefinitionID: node.sourceDefinitionID ?? null,
        dueDate: getSlaDueDate(node, slaDaysByLevel),
        createdAt: node.createdAt ?? null,
        createdBy: node.createdBy ?? null,
      }
    }),
    ...risks.map((node): TExposureItem => ({
      id: node.id,
      kind: ObjectAssociationNodeEnum.RISKS,
      title: node.name,
      subtitle: subtitleFor(node.name, node.displayID),
      severity: node.impact ?? null,
      level: toSeverityLevel(node.impact),
      isOpen: !node.status || !CLOSED_RISK_STATUSES.includes(node.status),
      status: node.status ?? null,
      source: null,
      sourceDefinitionID: node.sourceDefinitionID ?? null,
      dueDate: node.dueDate ? new Date(node.dueDate) : null,
      createdAt: node.createdAt ?? null,
      createdBy: node.createdBy ?? null,
    })),
  ]

  const rank = (item: TExposureItem) => (item.level ? SEVERITY_LEVELS.indexOf(item.level) : SEVERITY_LEVELS.length)
  const due = (item: TExposureItem) => item.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER
  return items.sort((a, b) => Number(b.isOpen) - Number(a.isOpen) || rank(a) - rank(b) || due(a) - due(b))
}

export const isExposurePastDue = (item: TExposureItem) => item.isOpen && isSlaPastDue(item.dueDate)
