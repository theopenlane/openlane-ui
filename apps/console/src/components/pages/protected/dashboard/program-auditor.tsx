'use client'

import { Card } from '@repo/ui/cardpanel'
import { CircleCheck, CircleX } from 'lucide-react'
import { SetAuditorDialog } from './set-auditor-dialog'

interface ProgramAuditorProps {
  firm?: string | null
  name?: string | null
  email?: string | null
  isReady?: boolean
}

const ProgramAuditor = ({ firm, name, email, isReady }: ProgramAuditorProps) => {
  const hasAuditor = !!(firm || name || email)
  return (
    <Card className="p-8 w-full">
      <h2 className="text-lg font-semibold mb-4">Auditor of this program</h2>

      {hasAuditor ? (
        <div className="space-y-3 text-sm">
          <div className="flex border-b pb-2.5">
            <span className="block w-32">Firm:</span> <span>{firm || '—'}</span>
          </div>
          <div className="flex border-b pb-2.5">
            <span className="block w-32">Name:</span> <span>{name || '—'}</span>
          </div>
          <div className="flex border-b pb-2.5">
            <span className="block w-32">Email:</span> <span>{email || '—'}</span>
          </div>
          <div className="flex pb-2.5">
            <span className="block w-32">Auditor Ready:</span>
            <span>
              {isReady ? (
                <div className="flex gap-1 items-center text-green-500">
                  <CircleCheck size={16} />
                  <span>Ready</span>
                </div>
              ) : (
                <div className="flex gap-1 items-center text-red-500">
                  <CircleX size={16} />
                  <span>Not ready</span>
                </div>
              )}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-muted-foreground text-sm">No auditor assigned yet.</p>
          <SetAuditorDialog />
        </div>
      )}
    </Card>
  )
}

export default ProgramAuditor
