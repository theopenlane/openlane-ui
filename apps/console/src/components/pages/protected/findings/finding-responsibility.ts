import { normalizeEntityData, responsibilityTargetFor } from '@/components/shared/crud-base/form-fields/responsibility-field-utils'
import { type FindingDetailNode } from '@/lib/graphql-hooks/finding'
import { type UpdateFindingInput } from '@repo/codegen/src/schema'

const findingResponsibilityTarget = responsibilityTargetFor<UpdateFindingInput>()

export const FINDING_INTERNAL_OWNER = findingResponsibilityTarget('internalOwner')
export const FINDING_ASSIGNEE = findingResponsibilityTarget('assignedTo')
export const FINDING_REVIEWER = findingResponsibilityTarget('reviewedBy')

export const FINDING_RESPONSIBILITIES = { owner: FINDING_INTERNAL_OWNER, assignee: FINDING_ASSIGNEE, reviewer: FINDING_REVIEWER }

export const normalizeFindingData = (data: FindingDetailNode) =>
  normalizeEntityData(data, {
    internalOwner: { personnel: data.internalOwnerIdentityHolder, user: data.internalOwnerUser, group: data.internalOwnerGroup, stringValue: data.internalOwner },
    assignedTo: { personnel: data.assignedToIdentityHolder, user: data.assignedToUser, group: data.assignedToGroup, stringValue: data.assignedTo },
    reviewedBy: { personnel: data.reviewedByIdentityHolder, user: data.reviewedByUser, group: data.reviewedByGroup, stringValue: data.reviewedBy },
  })
