import { type UpdateFindingInput } from '@repo/codegen/src/schema'
import { responsibilityTargetFor } from '@/components/shared/crud-base/form-fields/responsibility-field-utils'

const findingResponsibilityTarget = responsibilityTargetFor<UpdateFindingInput>()

export const FINDING_INTERNAL_OWNER = findingResponsibilityTarget('internalOwner')
export const FINDING_ASSIGNEE = findingResponsibilityTarget('assignedTo')
export const FINDING_REVIEWER = findingResponsibilityTarget('reviewedBy')
