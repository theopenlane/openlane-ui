'use client'

import { useRef, useState } from 'react'
import { useNavigationGuard } from 'nextjs-nav-guard'
import { type TrustCenterSetting } from '@/lib/graphql-hooks/trust-center'
import { type UpdateTrustCenterSettingInput } from '@repo/codegen/src/schema'
import { DisabledReasonTooltip } from '@/components/shared/disabled-reason-tooltip/disabled-reason-tooltip'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import CollapsibleSection from '@/components/shared/collapsible-section/collapsible-section'
import CancelDialog from '@/components/shared/cancel-dialog/cancel-dialog'
import { NdaAutoApprovalRuleRow } from './nda-auto-approval-rule-row'
import { NdaSwitchRow } from './nda-switch-row'
import { NdaAutoApprovalRulesSummary } from './nda-auto-approval-rules-summary'
import {
  AUTO_APPROVAL_FALLBACK_RULE,
  AUTO_APPROVAL_RULE_GROUPS,
  getAutoApprovalRulesBlockedReason,
  initialAutoApprovalRules,
  readAutoApprovalRules,
  resolveAutoApprovalRules,
  type AutoApprovalRules,
  type TAutoApprovalRuleDefinition,
} from '../auto-approval-rules'

type NdaAutoApprovalSettingsProps = {
  setting?: TrustCenterSetting
  readOnly: boolean
  isSaving: boolean
  onUpdate: (input: UpdateTrustCenterSettingInput) => Promise<boolean>
}

type TDraft = { settingId?: string; base: AutoApprovalRules | null | undefined; value: AutoApprovalRules }

export const NdaAutoApprovalSettings = ({ setting, readOnly, isSaving, onUpdate }: NdaAutoApprovalSettingsProps) => {
  const isAutoApprovalEnabled = !!setting?.enableAutoApproval
  const savedRules = readAutoApprovalRules(setting)
  const [pendingDraft, setPendingDraft] = useState<TDraft | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const isSavingRef = useRef(false)

  const draft = pendingDraft && pendingDraft.settingId === setting?.id && pendingDraft.base === savedRules ? pendingDraft.value : null
  const rules = draft ?? resolveAutoApprovalRules(setting)
  const navGuard = useNavigationGuard({ enabled: draft !== null })
  const isEnabling = !isAutoApprovalEnabled && draft !== null
  const showRules = isAutoApprovalEnabled || isEnabling
  const saveBlockedReason = getAutoApprovalRulesBlockedReason(rules)

  const save = async (input: UpdateTrustCenterSettingInput) => {
    if (isSavingRef.current) return false
    isSavingRef.current = true
    try {
      return await onUpdate(input)
    } finally {
      isSavingRef.current = false
    }
  }

  const setDraft = (value: AutoApprovalRules | null) => setPendingDraft(value ? { settingId: setting?.id, base: savedRules, value } : null)

  const updateRule = <K extends keyof AutoApprovalRules>(key: K, value: AutoApprovalRules[K]) => {
    setDraft({ ...rules, [key]: value })
  }

  const toggleAutoApproval = async (checked: boolean) => {
    if (checked) {
      setDraft(initialAutoApprovalRules(setting))
      setIsExpanded(true)
      return
    }

    if (!isAutoApprovalEnabled) {
      setDraft(null)
      return
    }

    if (await save({ enableAutoApproval: false })) {
      setDraft(null)
    }
  }

  const saveChanges = async () => {
    if (saveBlockedReason) return
    const saved = await save(isEnabling ? { enableAutoApproval: true, autoApprovalRules: rules } : { autoApprovalRules: rules })
    if (saved) {
      setDraft(null)
    }
  }

  const renderRule = (rule: TAutoApprovalRuleDefinition) => <NdaAutoApprovalRuleRow key={rule.key} rule={rule} rules={rules} readOnly={readOnly} isSaving={isSaving} onChange={updateRule} />

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <CancelDialog isOpen={navGuard.active} onConfirm={navGuard.accept} onCancel={navGuard.reject} />
      <NdaSwitchRow
        className="px-4 py-3.5"
        label="Enable automatic approvals"
        description="Automatically approve NDA requests based on the rules below."
        checked={showRules}
        onCheckedChange={(checked) => void toggleAutoApproval(checked)}
        disabled={readOnly || isSaving}
      />

      {showRules && (
        <div className="px-3 pb-3">
          <CollapsibleSection label="Approval rules" open={isExpanded} onOpenChange={setIsExpanded} summary={<NdaAutoApprovalRulesSummary rules={rules} />}>
            <div className="space-y-4">
              <section className="space-y-2">
                <h4 className="px-1 text-sm font-medium">When no rule approves a request</h4>
                <div className="rounded-md border border-border">{renderRule(AUTO_APPROVAL_FALLBACK_RULE)}</div>
              </section>
              {AUTO_APPROVAL_RULE_GROUPS.map((group) => (
                <section key={group.title} className="space-y-2">
                  <div className="px-1">
                    <h4 className="text-sm font-medium">{group.title}</h4>
                    <p className="mt-1 text-sm text-muted-foreground">{group.description}</p>
                  </div>
                  <div className="divide-y divide-border rounded-md border border-border">{group.rules.map(renderRule)}</div>
                </section>
              ))}
            </div>
          </CollapsibleSection>

          {draft !== null && !readOnly && (
            <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
              <CancelButton onClick={() => setDraft(null)} disabled={isSaving} />
              <DisabledReasonTooltip reason={saveBlockedReason}>
                <SaveButton
                  type="button"
                  title={isEnabling ? 'Enable Automatic Approvals' : 'Save Rules'}
                  isSaving={isSaving}
                  disabled={isSaving || !!saveBlockedReason}
                  onClick={() => void saveChanges()}
                />
              </DisabledReasonTooltip>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
