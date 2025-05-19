import { RiskRiskStatus } from '@repo/codegen/src/schema.ts'

export const RisksStatusMapper: Record<RiskRiskStatus, string> = {
  [RiskRiskStatus.ONGOING]: 'Ongoing',
  [RiskRiskStatus.MITIGATED]: 'Mitigated',
  [RiskRiskStatus.IN_PROGRESS]: 'In progress',
  [RiskRiskStatus.OPEN]: 'Open',
  [RiskRiskStatus.ARCHIVED]: 'Archived',
}
