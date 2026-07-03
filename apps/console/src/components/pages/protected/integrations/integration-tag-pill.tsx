import React from 'react'
import { Badge } from '@repo/ui/badge'

type IntegrationTagPillProps = {
  tag: string
  /** Overrides the displayed label without changing the tag used for color lookup */
  label?: string
}

const TAG_COLORS: Record<string, string> = {
  directory: 'bg-primary/10 border-primary/20',
  messaging: 'bg-[hsl(207,100%,33%)]/10 border-[hsl(207,100%,33%)]/20',
  vulnerabilities: 'bg-[hsl(43,89%,66%)]/10 border-[hsl(43,89%,66%)]/20',
  findings: 'bg-[hsl(15,89%,66%)]/10 border-[hsl(15,89%,66%)]/20',
  assets: 'bg-[hsl(190,98%,45%)]/10 border-[hsl(190,98%,45%)]/20',
  document: 'bg-[hsl(270,89%,66%)]/10 border-[hsl(270,89%,66%)]/20',
}

export type TagSectionMeta = { title: string; description?: string; tags: string[] }

export const TAG_SECTIONS: TagSectionMeta[] = [
  { title: 'Identity & Access', description: 'Keep your team and permissions aligned with the systems you already use', tags: ['directory'] },
  { title: 'Asset Inventory', description: 'Maintain a clear view of the systems, devices, and services in scope', tags: ['assets'] },
  { title: 'Security Findings', description: 'Turn security issues into actionable compliance work without manual tracking', tags: ['vulnerabilities', 'findings'] },
  { title: 'Policies & Documents', description: 'Keep policies and supporting documents connected to your source of truth', tags: ['document'] },
  { title: 'Notifications', description: 'Make sure the right people see important compliance updates where they already work', tags: ['messaging', 'notifications', 'email'] },
]

// Fallback section for integrations whose tags don't match any entry in TAG_SECTIONS
export const OTHER_TAG_SECTION_META: TagSectionMeta = { title: 'Other', tags: [] }

const IntegrationTagPill = ({ tag, label }: IntegrationTagPillProps) => {
  const colorClass = TAG_COLORS[tag] ?? ''

  return (
    <Badge variant="outline" className={`flex items-center gap-1 w-fit truncate max-w-[120px] text-foreground ${colorClass}`} title={label ?? tag}>
      <span className="truncate">{label ?? tag}</span>
    </Badge>
  )
}

export default IntegrationTagPill
