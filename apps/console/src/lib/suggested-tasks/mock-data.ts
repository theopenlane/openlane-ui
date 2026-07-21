import { TaskTaskStatus } from '@repo/codegen/src/schema'
import { SuggestedTaskSource, type SuggestedTask, type SuggestedTaskKind } from './types'

const TASK_KINDS = {
  operational: { name: 'Operational', color: '#6392ff' },
  registry: { name: 'Registry', color: '#ff842c' },
  policyReview: { name: 'Policy Review', color: '#21c55d' },
  controlImplementation: { name: 'Control Implementation', color: '#eab308' },
  trustCenter: { name: 'Trust Center', color: '#8b5cf6' },
} satisfies Record<string, SuggestedTaskKind>

export const mockSuggestedTasks: SuggestedTask[] = [
  {
    id: 'suggested-secure-organization',
    title: 'Secure your organization',
    details: 'Set up Single-Sign On, allowed domains, and permissions to keep your org safe.',
    status: TaskTaskStatus.OPEN,
    taskKind: TASK_KINDS.operational,
    source: SuggestedTaskSource.ONBOARDING,
    metadata: { link: '/organization-settings/authentication' },
  },
  {
    id: 'suggested-invite-team',
    title: 'Invite your team',
    details: 'Add teammates so they can collaborate on controls, policies, and evidence.',
    status: TaskTaskStatus.OPEN,
    taskKind: TASK_KINDS.operational,
    source: SuggestedTaskSource.ONBOARDING,
    metadata: { link: '/user-management/members' },
  },
  {
    id: 'suggested-complete-registry',
    title: 'Complete your registry',
    details: `Your registry is where you track the people, vendors, platforms, and assets behind your organization.

- [Personnel](/registry/personnel) — employees and contractors with system access
- [Vendors](/registry/vendors) — third parties you share data with or rely on
- [Platforms](/registry/platforms) — the applications and services your organization runs on
- [Assets](/registry/assets) — assets discovered by your domain scan`,
    status: TaskTaskStatus.OPEN,
    taskKind: TASK_KINDS.registry,
    source: SuggestedTaskSource.RECOMMENDATIONS,
    metadata: { docsLink: 'https://docs.theopenlane.io/registry' },
  },
  {
    id: 'suggested-setup-policies',
    title: 'Set up your policies',
    details: `Set up your policies one of three ways:

- **Create from scratch** using the built-in editor
- **Import** policies you already have documented
- **Connect an integration** to keep policies in sync from an external source`,
    status: TaskTaskStatus.OPEN,
    taskKind: TASK_KINDS.policyReview,
    source: SuggestedTaskSource.RECOMMENDATIONS,
    metadata: { docsLink: 'https://docs.theopenlane.io/policies' },
  },
  {
    id: 'suggested-setup-controls',
    title: 'Create or import your controls',
    details: `Controls are the safeguards and recurring practices your organization uses to meet its compliance requirements.

- Start from **Openlane's template library** of common controls
- **Import** controls you already have documented
- Map each control to the policies and frameworks it supports`,
    status: TaskTaskStatus.OPEN,
    taskKind: TASK_KINDS.controlImplementation,
    source: SuggestedTaskSource.RECOMMENDATIONS,
    metadata: { docsLink: 'https://docs.theopenlane.io/compliance/controls' },
  },
  {
    id: 'suggested-configure-trust-center',
    title: 'Configure your Trust Center',
    details: 'Customize your public trust center to share security, compliance, and privacy information with customers.',
    status: TaskTaskStatus.OPEN,
    taskKind: TASK_KINDS.trustCenter,
    source: SuggestedTaskSource.ONBOARDING,
    metadata: { link: '/trust-center/branding' },
  },
  {
    id: 'suggested-add-payment-method',
    title: 'Add a payment method',
    details: 'Add a payment method to keep your subscription active and enable paid features when your trial ends.',
    status: TaskTaskStatus.OPEN,
    taskKind: TASK_KINDS.operational,
    source: SuggestedTaskSource.ONBOARDING,
    metadata: { link: '/organization-settings/billing' },
  },
  {
    id: 'suggested-setup-integrations',
    title: 'Setup integrations',
    details: 'Automatically sync data into Openlane such as personnel, assets, or documents.',
    status: TaskTaskStatus.OPEN,
    taskKind: TASK_KINDS.registry,
    source: SuggestedTaskSource.ONBOARDING,
    metadata: { link: '/automation/integrations' },
  },
]
