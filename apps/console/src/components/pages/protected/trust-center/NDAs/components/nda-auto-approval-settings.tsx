'use client'

import { Switch } from '@repo/ui/switch'
import { Label } from '@repo/ui/label'
import { type UpdateTrustCenterSettingInput } from '@repo/codegen/src/schema'
import { type TrustCenterSetting } from '@/lib/graphql-hooks/trust-center'
import { type AutoApprovalRules, rulesMappings } from './nda-auto-approval-rules'
import { DomainListEditor } from './domain-editor'

type NdaAutoApprovalSettingsProps = {
  setting?: TrustCenterSetting
  disabled: boolean
  onUpdate: (input: UpdateTrustCenterSettingInput) => void
}

export const NdaAutoApprovalSettings = ({ setting, disabled, onUpdate }: NdaAutoApprovalSettingsProps) => {
  const isAutoApprovalEnabled = !!setting?.enableAutoApproval

  const rules = (setting?.autoApprovalRules as AutoApprovalRules) ?? null

  const updateRules = (changes: Partial<AutoApprovalRules>) => onUpdate({ autoApprovalRules: { ...rules, ...changes } })

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="flex items-start justify-between gap-4 px-4 py-3.5">
        <div>
          <Label htmlFor="nda-enable-auto-approval" className="text-sm font-medium">
            Enable automatic approvals
          </Label>
          <p className="mt-1 text-sm text-muted-foreground">Automatically approve NDA requests based on the rules below.</p>
        </div>
        <Switch id="nda-enable-auto-approval" checked={isAutoApprovalEnabled} onCheckedChange={(checked) => onUpdate({ enableAutoApproval: checked })} disabled={disabled} className="mt-1 shrink-0" />
      </div>

      {isAutoApprovalEnabled && (
        <div className="px-3 pb-3">
          <div className="divide-y divide-border rounded-md border border-border">
            {rulesMappings.map((rule) => (
              <div key={rule.key} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Label htmlFor={`nda-${rule.key}`} className="text-sm font-medium">
                      {rule.label}
                    </Label>
                    <p className="mt-1 text-sm text-muted-foreground">{rule.description}</p>
                  </div>
                  <Switch id={`nda-${rule.key}`} checked={!!rules?.[rule.key]} onCheckedChange={(checked) => updateRules({ [rule.key]: checked })} disabled={disabled} className="mt-1 shrink-0" />
                </div>

                {'domainsKey' in rule && rules?.[rule.key] && (
                  <div className="mt-3">
                    <DomainListEditor
                      inputLabel={rule.domainsKey === 'domainBlocklist' ? 'Blocked domain' : 'Allowed domain'}
                      domains={rules?.[rule.domainsKey] ?? []}
                      disabled={disabled}
                      onChange={(domains) => updateRules({ [rule.domainsKey]: domains })}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
