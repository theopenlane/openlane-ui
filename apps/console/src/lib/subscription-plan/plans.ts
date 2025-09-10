import { FeatureEnum } from './feature-enum'
import { PlanEnum } from '@/lib/subscription-plan/plan-enum.ts'

export const featureUtil = {
  notAvailableText: 'Not available in your current plan',
  notAvailableFullText: 'Forbidden. This feature is not available in your current subscription plan. Please upgrade your plan from your billing settings to access this feature.',
  baseModule: () => [
    FeatureEnum.ASSETS,
    FeatureEnum.CONTROL_REPORT,
    FeatureEnum.CONTROLS,
    FeatureEnum.DASHBOARD,
    FeatureEnum.ENTITIES,
    FeatureEnum.EVIDENCE,
    FeatureEnum.GROUPS,
    FeatureEnum.ONBOARDING,
    FeatureEnum.ORGANIZATION,
    FeatureEnum.ORGANIZATION_SETTINGS,
    FeatureEnum.POLICIES,
    FeatureEnum.PROCEDURES,
    FeatureEnum.PROGRAMS,
    FeatureEnum.QUESTIONNAIRES,
    FeatureEnum.REPORTING,
    FeatureEnum.RISKS,
    FeatureEnum.STANDARDS,
    FeatureEnum.SUBSCRIPTION,
    FeatureEnum.TASKS,
    FeatureEnum.USER_SETTINGS,
  ],
  trustCenterModule: () => [...featureUtil.baseModule(), FeatureEnum.TRUST_CENTER],
  complianceModule: () => [...featureUtil.baseModule()],
  entityManagementModule: () => [...featureUtil.baseModule()],
  vulnerabilityManagementModule: () => [...featureUtil.baseModule()],
  getPlanFeatures: (plan: PlanEnum) => {
    switch (plan) {
      case PlanEnum.BASE_MODULE:
        return featureUtil.baseModule()
      case PlanEnum.TRUST_CENTER_MODULE:
        return featureUtil.trustCenterModule()
      case PlanEnum.ENTITY_MANAGEMENT_MODULE:
        return featureUtil.entityManagementModule()
      case PlanEnum.VULNERABILITY_MANAGEMENT_MODULE:
        return featureUtil.vulnerabilityManagementModule()
      case PlanEnum.COMPLIANCE_MODULE:
        return featureUtil.complianceModule()
    }
  },
  getPlanDescription: (plan: PlanEnum) => {
    switch (plan) {
      case PlanEnum.BASE_MODULE:
        return 'This module offers in-depth security measures. Ready to dive deeper?'
      case PlanEnum.TRUST_CENTER_MODULE:
        return 'Build customer trust with a professional security portal. Share compliance documentation securely with stakeholders.'
      case PlanEnum.ENTITY_MANAGEMENT_MODULE:
        return 'This module offers in-depth security measures. Ready to dive deeper?'
      case PlanEnum.VULNERABILITY_MANAGEMENT_MODULE:
        return 'Identify and track security vulnerabilities across your systems. Stay ahead of potential threats with continuous monitoring.'
      case PlanEnum.COMPLIANCE_MODULE:
        return 'Automate evidence collection and task tracking to simplify SOC 2, ISO 27001, and other certification workflows.'
    }
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
    }
  },
  planHasFeature: (plan: PlanEnum, feature: FeatureEnum) => {
    return featureUtil.getPlanFeatures(plan).includes(feature)
  },
}
