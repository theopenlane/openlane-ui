import Link from 'next/link'
import { Badge } from '@repo/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'

type Policy = { id: string; name: string }

type LinkedPoliciesCellProps = {
  policies?: Policy[]
  stopPropagation?: boolean
}

const LinkedPoliciesCell = ({ policies = [], stopPropagation = false }: LinkedPoliciesCellProps) => {
  const handleClick = stopPropagation ? (e: React.MouseEvent) => e.stopPropagation() : undefined

  if (policies.length === 0) {
    return <span className="text-muted-foreground italic text-sm">None linked</span>
  }

  if (policies.length === 1) {
    return (
      <Link href={`/policies/${policies[0].id}/view`} onClick={handleClick}>
        <Badge variant="secondary" className="text-xs font-normal hover:bg-accent cursor-pointer">
          {policies[0].name}
        </Badge>
      </Link>
    )
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="secondary" className="text-xs font-normal cursor-default">
            {policies.length} policies
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top">
          <div className="text-xs space-y-1">
            <p className="font-semibold mb-1">Linked policies</p>
            {policies.map((p) => (
              <Link key={p.id} href={`/policies/${p.id}/view`} className="block hover:underline" onClick={handleClick}>
                {p.name}
              </Link>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default LinkedPoliciesCell
