import React from 'react'
import { Badge } from '@repo/ui/badge'

type IntegrationTagPillProps = {
  tag: string
}

const TAG_COLORS: Record<string, string> = {
  'directory-sync': 'bg-primary/10 border-primary/20',
  messaging: 'bg-[hsl(207,100%,33%)]/10 border-[hsl(207,100%,33%)]/20',
  vulnerabilities: 'bg-[hsl(43,89%,66%)]/10 border-[hsl(43,89%,66%)]/20',
  assets: 'bg-muted-foreground/10 border-muted-foreground/20',
}

const IntegrationTagPill = ({ tag }: IntegrationTagPillProps) => {
  const colorClass = TAG_COLORS[tag] ?? ''

  return (
    <Badge variant="outline" className={`flex items-center gap-1 w-fit truncate max-w-[120px] text-foreground ${colorClass}`} title={tag}>
      <span className="truncate">{tag}</span>
    </Badge>
  )
}

export default IntegrationTagPill
