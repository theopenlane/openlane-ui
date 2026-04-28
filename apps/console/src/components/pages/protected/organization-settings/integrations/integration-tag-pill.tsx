import React from 'react'
import { Badge } from '@repo/ui/badge'

type IntegrationTagPillProps = {
  tag: string
}

const TAG_COLORS: Record<string, string> = {
  directory: 'bg-primary/10 border-primary/20',
  messaging: 'bg-[hsl(207,100%,33%)]/10 border-[hsl(207,100%,33%)]/20',
  vulnerabilities: 'bg-[hsl(43,89%,66%)]/10 border-[hsl(43,89%,66%)]/20',
  findings: 'bg-[hsl(15,89%,66%)]/10 border-[hsl(15,89%,66%)]/20',
  risks: 'bg-[hsl(15,98%,45%)]/10 border-[hsl(15,98%,45%)]/20',
  assets: 'bg-[hsl(190,98%,45%)]/10 border-[hsl(190,98%,45%)]/20',
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
