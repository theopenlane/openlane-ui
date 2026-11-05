import { FindingSecurityLevel } from '@repo/codegen/src/schema'
import { getObjectDisplayName, type TObjectNameSource } from '@/utils/object-display-name'
import { buildExposureTaskDefaults } from '../exposure/detail/remediation/task-defaults'

export const getFindingTitle = (finding: Pick<TObjectNameSource, 'displayName' | 'externalID' | 'displayID'>) => getObjectDisplayName(finding) || 'Finding'

type TFindingSeveritySource = {
  securityLevel?: FindingSecurityLevel | null
  severity?: string | null
}

export const getFindingSeverity = ({ securityLevel, severity }: TFindingSeveritySource): string | null => {
  const level = securityLevel && securityLevel !== FindingSecurityLevel.NONE ? securityLevel : severity?.trim()
  return level || null
}

export const buildFindingTaskDefaults = (title: string, assigneeID: string | undefined) => buildExposureTaskDefaults('Finding', title, assigneeID)
