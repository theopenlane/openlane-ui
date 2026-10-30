import { RemediationRemediationStatus } from '@repo/codegen/src/schema'
import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'
import { CommonStatusIconLabel } from '@/components/shared/enum-mapper/common-status-enum'

export const RemediationStatusOptions = enumToOptions(RemediationRemediationStatus)

export const RemediationStatusIconLabel = CommonStatusIconLabel
