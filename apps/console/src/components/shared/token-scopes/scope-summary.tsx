import { Badge } from '@repo/ui/badge'
import { formatScopeActions, groupScopesByResource } from './token-scopes'

type TScopeSummaryProps = {
  scopes: readonly string[]
}

export const ScopeSummary = ({ scopes }: TScopeSummaryProps) => (
  <ul className="flex flex-wrap gap-1.5" aria-label="Token scopes">
    {Object.entries(groupScopesByResource(scopes)).map(([resource, actions]) => (
      <li key={resource}>
        <Badge variant="outline" className="gap-1.5 font-normal">
          <span className="font-mono">{resource}</span>
          <span className="text-muted-foreground">{formatScopeActions(actions)}</span>
        </Badge>
      </li>
    ))}
  </ul>
)
