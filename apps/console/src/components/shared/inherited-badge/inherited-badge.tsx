import Link from 'next/link'
import { GitBranch } from 'lucide-react'
import { Badge } from '@repo/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'

type InheritedSource = {
  refCode: string
  href?: string
}

type InheritedBadgeProps = {
  sources?: InheritedSource[]
}

const InheritedBadge = ({ sources = [] }: InheritedBadgeProps) => {
  const badge = (
    <Badge variant="secondary" className="gap-1 text-xs font-normal w-fit">
      <GitBranch size={10} />
      Inherited
    </Badge>
  )

  if (sources.length === 0) return badge

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent side="top">
          <div className="text-xs space-y-1">
            <p className="font-semibold mb-1">Inherited from:</p>
            {sources.map((s, i) =>
              s.href ? (
                <Link key={`${s.refCode}-${i}`} href={s.href} className="block hover:underline">
                  {s.refCode}
                </Link>
              ) : (
                <p key={`${s.refCode}-${i}`}>{s.refCode}</p>
              ),
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default InheritedBadge
