'use client'

import { Switch } from '@repo/ui/switch'
import { Label } from '@repo/ui/label'
import { useState } from 'react'
import { DomainListEditor } from '@/components/shared/domain-list-editor/domain-list-editor'
import { isValidDomain } from '@/utils/strings'
import { type UpdateTrustCenterSettingInput } from '@repo/codegen/src/schema'

type AutoApprovalRules = {
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

const ruleSettings = [
  {
    key: 'workEmailOnly',
    label: 'Require a work email',
    description: 'Restrict automatic approval to work email addresses.',
  },
  {
    key: 'hasMXRecords',
    label: 'Require email domain MX records',
    description: 'Require the email domain to have mail exchange records.',
  },
  {
    key: 'allowDisposableEmail',
    label: 'Allow disposable email addresses',
    description: 'Allow known disposable email addresses to qualify for automatic approval.',
  },
  {
    key: 'allowRoleAccount',
    label: 'Allow role accounts',
    description: 'Allow shared addresses such as support@ or sales@ to qualify for automatic approval.',
  },
  {
    key: 'approveFromExistingRequestDomain',
    label: 'Approve previously approved domains',
    description: 'Automatically approve requests from a domain with an existing approved request.',
  },
  {
    key: 'approveIfContactExists',
    label: 'Approve existing contacts',
    description: 'Automatically approve requests when the email matches an active contact in your organization.',
  },
  {
    key: 'approveFromContactDomain',
    label: 'Approve contact domains',
    description: 'Automatically approve requests from domains used by your contacts.',
  },
  {
    key: 'useDomainBlocklist',
    label: 'Use a domain blocklist',
    description: 'Exclude the listed domains from automatic approval.',
    domainsKey: 'domainBlocklist',
  },
  {
    key: 'useDomainAllowlist',
    label: 'Use a domain allowlist',
    description: 'Automatically approve requests from the listed domains.',
    domainsKey: 'domainAllowlist',
  },
  {
    key: 'manualApprovalOnFailure',
    label: 'Require manual approval when rules fail',
    description: 'Send requests that do not match the automatic approval rules for manual review.',
  },
] as const

type NdaAutoApprovalSettingsProps = {
  enabled: boolean
  rules?: AutoApprovalRules | null
  disabled: boolean
  onUpdate: (input: UpdateTrustCenterSettingInput) => void
}

export const NdaAutoApprovalSettings = ({ enabled, rules, disabled, onUpdate }: NdaAutoApprovalSettingsProps) => {
  const updateRules = (changes: Partial<AutoApprovalRules>) => onUpdate({ autoApprovalRules: { ...rules, ...changes } })

  return (
    <div className="space-y-4 border-t pt-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Label htmlFor="nda-enable-auto-approval" className="text-sm font-medium">
            Enable automatic approval
          </Label>
          <p className="mt-1 text-sm text-muted-foreground">Automatically approve NDA requests using the rules below.</p>
        </div>
        <Switch id="nda-enable-auto-approval" checked={enabled} onCheckedChange={(checked) => onUpdate({ enableAutoApproval: checked })} disabled={disabled} />
      </div>
      <div className="space-y-4 pl-4">
        {ruleSettings.map((setting) => (
          <div key={setting.key} className="space-y-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Label htmlFor={`nda-${setting.key}`} className="text-sm font-medium">
                  {setting.label}
                </Label>
                <p className="mt-1 text-sm text-muted-foreground">{setting.description}</p>
              </div>
              <Switch id={`nda-${setting.key}`} checked={!!rules?.[setting.key]} onCheckedChange={(checked) => updateRules({ [setting.key]: checked })} disabled={disabled || !enabled} />
            </div>
            {'domainsKey' in setting && rules?.[setting.key] && (
              <div>
                <Label className="text-sm">Domains</Label>
                <NdaApprovalDomains
                  inputLabel={setting.domainsKey === 'domainBlocklist' ? 'Blocked domain' : 'Allowed domain'}
                  domains={rules?.[setting.domainsKey] ?? []}
                  disabled={disabled || !enabled}
                  onChange={(domains) => updateRules({ [setting.domainsKey]: domains })}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

type NdaApprovalDomainsProps = {
  inputLabel: string
  domains: string[]
  disabled: boolean
  onChange: (domains: string[]) => void
}

const NdaApprovalDomains = ({ inputLabel, domains, disabled, onChange }: NdaApprovalDomainsProps) => {
  const [newDomain, setNewDomain] = useState('')
  const [inputError, setInputError] = useState<string | null>(null)

  const addDomain = () => {
    if (disabled) return

    const trimmed = newDomain.trim().toLowerCase()
    if (!trimmed) return

    if (!isValidDomain(trimmed)) {
      setInputError(`"${trimmed}" is not a valid domain.`)
      return
    }

    if (domains.includes(trimmed)) {
      setInputError(`"${trimmed}" is already added.`)
      return
    }

    onChange([...domains, trimmed])
    setNewDomain('')
  }

  const removeDomain = (domainToRemove: string) => {
    if (disabled) return
    onChange(domains.filter((domain) => domain !== domainToRemove))
  }

  return (
    <DomainListEditor
      domains={domains}
      newDomain={newDomain}
      onNewDomainChange={(value) => {
        setNewDomain(value)
        if (inputError) setInputError(null)
      }}
      onAdd={disabled ? undefined : addDomain}
      onRemove={disabled ? undefined : removeDomain}
      error={inputError}
      emptyText="No domains yet."
      inputLabel={inputLabel}
      addLabel="Add Domain"
      addOnEnter
    />
  )
}
