'use client'

import { Button } from '@repo/ui/button'
import { Label } from '@repo/ui/label'
import { cn } from '@repo/ui/lib/utils'
import { Copy, ExternalLink } from 'lucide-react'
import { useNotification } from '@/hooks/useNotification'

type UrlDisplayProps = {
  label: string
  url: string
  emptyText?: string
  className?: string
}

const UrlDisplay = ({ label, url, emptyText = 'Not available yet', className }: UrlDisplayProps) => {
  const { successNotification, errorNotification } = useNotification()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      successNotification({ title: 'Copied!' })
    } catch {
      errorNotification({ title: 'Copy failed' })
    }
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex items-center gap-2 border rounded-md py-1 px-3 h-10 w-full min-w-0">
        <Label className="text-sm text-inverted-muted-foreground font-medium leading-6 shrink-0">{label}</Label>
        <span className={cn('text-sm truncate', !url && 'text-inverted-muted-foreground')}>{url || emptyText}</span>
      </div>
      <Button type="button" onClick={handleCopy} variant="secondary" disabled={!url} aria-label={`Copy ${label}`} icon={<Copy size={14} />} iconPosition="center" />
      {url ? (
        <a href={url} rel="noreferrer" target="_blank" aria-label={`Open ${label}`}>
          <Button type="button" variant="secondary" icon={<ExternalLink size={14} />} iconPosition="center" />
        </a>
      ) : (
        <Button type="button" variant="secondary" disabled aria-label={`Open ${label}`} icon={<ExternalLink size={14} />} iconPosition="center" />
      )}
    </div>
  )
}

export default UrlDisplay
