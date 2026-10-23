import { type TrustCenterSetting } from '@/lib/graphql-hooks/trust-center'

export type AutoApprovalRules = {
  allowDisposableEmail?: boolean
  workEmailOnly?: boolean
  allowRoleAccount?: boolean
  approveFromExistingRequestDomain?: boolean
  approveIfContactExists?: boolean
  approveFromContactDomain?: boolean
  useDomainBlocklist?: boolean
  domainBlocklist?: string[]
  useDomainAllowlist?: boolean
  domainAllowlist?: string[]
  manualApprovalOnFailure?: boolean
}

export type TAutoApprovalToggleKey = { [K in keyof AutoApprovalRules]-?: NonNullable<AutoApprovalRules[K]> extends boolean ? K : never }[keyof AutoApprovalRules]
export type TAutoApprovalDomainsKey = 'domainBlocklist' | 'domainAllowlist'

const DEFAULT_AUTO_APPROVAL_RULES: AutoApprovalRules = {
  workEmailOnly: true,
  approveFromExistingRequestDomain: true,
  approveIfContactExists: true,
  manualApprovalOnFailure: true,
}

export const readAutoApprovalRules = (setting?: TrustCenterSetting) => setting?.autoApprovalRules as AutoApprovalRules | null | undefined

export const resolveAutoApprovalRules = (setting?: TrustCenterSetting): AutoApprovalRules => readAutoApprovalRules(setting) ?? {}

const isUnconfiguredRules = (rules: AutoApprovalRules) => !Object.values(rules).some((value) => (Array.isArray(value) ? value.length > 0 : !!value))

export const initialAutoApprovalRules = (setting?: TrustCenterSetting): AutoApprovalRules => {
  const rules = readAutoApprovalRules(setting)
  return rules && !isUnconfiguredRules(rules) ? rules : DEFAULT_AUTO_APPROVAL_RULES
}

export type TAutoApprovalRuleDefinition = {
  key: TAutoApprovalToggleKey
  label: string
  description: string
  domainsKey?: TAutoApprovalDomainsKey
  domainsLabel?: string
  disabledReason?: (rules: AutoApprovalRules) => string | null
}

export const AUTO_APPROVAL_FALLBACK_RULE: TAutoApprovalRuleDefinition = {
  key: 'manualApprovalOnFailure',
  label: 'Require manual approval if rules do not match',
  description: 'Send requests that do not qualify for automatic approval to manual review. When disabled, these requests are automatically declined.',
}

export const AUTO_APPROVAL_RULES: readonly TAutoApprovalRuleDefinition[] = [
  {
    key: 'workEmailOnly',
    label: 'Require work emails',
    description: 'Do not automatically approve requests from free or disposable email domains. Allowlisted domains and existing contacts are still approved.',
  },
  {
    key: 'allowRoleAccount',
    label: 'Allow role email accounts',
    description: 'Allow NDA requests from role email addresses such as support@ or sales@ to be approved automatically.',
  },
  {
    key: 'approveFromExistingRequestDomain',
    label: 'Approve from known domains',
    description: 'Automatically approve NDA requests from a domain used by a previously approved request. Email rules still apply.',
  },
  {
    key: 'approveIfContactExists',
    label: 'Approve existing contacts',
    description: 'Automatically approve NDA requests when the email address matches an active contact in your organization.',
  },
  {
    key: 'approveFromContactDomain',
    label: 'Approve contact domains',
    description: 'Automatically approve requests from domains used by your active contacts. Email rules still apply.',
  },
  {
    key: 'useDomainBlocklist',
    label: 'Exclude domains from automatic approval',
    description: 'Use the domain blocklist to exclude domains, such as competitor domains, from automatic approval.',
    domainsKey: 'domainBlocklist',
    domainsLabel: 'Blocked domains',
  },
  {
    key: 'useDomainAllowlist',
    label: 'Approve requests from any of these domains',
    description: 'Use the domain allowlist to automatically approve NDA requests from the listed domains.',
    domainsKey: 'domainAllowlist',
    domainsLabel: 'Allowed domains',
  },
  {
    key: 'allowDisposableEmail',
    label: 'Allow disposable emails',
    description: 'Allow known disposable email addresses to qualify for automatic approval.',
    disabledReason: (rules) => (rules.workEmailOnly && !rules.allowDisposableEmail ? 'Turn off "Require work emails" first. Work emails exclude disposable addresses.' : null),
  },
]

export const getAutoApprovalRulesBlockedReason = (rules: AutoApprovalRules): string | null => {
  const emptyList = AUTO_APPROVAL_RULES.find(({ key, domainsKey }) => domainsKey && rules[key] && !rules[domainsKey]?.length)
  return emptyList ? `Add at least one domain to "${emptyList.label}" or turn it off.` : null
}
