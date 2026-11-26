import React from 'react'
import { CheckResultCheckStatus } from '@repo/codegen/src/schema'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { PostureStatus, PostureStatusIcon } from '@/components/shared/enum-mapper/scan-enum'

const CHECK_RESULT_POSTURE: Record<CheckResultCheckStatus, PostureStatus> = {
  [CheckResultCheckStatus.FAIL]: PostureStatus.Bad,
  [CheckResultCheckStatus.PASS]: PostureStatus.Good,
  [CheckResultCheckStatus.UNKNOWN]: PostureStatus.Info,
}

export const CheckResultStatusLabel = ({ status }: { status: CheckResultCheckStatus }) => (
  <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
    <PostureStatusIcon status={CHECK_RESULT_POSTURE[status] ?? PostureStatus.Info} size={16} className="shrink-0" />
    {getEnumLabel(status)}
  </span>
)
