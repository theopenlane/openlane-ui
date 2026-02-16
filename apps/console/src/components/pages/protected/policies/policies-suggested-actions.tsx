'use client'

import * as React from 'react'
import { AlertCircle, Inbox, ChevronDown, X } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@radix-ui/react-popover'
import { Button } from '@repo/ui/button'
import { usePolicySuggestedActions } from '@/lib/graphql-hooks/internal-policy'
import Link from 'next/link'

export function PolicySuggestedActions() {
  const [open, setOpen] = React.useState(false)
  const { data } = usePolicySuggestedActions()

  const needsMyApproval = data?.needsMyApproval?.edges?.flatMap((e) => (e?.node ? [e.node] : [])) ?? []
  const missingApprover = data?.missingApprover?.edges?.flatMap((e) => (e?.node ? [e.node] : [])) ?? []

  const stillDraftAfterWeek = data?.stillDraftAfterWeek?.edges?.flatMap((e) => (e?.node ? [e.node] : [])) ?? []

  const recentComments = data?.recentComments?.edges?.flatMap((e) => (e?.node ? [e.node] : [])) ?? []

  const badgeCount = needsMyApproval.length + missingApprover.length + stillDraftAfterWeek.length + recentComments.length

  if (badgeCount === 0) return null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="secondary" className="relative h-8 p-2">
          <div className="flex gap-1 items-center">
            <Inbox size={18} />
            <span className="text-xs relative -left-1 -top-1 inline-flex w-[15px] h-[15px] items-center justify-center rounded-full bg-red-500 font-normal text-white shadow">{badgeCount}</span>
            <ChevronDown className="hidden h-4 w-4 sm:inline" />
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" sideOffset={12} className="w-[380px] rounded-2xl border-muted-foreground/10 bg-popover p-0 shadow-xl z-30">
        <div className="flex items-center justify-between gap-2 px-5 pt-4 pb-1">
          <h3 className="text-lg font-semibold">Policy Suggested Actions</h3>
          <X className="h-4 w-4 cursor-pointer" onClick={() => setOpen(false)} />
        </div>

        <div className=" pt-1">
          <div className="divide-y max-h-[360px] px-5 overflow-y-auto">
            {needsMyApproval.map((policy) => (
              <Row key={`approve-${policy.id}`} text={`${policy.name} requires your approval.`} actionLabel="Approve" id={policy.id} />
            ))}
            {missingApprover.map((policy) => (
              <Row key={`missing-${policy.id}`} text={`${policy.name} has no approver assigned.`} actionLabel="Assign" id={policy.id} />
            ))}
            {stillDraftAfterWeek.map((policy) => (
              <Row key={`draft-${policy.id}`} text={`${policy.name} is still draft after 7 days.`} actionLabel="Review" id={policy.id} />
            ))}
            {recentComments.map((policy) => (
              <Row key={`comments-${policy.id}`} text={`${policy.name} has new comments awaiting your response.`} actionLabel="Respond" id={policy.id} />
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

type RowProps = {
  id: string
  text: string
  actionLabel: string
}

function Row({ id, text, actionLabel }: RowProps) {
  return (
    <div className="group flex items-center gap-3 py-4">
      <AlertCircle className="h-4 w-4" />

      <p className="flex-1 text-sm tracking-normal">{text}</p>

      <Link href={`/policies/${id}/view`}>
        <Button size="sm" variant="secondary" className="h-8 p-2">
          {actionLabel}
        </Button>
      </Link>
    </div>
  )
}
