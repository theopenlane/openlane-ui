import { FeatureEnum } from './feature-enum'
import { PlanEnum } from '@/lib/subscription-plan/plan-enum.ts'
import { OpenlaneProductsResponse } from '@/types/stripe.ts'

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
  hasModule(userModules: PlanEnum[], requiredModule: PlanEnum): boolean {
    return userModules.includes(requiredModule)
  },
}
