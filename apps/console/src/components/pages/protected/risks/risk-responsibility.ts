import { type UpdateRiskInput } from '@repo/codegen/src/schema'
import { responsibilityTargetFor } from '@/components/shared/crud-base/form-fields/responsibility-field-utils'

const riskResponsibilityTarget = responsibilityTargetFor<UpdateRiskInput>()

export const RISK_STAKEHOLDER = riskResponsibilityTarget('stakeholder', 'stakeholderName')
export const RISK_DELEGATE = riskResponsibilityTarget('delegate', 'delegateName')
