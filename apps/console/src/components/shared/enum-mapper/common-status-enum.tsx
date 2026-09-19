import React from 'react'
import { Circle, CircleCheck, CircleOff, ScanEye, Timer } from 'lucide-react'
import { type ReviewReviewStatus, TaskTaskStatus } from '@repo/codegen/src/schema'

export const CommonStatusIcons = {
  [TaskTaskStatus.COMPLETED]: <CircleCheck height={16} width={16} className="text-completed shrink-0" />,
  [TaskTaskStatus.IN_PROGRESS]: <Timer height={16} width={16} className="text-in-progress shrink-0" />,
  [TaskTaskStatus.IN_REVIEW]: <ScanEye height={16} width={16} className="text-in-review shrink-0" />,
  [TaskTaskStatus.OPEN]: <Circle height={16} width={16} className="text-open shrink-0" />,
  [TaskTaskStatus.WONT_DO]: <CircleOff height={16} width={16} className="text-wont-do shrink-0" />,
} satisfies Record<TaskTaskStatus, React.ReactNode> & Record<ReviewReviewStatus, React.ReactNode>
