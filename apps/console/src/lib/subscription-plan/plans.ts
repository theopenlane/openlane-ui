import { type ObjectTypes } from '@repo/codegen/src/type-names'
import { PlanEnum } from '@/lib/subscription-plan/plan-enum.ts'
import { MODULES_BY_OBJECT_TYPE } from '@/lib/subscription-plan/object-type-modules.ts'
import { type Addon, type Module, type OpenlaneProductsResponse } from '@/types/stripe.ts'
import { type Session } from 'next-auth'
import { isImpersonation } from '../authz/utils'

const PLAN_NAMES: Record<PlanEnum, string> = {
  [PlanEnum.BASE_MODULE]: 'Base',
  [PlanEnum.COMPLIANCE_MODULE]: 'Compliance',
  [PlanEnum.ENTITY_MANAGEMENT_MODULE]: 'Entity Management',
  [PlanEnum.REGISTRY_MODULE]: 'Registry',
  [PlanEnum.TRUST_CENTER_MODULE]: 'Trust Center',
  [PlanEnum.VULNERABILITY_MANAGEMENT_MODULE]: 'Vulnerability Management',
  [PlanEnum.DOMAIN_SCANNING_ADDON]: 'Domain Scanning',
  [PlanEnum.EXTRA_EVIDENCE_STORAGE_ADDON]: 'Extra Evidence Storage',
  [PlanEnum.POLICY_MANAGEMENT_ADDON]: 'Policy Management',
  [PlanEnum.RISK_MANAGEMENT_ADDON]: 'Risk Management',
}

export const arePlanChecksDisabled = () => process.env.NEXT_PUBLIC_ENABLE_PLAN === 'false'

export const featureUtil = {
  notAvailableText: 'Not available in your current plan',
  notAvailableFullText: 'Forbidden. This feature is not available in your current subscription plan. Please upgrade your plan from your billing settings to access this feature.',

  // object types that are not module gated have no entry, so they require nothing
  getUpgradeModules: (objectType: ObjectTypes): PlanEnum[] => MODULES_BY_OBJECT_TYPE[objectType] ?? [],

  getPlanProduct: (plan: PlanEnum, products: OpenlaneProductsResponse | undefined): Module | Addon | undefined => products?.modules?.[plan] ?? products?.addons?.[plan],

  getPlanDescription: (plan: PlanEnum, products: OpenlaneProductsResponse | undefined) => {
    const product = featureUtil.getPlanProduct(plan, products)
    return product?.marketing_description ?? product?.description
  },

  getPlanName: (plan: PlanEnum) => PLAN_NAMES[plan],

  hasModule: (userModules: PlanEnum[], requiredModule: PlanEnum, session?: Session | null): boolean => {
    // support role has no modules, skip check
    if (arePlanChecksDisabled() || isImpersonation(session)) {
      return true
    }

    return userModules.includes(requiredModule)
  },

  hasObjectType: (userModules: PlanEnum[], objectType: ObjectTypes, session?: Session | null): boolean => {
    if (arePlanChecksDisabled() || isImpersonation(session)) {
      return true
    }

    const requiredModules = featureUtil.getUpgradeModules(objectType)

    return requiredModules.length === 0 || requiredModules.some((module) => userModules.includes(module))
  },

  hasNoModules: (session: Session | null): boolean => {
    if (!session) {
      return false
    }

    // support role has no modules return so should skip check
    if (isImpersonation(session)) {
      return false
    }

    if (arePlanChecksDisabled()) {
      return false
    }

    const modules = session.user?.modules ?? []

    return modules.length === 0
  },
}
