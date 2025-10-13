'use client'

import React from 'react'
import { AccordionItem, AccordionTrigger, AccordionContent } from '@radix-ui/react-accordion'
import { Button } from '@repo/ui/button'
import { ChevronRight, Check, Pencil } from 'lucide-react'
import { ControlImplementationFieldsFragment } from '@repo/codegen/src/schema'
import { ControlImplementationCard } from './control-implementation-card'
import { useSession } from 'next-auth/react'
import { useAccountRole } from '@/lib/authz/access-api'
import { canEdit } from '@/lib/authz/utils'
import { ObjectEnum } from '@/lib/authz/enums/object-enum'

type Props = {
  idx: number
  node: ControlImplementationFieldsFragment
  onEdit: (node: ControlImplementationFieldsFragment) => void
  onMarkVerified: (id: string) => void
  isUpdating?: boolean
}

export const ImplementationItem: React.FC<Props> = ({ idx, node, onEdit, onMarkVerified, isUpdating }) => {
  const { data: session } = useSession()
  const { data: permission, isLoading: permLoading } = useAccountRole(session, ObjectEnum.CONTROL_IMPLEMENTATION, node.id)
  const isEditAllowed = canEdit(permission?.roles)

  return (
    <AccordionItem value={node.id}>
      <div className="flex justify-between items-center my-2">
        <AccordionTrigger className="group flex items-center px-2 py-2 bg-transparent">
          <ChevronRight size={22} className="mr-2 text-brand transition-transform group-data-[state=open]:rotate-90" />
          <span className="text-base font-medium">{`Implementation ${idx + 1}`}</span>
        </AccordionTrigger>

        <div className="flex gap-2">
          {isEditAllowed ? (
            node.verified ? (
              <Button className="h-8 !px-2" icon={<Check />} iconPosition="left" disabled>
                Verified
              </Button>
            ) : (
              <Button className="h-8 !px-2" icon={<Check />} iconPosition="left" onClick={() => onMarkVerified(node.id)} disabled={permLoading || isUpdating}>
                Mark verified
              </Button>
            )
          ) : node.verified ? (
            <Button className="h-8 !px-2" icon={<Check />} iconPosition="left" disabled>
              Verified
            </Button>
          ) : null}
          {isEditAllowed && (
            <Button className="h-8 !px-2" variant="outline" icon={<Pencil />} iconPosition="left" onClick={() => onEdit(node)} disabled={permLoading || isUpdating}>
              Edit
            </Button>
          )}
        </div>
      </div>

      <AccordionContent>
        <ControlImplementationCard obj={node} />
      </AccordionContent>
    </AccordionItem>
  )
}
