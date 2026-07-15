import { Badge } from '@repo/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'

type OverflowBadgesCellProps = {
  values?: string[] | null
  maxVisible?: number
}

export const OverflowBadgesCell = ({ values, maxVisible = 2 }: OverflowBadgesCellProps) => {
  if (!values || values.length === 0) {
    return <span className="text-muted-foreground">—</span>
  }

  const visible = values.slice(0, maxVisible)
  const overflow = values.slice(maxVisible)

  return (
    <div className="flex flex-wrap items-center gap-1">
      {visible.map((value) => (
        <Badge key={value} variant="select">
          {value}
        </Badge>
      ))}
      {overflow.length > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="select" className="cursor-help">
                +{overflow.length}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>{overflow.join(', ')}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}
