import { RemediationRemediationStatus } from '@repo/codegen/src/schema'
import { SelectContent, SelectItem } from '@repo/ui/select'
import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'
import { CommonStatusIconLabel } from '@/components/shared/enum-mapper/common-status-enum'

export const RemediationStatusOptions = enumToOptions(RemediationRemediationStatus)

export const RemediationStatusIconLabel = CommonStatusIconLabel

const REMEDIATION_STATUSES = Object.values(RemediationRemediationStatus)

export const RemediationStatusSelectContent = () => (
  <SelectContent>
    {REMEDIATION_STATUSES.map((status) => (
      <SelectItem key={status} value={status}>
        <RemediationStatusIconLabel status={status} />
      </SelectItem>
    ))}
  </SelectContent>
)
