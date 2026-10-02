import React from 'react'
import { Circle, CircleAlert, CircleCheck, CircleDashed, CircleHelp, Send } from 'lucide-react'
import { AssessmentResponseAssessmentResponseStatus, type CampaignTargetAssessmentResponseStatus } from '@repo/codegen/src/schema'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'

type AssessmentResponseStatus = AssessmentResponseAssessmentResponseStatus | CampaignTargetAssessmentResponseStatus

const UNKNOWN_ICON = <CircleHelp height={16} width={16} className="text-muted-foreground shrink-0" />

const ASSESSMENT_RESPONSE_STATUS_ICON = {
  [AssessmentResponseAssessmentResponseStatus.DRAFT]: <CircleDashed height={16} width={16} className="text-muted-foreground shrink-0" />,
  [AssessmentResponseAssessmentResponseStatus.NOT_STARTED]: <Circle height={16} width={16} className="text-not-started shrink-0" />,
  [AssessmentResponseAssessmentResponseStatus.SENT]: <Send height={16} width={16} className="text-in-progress shrink-0" />,
  [AssessmentResponseAssessmentResponseStatus.OVERDUE]: <CircleAlert height={16} width={16} className="text-failed shrink-0" />,
  [AssessmentResponseAssessmentResponseStatus.COMPLETED]: <CircleCheck height={16} width={16} className="text-completed shrink-0" />,
} satisfies Record<AssessmentResponseAssessmentResponseStatus, React.ReactNode> & Record<CampaignTargetAssessmentResponseStatus, React.ReactNode>

export const AssessmentResponseStatusLabel = ({ status }: { status: AssessmentResponseStatus }) => (
  <div className="flex items-center gap-2">
    {ASSESSMENT_RESPONSE_STATUS_ICON[status] ?? UNKNOWN_ICON}
    <span>{getEnumLabel(status)}</span>
  </div>
)
