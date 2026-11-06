import { FindingSecurityLevel } from '@repo/codegen/src/schema'
import { buildExposureTaskDefaults } from '../exposure/detail/remediation/task-defaults'

type TFindingNameSource = {
  displayName?: string | null
  displayID?: string | null
  externalID?: string | null
}

export const getFindingTitle = (finding: TFindingNameSource) => finding.displayName || finding.displayID || finding.externalID || 'Finding'

type TFindingSeveritySource = {
  securityLevel?: FindingSecurityLevel | null
  severity?: string | null
}

export const getFindingSeverity = ({ securityLevel, severity }: TFindingSeveritySource): string | null => {
  const level = securityLevel && securityLevel !== FindingSecurityLevel.NONE ? securityLevel : severity?.trim()
  return level || null
}

export const buildFindingTaskDefaults = (title: string, assigneeID: string | undefined) => buildExposureTaskDefaults('Finding', title, assigneeID)
