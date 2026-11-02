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

type TRuleSummary = (rules: AutoApprovalRules) => string | null

const summaryWhenOn =
  (key: TAutoApprovalToggleKey, text: string): TRuleSummary =>
  (rules) =>
    rules[key] ? text : null

const summaryWhenOff =
  (key: TAutoApprovalToggleKey, text: string): TRuleSummary =>
  (rules) =>
    rules[key] ? null : text

const domainListSummary =
  (key: TAutoApprovalToggleKey, domainsKey: TAutoApprovalDomainsKey, text: string): TRuleSummary =>
  (rules) =>
    rules[key] ? `${text} (${rules[domainsKey]?.length ?? 0})` : null

export type TAutoApprovalRuleDefinition = {
  key: TAutoApprovalToggleKey
  label: string
  summary: TRuleSummary
  description: string
  domainsKey?: TAutoApprovalDomainsKey
  domainsLabel?: string
  disabledReason?: (rules: AutoApprovalRules) => string | null
}

export const AUTO_APPROVAL_FALLBACK_RULE: TAutoApprovalRuleDefinition = {
  key: 'manualApprovalOnFailure',
  label: 'Send unmatched requests to manual review',
  summary: (rules) => (rules.manualApprovalOnFailure ? 'Manual review' : 'Declined'),
  description: 'NDA requests that are not approved automatically go to manual review. When this is off, those requests are declined automatically.',
}

export type TAutoApprovalRuleGroup = {
  title: string
  summaryTitle: string
  description: string
  rules: readonly TAutoApprovalRuleDefinition[]
}

export const AUTO_APPROVAL_RULE_GROUPS: readonly TAutoApprovalRuleGroup[] = [
  {
    title: 'Approval rules',
    summaryTitle: 'Approves',
    description: 'A match approves the request automatically. Email address restrictions and the domain blocklist are checked first and override these.',
    rules: [
      {
        key: 'approveIfContactExists',
        label: 'Approve existing contacts',
        summary: summaryWhenOn('approveIfContactExists', 'Existing contacts'),
        description: 'Automatically approve NDA requests when the email address matches an active contact in your organization.',
      },
      {
        key: 'approveFromContactDomain',
        label: 'Approve contact domains',
        summary: summaryWhenOn('approveFromContactDomain', 'Contact domains'),
        description: 'Automatically approve NDA requests from domains used by your active contacts.',
      },
      {
        key: 'approveFromExistingRequestDomain',
        label: 'Approve previously approved domains',
        summary: summaryWhenOn('approveFromExistingRequestDomain', 'Previously approved domains'),
        description: 'Automatically approve NDA requests from a domain that already has an approved request.',
      },
      {
        key: 'useDomainAllowlist',
        label: 'Approve specific domains',
        summary: domainListSummary('useDomainAllowlist', 'domainAllowlist', 'Allowed domains'),
        description: 'Automatically approve NDA requests from the domains you list.',
        domainsKey: 'domainAllowlist',
        domainsLabel: 'Allowed domains',
      },
    ],
  },
  {
    title: 'Email address restrictions',
    summaryTitle: 'Restrictions',
    description: 'These settings are checked before any approval rule and override all of them. They only exclude NDA requests. A request still needs to match an approval rule.',
    rules: [
      {
        key: 'workEmailOnly',
        label: 'Require work email addresses',
        summary: summaryWhenOn('workEmailOnly', 'Work email required'),
        description:
          'Never automatically approve NDA requests from free email providers, such as gmail.com, or from disposable addresses. This applies even when the domain belongs to a contact or is on your allowed list.',
      },
      {
        key: 'allowRoleAccount',
        label: 'Role email addresses can qualify',
        summary: summaryWhenOff('allowRoleAccount', 'Role addresses excluded'),
        description:
          'Let role addresses such as support@ or sales@ qualify for automatic approval when they match an approval rule. This setting does not approve them on its own. When it is off, NDA requests from role addresses are never approved automatically.',
      },
      {
        key: 'allowDisposableEmail',
        label: 'Disposable email addresses can qualify',
        summary: (rules) => (rules.workEmailOnly || rules.allowDisposableEmail ? null : 'Disposable addresses excluded'),
        description:
          'Let known disposable addresses qualify for automatic approval when they match an approval rule. This setting does not approve them on its own. When it is off, NDA requests from disposable addresses are never approved automatically.',
        disabledReason: (rules) =>
          rules.workEmailOnly && !rules.allowDisposableEmail ? 'Turn off "Require work email addresses" first. Disposable addresses cannot qualify while work email addresses are required.' : null,
      },
      {
        key: 'useDomainBlocklist',
        label: 'Exclude specific domains',
        summary: domainListSummary('useDomainBlocklist', 'domainBlocklist', 'Blocked domains'),
        description: 'Never automatically approve NDA requests from the domains you list, such as competitor domains. Excluded domains take priority over allowed domains.',
        domainsKey: 'domainBlocklist',
        domainsLabel: 'Blocked domains',
      },
    ],
  },
]

export const getAutoApprovalRulesBlockedReason = (rules: AutoApprovalRules): string | null => {
  const emptyList = AUTO_APPROVAL_RULE_GROUPS.flatMap((group) => group.rules).find(({ key, domainsKey }) => domainsKey && rules[key] && !rules[domainsKey]?.length)
  return emptyList ? `Add at least one domain to "${emptyList.label}" or turn it off.` : null
}

const summarizeRules = (definitions: readonly TAutoApprovalRuleDefinition[], rules: AutoApprovalRules) =>
  definitions.map((definition) => definition.summary(rules)).filter((item): item is string => item !== null)

export const summarizeAutoApprovalRules = (rules: AutoApprovalRules) => [
  ...AUTO_APPROVAL_RULE_GROUPS.map((group) => ({ title: group.summaryTitle, items: summarizeRules(group.rules, rules) })),
  { title: 'Unmatched requests', items: summarizeRules([AUTO_APPROVAL_FALLBACK_RULE], rules) },
]
