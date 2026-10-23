import { Label } from '@repo/ui/label'
import { Switch } from '@repo/ui/switch'
import { DisabledReasonTooltip } from '@/components/shared/disabled-reason-tooltip/disabled-reason-tooltip'
import { ApprovalDomainList } from './approval-domain-list'
import { type AutoApprovalRules, type TAutoApprovalRuleDefinition } from '../auto-approval-rules'

type NdaAutoApprovalRuleRowProps = {
  rule: TAutoApprovalRuleDefinition
  rules: AutoApprovalRules
  readOnly: boolean
  isSaving: boolean
  onChange: <K extends keyof AutoApprovalRules>(key: K, value: AutoApprovalRules[K]) => void
}

export const NdaAutoApprovalRuleRow = ({ rule, rules, readOnly, isSaving, onChange }: NdaAutoApprovalRuleRowProps) => {
  const disabledReason = rule.disabledReason?.(rules) ?? null
  const { domainsKey } = rule

  return (
    <div className="p-4">
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
            disabled={readOnly || isSaving || !!disabledReason}
            className="mt-1 shrink-0"
            onCheckedChange={(checked) => onChange(rule.key, checked)}
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
            onChange={(domains) => onChange(domainsKey, domains)}
          />
        </div>
      )}
    </div>
  )
}
