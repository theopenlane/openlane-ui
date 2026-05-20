'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@radix-ui/react-collapsible'
import { ChevronDown } from 'lucide-react'
import { Card } from '@repo/ui/cardpanel'
import { useGetControlById } from '@/lib/graphql-hooks/control'
import { ControlIconMapper16 } from '@/components/shared/enum-mapper/control-enum'
import { type ControlControlStatus } from '@repo/codegen/src/schema'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { TableSkeleton } from '@/components/shared/skeleton/table-skeleton'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'

type Props = {
  controlId: string
}

const ParentControlCard: React.FC<Props> = ({ controlId }) => {
  const [open, setOpen] = useState(true)
  const { data, isLoading } = useGetControlById(controlId)
  const { convertToReadOnly } = usePlateEditor()

  const control = data?.control
  const href = `/controls/${controlId}`

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Parent control</h2>
          <CollapsibleTrigger asChild>
            <button className="text-muted-foreground hover:text-foreground transition-colors" aria-label={open ? 'Collapse' : 'Expand'}>
              <ChevronDown size={18} className={`transition-transform duration-200 ${open ? '' : '-rotate-90'}`} />
            </button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent>
          {isLoading ? (
            <TableSkeleton />
          ) : !control ? (
            <p className="text-sm text-muted-foreground">Parent control not found.</p>
          ) : (
            <div className="rounded-md border divide-y">
              <div className="grid grid-cols-[120px_1fr_160px] gap-4 px-3 py-2 bg-muted/40 text-xs font-medium text-muted-foreground">
                <span>Ref Code</span>
                <span>Description</span>
                <span>Status</span>
              </div>
              <div className="grid grid-cols-[120px_1fr_160px] gap-4 px-3 py-3 items-center">
                <Link href={href} className="text-sm text-blue-500 hover:underline truncate">
                  {control.refCode}
                </Link>
                <div className="text-sm line-clamp-2">{control.description ? convertToReadOnly(control.description, 0) : <span className="text-muted-foreground">-</span>}</div>
                <div className="flex items-center gap-1.5 text-sm">
                  {control.status ? (
                    <>
                      {ControlIconMapper16[control.status as ControlControlStatus]}
                      <span>{getEnumLabel(control.status)}</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

export default ParentControlCard
