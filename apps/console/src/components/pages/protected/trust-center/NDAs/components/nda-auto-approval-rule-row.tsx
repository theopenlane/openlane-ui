import { ApprovalDomainList } from './approval-domain-list'
import { NdaSwitchRow } from './nda-switch-row'
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
      <NdaSwitchRow
        label={rule.label}
        description={rule.description}
        checked={!!rules[rule.key]}
        disabled={readOnly || isSaving || !!disabledReason}
        disabledReason={readOnly ? null : disabledReason}
        onCheckedChange={(checked) => onChange(rule.key, checked)}
      />

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
