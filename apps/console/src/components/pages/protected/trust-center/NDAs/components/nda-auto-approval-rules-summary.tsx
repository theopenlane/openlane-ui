import { Badge } from '@repo/ui/badge'
import { summarizeAutoApprovalRules, type AutoApprovalRules } from '../auto-approval-rules'

type NdaAutoApprovalRulesSummaryProps = {
  rules: AutoApprovalRules
}

export const NdaAutoApprovalRulesSummary = ({ rules }: NdaAutoApprovalRulesSummaryProps) => (
  <div className="@container px-1">
    <dl aria-label="Approval rules summary" className="grid grid-cols-1 items-start gap-x-3 gap-y-2 text-sm @sm:grid-cols-[max-content_minmax(0,1fr)]">
      {summarizeAutoApprovalRules(rules).map(({ title, items }) => (
        <div key={title} className="contents">
          <dt className="py-0.5 text-muted-foreground @max-sm:-mb-1.5">{title}</dt>
          <dd className="flex min-w-0 flex-wrap gap-1.5">
            {items.length ? (
              items.map((item) => (
                <Badge key={item} variant="outline" className="font-normal">
                  {item}
                </Badge>
              ))
            ) : (
              <span className="py-0.5 text-muted-foreground">None</span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  </div>
)
