'use client'

import { Link } from '@/components/shared/link/link'
import { Label } from '@repo/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { cn } from '@repo/ui/lib/utils'

const ORGANIZATION_SETTINGS_HREF = '/organization-settings/general-settings'
const MANAGE_DOMAINS_TOOLTIP = 'Update the domains available in Organization Settings.'

interface DomainSelectFieldProps {
  id: string
  domains: string[]
  value: string
  onValueChange: (domain: string) => void
  disabled?: boolean
}

export const DomainSelectField = ({ id, domains, value, onValueChange, disabled = false }: DomainSelectFieldProps) => {
  const hasSingleDomain = domains.length === 1

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-sm">
        Domain
      </Label>
      <Select value={value} onValueChange={onValueChange} disabled={disabled || hasSingleDomain}>
        <SelectTrigger id={id}>
          <SelectValue placeholder="Select a domain" />
        </SelectTrigger>
        <SelectContent>
          {domains.map((domain) => (
            <SelectItem key={domain} value={domain}>
              {domain}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className={cn('flex items-center gap-2', hasSingleDomain ? 'justify-between' : 'justify-end')}>
        {hasSingleDomain && <p className="text-xs text-muted-foreground">Only one domain available.</p>}
        <SystemTooltip
          content={MANAGE_DOMAINS_TOOLTIP}
          side="top"
          portal
          icon={
            <Link href={ORGANIZATION_SETTINGS_HREF} newTab className="text-xs">
              Manage Domains
            </Link>
          }
        />
      </div>
    </div>
  )
}
