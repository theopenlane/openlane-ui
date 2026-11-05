import { type VulnerabilityWhereInput } from '@repo/codegen/src/schema'
import { type TVulnerabilityDueDateSource } from '@/utils/vulnerability-due-date'

export type TSnoozeVulnerability = TVulnerabilityDueDateSource & { id: string; cveID?: string | null }

export const matchingCveWhere = (vulnerability: TSnoozeVulnerability): VulnerabilityWhereInput | null =>
  vulnerability.cveID ? { cveIDEqualFold: vulnerability.cveID, open: true, idNEQ: vulnerability.id } : null
