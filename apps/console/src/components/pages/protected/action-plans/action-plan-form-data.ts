import { type CreateActionPlanInput, type UpdateActionPlanInput } from '@repo/codegen/src/schema'
import { type ActionPlansNodeNonNull } from '@/lib/graphql-hooks/action-plan'
import { buildResponsibilityCreatePayload, normalizeEntityData, responsibilityTargetFor } from '@/components/shared/crud-base/form-fields/responsibility-field-utils'
import { plateToHtmlOrNull, type TPlateHtmlConverter } from '@/components/shared/plate/plate-utils'
import { type ActionPlanFormData } from './hooks/use-form-schema'

export const ACTION_PLAN_INTERNAL_OWNER = responsibilityTargetFor<UpdateActionPlanInput>()('internalOwner')

export const normalizeActionPlanData = (data: ActionPlansNodeNonNull) =>
  normalizeEntityData(data, {
    internalOwner: { personnel: data.internalOwnerIdentityHolder, user: data.internalOwnerUser, group: data.internalOwnerGroup, stringValue: data.internalOwner },
  })

type TBuildActionPlanCreatePayloadOptions = {
  createInitialPayload?: Partial<CreateActionPlanInput>
  converter: TPlateHtmlConverter
}

export const buildActionPlanCreatePayload = async (formData: ActionPlanFormData, { createInitialPayload, converter }: TBuildActionPlanCreatePayloadOptions) => {
  const { internalOwner, descriptionJSON, ...rest } = formData
  const payload = {
    ...rest,
    description: (await plateToHtmlOrNull(descriptionJSON, converter)) ?? undefined,
    ...buildResponsibilityCreatePayload(ACTION_PLAN_INTERNAL_OWNER, internalOwner),
  }
  return createInitialPayload ? { ...createInitialPayload, ...payload } : payload
}
