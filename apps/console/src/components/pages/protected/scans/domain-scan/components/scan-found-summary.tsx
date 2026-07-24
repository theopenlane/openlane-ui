'use client'

import React from 'react'
import { Box, Server, ShieldAlert, Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardTitle } from '@repo/ui/cardpanel'
import { Separator } from '@repo/ui/separator'

type ScanFoundSummaryProps = {
  hostname: string
  systemsCount: number
  assetsCount: number
  vendorsCount: number
  findingsCount: number
}

export const ScanFoundSummary = ({ hostname, systemsCount, assetsCount, vendorsCount, findingsCount }: ScanFoundSummaryProps) => {
  const rows: { icon: React.ReactNode; count: number; label: string }[] = [
    { icon: <Server size={16} />, count: systemsCount, label: 'systems' },
    { icon: <Box size={16} />, count: assetsCount, label: 'assets' },
    { icon: <Users size={16} />, count: vendorsCount, label: 'vendors' },
    { icon: <ShieldAlert size={16} />, count: findingsCount, label: 'findings' },
  ]

  return (
    <Card className="mb-6">
      <CardTitle className="text-xl py-3">Here&apos;s what we found</CardTitle>
      <CardDescription className="pb-3">We scanned {hostname} and found the following. Review and edit each section as you go.</CardDescription>
      <Separator separatorClass="bg-border" />
      <CardContent className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-4">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-3 rounded-md border border-border px-3 py-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand/10 text-brand">{row.icon}</span>
            <span className="text-base font-semibold">{row.count}</span>
            <span className="text-sm text-muted-foreground">{row.label}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
