import { type CreateActionPlanInput, type UpdateActionPlanInput } from '@repo/codegen/src/schema'
import { type Value } from 'platejs'
import { type ActionPlansNodeNonNull } from '@/lib/graphql-hooks/action-plan'
import { buildResponsibilityTargetPayload, normalizeEntityData, responsibilityTargetFor } from '@/components/shared/crud-base/form-fields/responsibility-field-utils'
import { type ActionPlanFormData } from './hooks/use-form-schema'

export const ACTION_PLAN_INTERNAL_OWNER = responsibilityTargetFor<UpdateActionPlanInput>()('internalOwner')

export const normalizeActionPlanData = (data: ActionPlansNodeNonNull) =>
  normalizeEntityData(data, {
    internalOwner: { personnel: data.internalOwnerIdentityHolder, user: data.internalOwnerUser, group: data.internalOwnerGroup, stringValue: data.internalOwner },
  })

type TBuildActionPlanPayloadOptions = {
  isCreate: boolean
  isInternalOwnerDirty: boolean
  createInitialPayload?: Partial<CreateActionPlanInput>
  convertToHtml: (value: Value) => Promise<string>
}

export const buildActionPlanPayload = async (formData: ActionPlanFormData, { isCreate, isInternalOwnerDirty, createInitialPayload, convertToHtml }: TBuildActionPlanPayloadOptions) => {
  const { internalOwner, descriptionJSON, ...rest } = formData
  const payload = {
    ...rest,
    description: descriptionJSON ? await convertToHtml(descriptionJSON) : undefined,
    ...buildResponsibilityTargetPayload(ACTION_PLAN_INTERNAL_OWNER, internalOwner, { isCreate, isDirty: isInternalOwnerDirty }),
  }
  return isCreate && createInitialPayload ? { ...createInitialPayload, ...payload } : payload
}
