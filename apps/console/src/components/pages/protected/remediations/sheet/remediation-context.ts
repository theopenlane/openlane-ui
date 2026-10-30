import { type GetRemediationContextSubjectQuery, type RemediationQuery } from '@repo/codegen/src/schema'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types'
import { getVulnerabilitySeverity, getVulnerabilityTitle } from '@/components/pages/protected/vulnerabilities/vulnerability-display'
import { type TRemediationContextType } from '@/lib/graphql-hooks/remediation'
import { getEdgeIds } from '@/components/shared/object-association/utils'
import { toHumanLabel } from '@/utils/strings'

export type TRemediation = RemediationQuery['remediation']

export type TRemediationContextRef = {
  type: TRemediationContextType
  id: string
}

export type TRemediationContextDetail = {
  label: string
  value?: string | number | null
}

export type TRemediationContext = TRemediationContextRef & {
  heading: string
  level: string | null
  details: TRemediationContextDetail[]
  description: string | null
  environmentName: string | null
  scopeName: string | null
}

const REMEDIATION_CONTEXT_OBJECT_TYPES: Record<TRemediationContextType, ObjectTypes> = {
  [ObjectAssociationNodeEnum.VULNERABILITY]: ObjectTypes.VULNERABILITY,
  [ObjectAssociationNodeEnum.FINDING]: ObjectTypes.FINDING,
  [ObjectAssociationNodeEnum.RISKS]: ObjectTypes.RISK,
}

export const remediationContextTypeLabel = (type: TRemediationContextType) => toHumanLabel(REMEDIATION_CONTEXT_OBJECT_TYPES[type])

export const buildRemediationTitle = (heading: string) => `${heading} Remediation`

export const toRemediationContext = (ref: TRemediationContextRef, data?: GetRemediationContextSubjectQuery): TRemediationContext | undefined => {
  if (ref.type === ObjectAssociationNodeEnum.VULNERABILITY && data?.vulnerability?.id === ref.id) {
    const vulnerability = data.vulnerability
    return {
      ...ref,
      heading: vulnerability.displayName || getVulnerabilityTitle(vulnerability),
      level: getVulnerabilitySeverity(vulnerability),
      details: [
        { label: 'Source', value: vulnerability.source },
        { label: 'Score', value: vulnerability.score },
      ],
      description: vulnerability.description ?? null,
      environmentName: vulnerability.environmentName ?? null,
      scopeName: vulnerability.scopeName ?? null,
    }
  }

  if (ref.type === ObjectAssociationNodeEnum.FINDING && data?.finding?.id === ref.id) {
    const finding = data.finding
    return {
      ...ref,
      heading: finding.displayName || finding.displayID,
      level: getVulnerabilitySeverity({ severity: finding.securityLevel ?? finding.severity }),
      details: [
        { label: 'Source', value: finding.source },
        { label: 'Score', value: finding.score },
      ],
      description: finding.description ?? null,
      environmentName: finding.environmentName ?? null,
      scopeName: finding.scopeName ?? null,
    }
  }

  if (ref.type === ObjectAssociationNodeEnum.RISKS && data?.risk?.id === ref.id) {
    const risk = data.risk
    return {
      ...ref,
      heading: risk.name || risk.displayID,
      level: risk.impact ?? null,
      details: [
        { label: 'Category', value: risk.riskCategoryName },
        { label: 'Score', value: risk.score },
      ],
      description: risk.details ?? null,
      environmentName: risk.environmentName ?? null,
      scopeName: risk.scopeName ?? null,
    }
  }

  return undefined
}

export const getRemediationContextRef = (remediation?: TRemediation): TRemediationContextRef | undefined => {
  const vulnerabilityId = getEdgeIds(remediation?.vulnerabilities?.edges)[0]
  if (vulnerabilityId) return { type: ObjectAssociationNodeEnum.VULNERABILITY, id: vulnerabilityId }

  const findingId = getEdgeIds(remediation?.findings?.edges)[0]
  if (findingId) return { type: ObjectAssociationNodeEnum.FINDING, id: findingId }

  const riskId = getEdgeIds(remediation?.risks?.edges)[0]
  if (riskId) return { type: ObjectAssociationNodeEnum.RISKS, id: riskId }

  return undefined
}

export const contextLinkInput = (ref: TRemediationContextRef) => {
  switch (ref.type) {
    case ObjectAssociationNodeEnum.VULNERABILITY:
      return { vulnerabilityIDs: [ref.id] }
    case ObjectAssociationNodeEnum.FINDING:
      return { findingIDs: [ref.id] }
    case ObjectAssociationNodeEnum.RISKS:
      return { riskIDs: [ref.id] }
  }
}
