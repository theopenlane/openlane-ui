'use client'

import React from 'react'
import { CircleAlert, CircleCheck, CircleX, Info } from 'lucide-react'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { getEmailAuthRows, getWellKnownRows, type PostureRow, type PostureStatus, type ScanMetadata } from './scan-metadata'

type Props = {
  metadata: ScanMetadata | null
}

const STATUS_ICONS: Record<PostureStatus, { Icon: typeof CircleCheck; className: string }> = {
  good: { Icon: CircleCheck, className: 'text-success' },
  warn: { Icon: CircleAlert, className: 'text-warning' },
  bad: { Icon: CircleX, className: 'text-destructive' },
  info: { Icon: Info, className: 'text-muted-foreground' },
}

const Row: React.FC<{ row: PostureRow }> = ({ row }) => {
  const { Icon, className } = STATUS_ICONS[row.status]

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">{row.label}</p>
        <span className={`inline-flex items-center gap-1.5 text-sm text-right ${className}`}>
          <Icon size={14} className="shrink-0" /> {row.value}
        </span>
      </div>
      {row.detail && <p className="text-xs text-muted-foreground mt-2 break-words">{row.detail}</p>}
    </div>
  )
}

const PostureCard: React.FC<{ title: string; description: string; rows: PostureRow[] }> = ({ title, description, rows }) => {
  if (!rows.length) {
    return null
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-lg font-medium leading-7">{title}</p>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        <div className="grid grid-cols-2 gap-4">
          {rows.map((row) => (
            <Row key={row.key} row={row} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export const EmailAuthSection: React.FC<Props> = ({ metadata }) => (
  <PostureCard title="Email Authentication" description="Whether someone can send mail that looks like it came from this domain" rows={getEmailAuthRows(metadata)} />
)

export const WebPostureSection: React.FC<Props> = ({ metadata }) => (
  <PostureCard title="Web Posture" description="Files that tell researchers, crawlers and AI agents how to treat the site" rows={getWellKnownRows(metadata)} />
)
