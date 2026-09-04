import React from 'react'
import { Badge } from '@repo/ui/badge'

type SectionHeaderProps = {
  label: string
  count: number
}

const SectionHeader = ({ label, count }: SectionHeaderProps) => (
  <h3 className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
    {label}
    <Badge variant="select">{count}</Badge>
  </h3>
)

export default SectionHeader
