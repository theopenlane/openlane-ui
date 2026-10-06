import { AssessmentResponseAssessmentResponseStatus } from '@repo/codegen/src/schema'
import { AssessmentResponseStatusIcon } from '@/components/shared/enum-mapper/assessment-response-enum'
import { type TAcknowledgementStatus } from './acknowledgement-row'

const ACKNOWLEDGEMENT_STATUS: Record<TAcknowledgementStatus, { label: string; responseStatus: AssessmentResponseAssessmentResponseStatus }> = {
  draft: { label: 'Draft', responseStatus: AssessmentResponseAssessmentResponseStatus.DRAFT },
  'in-progress': { label: 'In progress', responseStatus: AssessmentResponseAssessmentResponseStatus.SENT },
  completed: { label: 'Completed', responseStatus: AssessmentResponseAssessmentResponseStatus.COMPLETED },
}

export const AcknowledgementStatusLabel = ({ status }: { status: TAcknowledgementStatus }) => (
  <div className="flex items-center gap-2">
    <AssessmentResponseStatusIcon status={ACKNOWLEDGEMENT_STATUS[status].responseStatus} />
    <span>{ACKNOWLEDGEMENT_STATUS[status].label}</span>
  </div>
)
