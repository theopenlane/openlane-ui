'use client'

import React from 'react'
import { FileWarning } from 'lucide-react'

type InfoCardProps = {
  tone: 'error' | 'muted'
  message: React.ReactNode
  action?: React.ReactNode
}

export const InfoCard: React.FC<InfoCardProps> = ({ tone, message, action }) => (
  <div className="flex flex-col items-center gap-3 rounded-md border border-muted bg-muted/40 p-6 text-sm">
    <FileWarning className={tone === 'error' ? 'h-6 w-6 text-destructive' : 'h-6 w-6 text-muted-foreground'} />
    <div className="text-center">{message}</div>
    {action}
  </div>
)
