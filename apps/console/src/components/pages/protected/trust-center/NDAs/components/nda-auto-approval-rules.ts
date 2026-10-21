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

export const rulesMappings = [
  {
    key: 'workEmailOnly',
    label: 'Require work emails',
    description: 'Automatically reject NDA requests from free and disposable email domains.',
  },
  {
    key: 'allowRoleAccount',
    label: 'Allow role email accounts',
    description: `Allow NDA requests from role email addresses such as support@ or sales@.`,
  },
  {
    key: 'approveFromExistingRequestDomain',
    label: 'Approve from known domains',
    description: `Automatically approve NDA requests from a domain used by a previously approved request. 
Email rules you may have enabled will still apply if any`,
  },
  {
    key: 'approveIfContactExists',
    label: 'Approve existing contacts',
    description: 'Automatically approve NDA requests when the email address matches an active contact in your organization.',
  },
  {
    key: 'approveFromContactDomain',
    label: 'Approve contact domains',
    description: `Automatically approve requests from domains used by your active contacts.
Email rules you may have enabled will still apply if any`,
  },
  {
    key: 'useDomainBlocklist',
    label: 'Exclude domains from automatic approval',
    description: 'Use the domain blocklist to exclude domains, such as competitor domains, from automatic approval.',
    domainsKey: 'domainBlocklist',
  },
  {
    key: 'useDomainAllowlist',
    label: 'Approve requests from any of these domains',
    description: 'Use the domain allowlist to automatically approve NDA requests from the listed domains.',
    domainsKey: 'domainAllowlist',
  },
  {
    key: 'allowDisposableEmail',
    label: 'Allow disposable emails',
    description: 'Allow known disposable email addresses to qualify for automatic NDA requests approval',
  },
  {
    key: 'manualApprovalOnFailure',
    label: 'Require manual approval if rules do not match',
    description: 'Send requests that do not qualify for automatic approval to manual review. When disabled, these requests are automatically declined.',
  },
] as const
