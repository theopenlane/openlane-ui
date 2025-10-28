'use client'

import * as React from 'react'
import { AlertCircle, ChevronDown, Inbox, X } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@radix-ui/react-popover'
import { Button } from '@repo/ui/button'
import { useEvidenceSuggestedActions } from '@/lib/graphql-hooks/evidence'
import { useControlEvidenceStore } from '../../controls/hooks/useControlEvidenceStore'
import { useRouter } from 'next/navigation'

export default function EvidenceSuggestedActions() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)

  const { data } = useEvidenceSuggestedActions()
  const { setIsEditPreset } = useControlEvidenceStore()

  const unlinked = data?.unlinked?.edges?.map((e) => e?.node) ?? []
  const needingReview = data?.needingReview?.edges?.map((e) => e?.node) ?? []
  const needsRenewal = data?.needsRenewal?.edges?.map((e) => e?.node) ?? []

  const badgeCount = unlinked.length + needingReview.length + needsRenewal.length

  if (badgeCount === 0) {
    return null
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="secondary" aria-label="Suggested actions" className="relative h-8 p-2 w-full">
          <div className="flex gap-1 items-center">
            <Inbox size={18} />
            <span className="text-xs relative -left-1 -top-1 inline-flex w-[15px] h-[15px] items-center justify-center rounded-full bg-red-500 font-normal text-white shadow" aria-live="polite">
              {badgeCount}
            </span>
            <ChevronDown className="hidden h-4 w-4 sm:inline" />
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" sideOffset={12} className="w-[380px] rounded-2xl border-muted-foreground/10 bg-popover p-0 shadow-xl z-30">
        <div className="flex items-center justify-between gap-2 rounded-t-2xl px-5 pt-4 pb-1">
          <h3 className="text-lg font-semibold">Suggested Actions</h3>
          <X className="h-4 w-4 cursor-pointer" aria-label="Close" onClick={() => setOpen(false)} />
        </div>

        <div className="px-5 pt-1">
          <div className="divide-y max-h-[360px] overflow-y-auto">
            {needsRenewal.map((ev) => (
              <div key={`renew-${ev?.id}`} className="group flex items-center gap-3 py-4">
                <AlertCircle className="h-4 w-4" />
                <p className="flex-1 text-sm tracking-normal">
                  <strong>{ev?.name}</strong> needs renewal. Update this evidence to stay current.
                </p>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 p-2"
                  onClick={() => {
                    if (ev?.id) router.push(`/evidence?id=${ev?.id}`)
                  }}
                  aria-label="Renew evidence"
                >
                  Renew
                </Button>
              </div>
            ))}

            {needingReview.map((ev) => (
              <div key={`review-${ev?.id}`} className="group flex items-center gap-3 py-4">
                <AlertCircle className="h-4 w-4" />
                <p className="flex-1 text-sm tracking-normal">
                  <strong>{ev?.name}</strong> was submitted and is pending review.
                </p>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 p-2"
                  onClick={() => {
                    if (ev?.id) router.push(`/evidence?id=${ev?.id}`)
                  }}
                  aria-label="Review evidence"
                >
                  Review
                </Button>
              </div>
            ))}

            {unlinked.map((ev) => (
              <div key={`unlinked-${ev?.id}`} className="group flex items-center gap-3 py-4">
                <AlertCircle className="h-4 w-4" />
                <p className="flex-1 text-sm tracking-normal">
                  <strong>{ev?.name}</strong> has no associations. Link this evidence for better tracking.
                </p>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 p-2"
                  aria-label="Add evidence"
                  onClick={() => {
                    if (ev?.id) router.push(`/evidence?id=${ev?.id}`)
                    setIsEditPreset(true)
                  }}
                >
                  Add
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-black/5" />
      </PopoverContent>
    </Popover>
  )
}
