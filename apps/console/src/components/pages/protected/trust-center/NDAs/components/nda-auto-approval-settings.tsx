'use client'

import { useRef, useState } from 'react'
import { type TrustCenterSetting } from '@/lib/graphql-hooks/trust-center'
import { type UpdateTrustCenterSettingInput } from '@repo/codegen/src/schema'
import { Label } from '@repo/ui/label'
import { Switch } from '@repo/ui/switch'
import { DisabledReasonTooltip } from '@/components/shared/disabled-reason-tooltip/disabled-reason-tooltip'
import { ApprovalDomainList } from './approval-domain-list'
import { AUTO_APPROVAL_RULES, DEFAULT_AUTO_APPROVAL_RULES, resolveAutoApprovalRules, type AutoApprovalRules } from '../auto-approval-rules'

type NdaAutoApprovalSettingsProps = {
  setting?: TrustCenterSetting
  readOnly: boolean
  isSaving: boolean
  onUpdate: (input: UpdateTrustCenterSettingInput) => Promise<boolean>
}

type TOptimisticRules = { base: AutoApprovalRules; value: AutoApprovalRules }

export const NdaAutoApprovalSettings = ({ setting, readOnly, isSaving, onUpdate }: NdaAutoApprovalSettingsProps) => {
  const isAutoApprovalEnabled = !!setting?.enableAutoApproval
  const serverRules = resolveAutoApprovalRules(setting)
  const [optimistic, setOptimistic] = useState<TOptimisticRules | null>(null)
  const isSavingRef = useRef(false)

  const rules = optimistic && optimistic.base === serverRules ? optimistic.value : serverRules
  const disabled = readOnly || isSaving

  const save = async (input: UpdateTrustCenterSettingInput) => {
    if (isSavingRef.current) return false
    isSavingRef.current = true
    try {
      return await onUpdate(input)
    } finally {
      isSavingRef.current = false
    }
  }

  const updateRule = async <K extends keyof AutoApprovalRules>(key: K, value: AutoApprovalRules[K]) => {
    const next: AutoApprovalRules = { ...rules }
    next[key] = value
    setOptimistic({ base: serverRules, value: next })
    const saved = await save({ autoApprovalRules: next })
    setOptimistic(null)
    return saved
  }

  const toggleAutoApproval = (checked: boolean) => {
    void save(checked && !setting?.autoApprovalRules ? { enableAutoApproval: true, autoApprovalRules: DEFAULT_AUTO_APPROVAL_RULES } : { enableAutoApproval: checked })
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="flex items-start justify-between gap-4 px-4 py-3.5">
        <div>
          <Label htmlFor="nda-enable-auto-approval" className="text-sm font-medium">
            Enable automatic approvals
          </Label>
          <p className="mt-1 text-sm text-muted-foreground">Automatically approve NDA requests based on the rules below.</p>
        </div>
        <Switch id="nda-enable-auto-approval" checked={isAutoApprovalEnabled} onCheckedChange={toggleAutoApproval} disabled={disabled} className="mt-1 shrink-0" />
      </div>

      {isAutoApprovalEnabled && (
        <div className="px-3 pb-3">
          <div className="divide-y divide-border rounded-md border border-border">
            {AUTO_APPROVAL_RULES.map((rule) => {
              const disabledReason = rule.disabledReason?.(rules) ?? null
              const { domainsKey } = rule

              return (
                <div key={rule.key} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <Label htmlFor={`nda-${rule.key}`} className="text-sm font-medium">
                        {rule.label}
                      </Label>
                      <p className="mt-1 text-sm text-muted-foreground">{rule.description}</p>
                    </div>
                    <DisabledReasonTooltip reason={readOnly ? null : disabledReason}>
                      <Switch
                        id={`nda-${rule.key}`}
                        checked={!!rules[rule.key]}
                        disabled={disabled || !!disabledReason}
                        className="mt-1 shrink-0"
                        onCheckedChange={(checked) => void updateRule(rule.key, checked)}
                      />
                    </DisabledReasonTooltip>
                  </div>

                  {domainsKey && rules[rule.key] && (
                    <div className="mt-3">
                      <ApprovalDomainList
                        inputLabel={rule.domainsLabel ?? 'Domains'}
                        domains={rules[domainsKey] ?? []}
                        readOnly={readOnly}
                        isSaving={isSaving}
                        onChange={(domains) => updateRule(domainsKey, domains)}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
