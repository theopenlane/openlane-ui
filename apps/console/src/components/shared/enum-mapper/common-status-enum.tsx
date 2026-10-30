import React from 'react'
import { Circle, CircleCheck, CircleOff, ScanEye, Timer } from 'lucide-react'
import { TruncatedCell } from '@repo/ui/data-table'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { type RemediationRemediationStatus, type ReviewReviewStatus, TaskTaskStatus } from '@repo/codegen/src/schema'

export const CommonStatusIcons = {
  [TaskTaskStatus.COMPLETED]: <CircleCheck height={16} width={16} className="text-completed shrink-0" />,
  [TaskTaskStatus.IN_PROGRESS]: <Timer height={16} width={16} className="text-in-progress shrink-0" />,
  [TaskTaskStatus.IN_REVIEW]: <ScanEye height={16} width={16} className="text-in-review shrink-0" />,
  [TaskTaskStatus.OPEN]: <Circle height={16} width={16} className="text-open shrink-0" />,
  [TaskTaskStatus.WONT_DO]: <CircleOff height={16} width={16} className="text-wont-do shrink-0" />,
} satisfies Record<TaskTaskStatus, React.ReactNode> & Record<ReviewReviewStatus, React.ReactNode> & Record<RemediationRemediationStatus, React.ReactNode>

export const CommonStatusIconLabel = ({ status }: { status?: ReviewReviewStatus | RemediationRemediationStatus | null }) =>
  status ? (
    <div className="flex items-center space-x-2">
      {CommonStatusIcons[status]}
      <TruncatedCell>{getEnumLabel(status)}</TruncatedCell>
    </div>
  ) : (
    <span className="text-muted-foreground">—</span>
  )
