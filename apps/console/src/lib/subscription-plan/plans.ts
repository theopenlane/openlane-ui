import { FeatureEnum } from './feature-enum'
import { PlanEnum } from '@/lib/subscription-plan/plan-enum.ts'
import { type OpenlaneProductsResponse } from '@/types/stripe.ts'
import { type Session } from 'next-auth'
import { isImpersonation } from '../authz/utils'

export const featureUtil = {
  notAvailableText: 'Not available in your current plan',
  notAvailableFullText: 'Forbidden. This feature is not available in your current subscription plan. Please upgrade your plan from your billing settings to access this feature.',
  baseModule: () => [
    FeatureEnum.DASHBOARD,
    FeatureEnum.GROUPS,
    FeatureEnum.ONBOARDING,
    FeatureEnum.ORGANIZATION,
    FeatureEnum.ORGANIZATION_SETTINGS,
    FeatureEnum.SUBSCRIPTION,
    FeatureEnum.TASKS,
    FeatureEnum.USER_SETTINGS,
  ],
  complianceModule: () => [
    ...featureUtil.baseModule(),
    FeatureEnum.ASSETS,
    FeatureEnum.CONTROLS,
    FeatureEnum.ENTITIES,
    FeatureEnum.EVIDENCE,
    FeatureEnum.POLICIES,
    FeatureEnum.PROCEDURES,
    FeatureEnum.PROGRAMS,
    FeatureEnum.QUESTIONNAIRES,
    FeatureEnum.REPORTING,
    FeatureEnum.RISKS,
    FeatureEnum.STANDARDS,
    FeatureEnum.PERSONNEL,
    FeatureEnum.VENDORS,
    FeatureEnum.CONTACTS,
    FeatureEnum.SYSTEM_DETAILS,
  ],
  trustCenterModule: () => [...featureUtil.baseModule(), FeatureEnum.TRUST_CENTER],
  entityManagementModule: () => [...featureUtil.baseModule()],
  vulnerabilityManagementModule: () => [...featureUtil.baseModule()],
  getPlanFeatures: (plan: PlanEnum) => {
    switch (plan) {
      case PlanEnum.TRUST_CENTER_MODULE:
        return featureUtil.trustCenterModule()
      case PlanEnum.ENTITY_MANAGEMENT_MODULE:
        return featureUtil.entityManagementModule()
      case PlanEnum.VULNERABILITY_MANAGEMENT_MODULE:
        return featureUtil.vulnerabilityManagementModule()
      case PlanEnum.COMPLIANCE_MODULE:
        return featureUtil.complianceModule()
      default:
        return featureUtil.baseModule()
    }
  },
  getPlanDescription: (plan: PlanEnum, products: OpenlaneProductsResponse | undefined) => {
    return products?.modules[plan].marketing_description ?? products?.modules[plan].description
  },
  getPlanName: (plan: PlanEnum) => {
    switch (plan) {
      case PlanEnum.BASE_MODULE:
        return 'Base'
      case PlanEnum.TRUST_CENTER_MODULE:
        return 'Trust Center'
      case PlanEnum.ENTITY_MANAGEMENT_MODULE:
        return 'Entity Management'
      case PlanEnum.VULNERABILITY_MANAGEMENT_MODULE:
        return 'Vulnerability Management'
      case PlanEnum.COMPLIANCE_MODULE:
        return 'Compliance'
      default:
        return 'Base'
    }
  },
  planHasFeature: (plan: PlanEnum, feature: FeatureEnum) => {
    return featureUtil.getPlanFeatures(plan).includes(feature)
  },

  hasModule(userModules: PlanEnum[], requiredModule: PlanEnum, session?: Session | null): boolean {
    // support role has no modules, skip check
    if (isImpersonation(session)) {
      return true
    }

    return userModules.includes(requiredModule)
  },

  hasNoModules(session: Session | null): boolean {
    if (!session) {
      return false
    }

    // support role has no modules return so should skip check
    if (isImpersonation(session)) {
      return false
    }

    const featureEnabled = process.env.NEXT_PUBLIC_ENABLE_PLAN

    if (featureEnabled === 'false') {
      return false
    }

    const modules = session.user?.modules ?? []

    return modules.length === 0
  },
}
