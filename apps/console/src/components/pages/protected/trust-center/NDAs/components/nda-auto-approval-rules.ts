export type AutoApprovalRules = {
  allowDisposableEmail?: boolean
  workEmailOnly?: boolean
  hasMXRecords?: boolean
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
    label: 'Approve work emails',
    description: 'Automatically approve work emails. This will exclude all free email providers',
  },
  {
    key: 'allowRoleAccount',
    label: 'Approve role email accounts',
    description: 'Automatically approve NDA requests from role-based email addresses such as support@ or sales@',
  },
  {
    key: 'approveFromExistingRequestDomain',
    label: 'Approve from known domains',
    description: 'Automatically approve requests that share the same domain with a previously approved NDA request',
  },
  {
    key: 'approveIfContactExists',
    label: 'Approve existing contacts',
    description: 'Automatically approve if the email matches a known and active contact.',
  },
  {
    key: 'approveFromContactDomain',
    label: 'Approve contact domains',
    description:
      'Automatically approve requests from domains used by your contacts. If you have a contact such as human@theopenlane.io, this will approve all NDA requests from any other @theopenlane.io email',
  },
  {
    key: 'useDomainBlocklist',
    label: 'Deny all requests from these domains',
    description: 'Exclude these domains from automatic approval. These could be from known competitors as an example',
    domainsKey: 'domainBlocklist',
  },
  {
    key: 'useDomainAllowlist',
    label: 'Approve requests from any of these domains',
    description: 'Automatically approve all NDA requests that match any of these domains',
    domainsKey: 'domainAllowlist',
  },
  {
    key: 'allowDisposableEmail',
    label: 'Approve disposable emails',
    description: 'Automatically approve NDA requests from known disposable email providers',
  },
  {
    key: 'manualApprovalOnFailure',
    label: 'Require manual approval if rules do not match',
    description: 'If the NDA request does not match any of the above rules, automatically mark it as declined or requiring a manual review',
  },
] as const
