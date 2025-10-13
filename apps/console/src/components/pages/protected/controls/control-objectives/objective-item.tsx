'use client'

import React from 'react'
import { AccordionItem, AccordionTrigger, AccordionContent } from '@radix-ui/react-accordion'
import { Button } from '@repo/ui/button'
import { ChevronRight, Pencil } from 'lucide-react'
import { ControlObjectiveFieldsFragment, ControlObjectiveObjectiveStatus } from '@repo/codegen/src/schema'
import { useAccountRole } from '@/lib/authz/access-api'
import { canEdit } from '@/lib/authz/utils'
import { ObjectEnum } from '@/lib/authz/enums/object-enum'
import { useSession } from 'next-auth/react'
import { ControlObjectiveCard } from './control-objective-card'

type Props = {
  node: ControlObjectiveFieldsFragment
  onEdit: (node: ControlObjectiveFieldsFragment) => void
  onUnarchive: (node: ControlObjectiveFieldsFragment) => void
}

export const ObjectiveItem: React.FC<Props> = ({ node, onEdit, onUnarchive }) => {
  const { data: session } = useSession()
  const { data: permission, isLoading: permLoading } = useAccountRole(session, ObjectEnum.CONTROL_OBJECTIVE, node.id)
  const isEditAllowed = canEdit(permission?.roles)

  return (
    <AccordionItem value={node.id}>
      <div className="flex justify-between items-center my-2">
        <AccordionTrigger className="group flex items-center px-2 py-2 bg-transparent">
          <ChevronRight size={22} className="mr-2 text-brand transition-transform group-data-[state=open]:rotate-90" />
          <span className="text-base font-medium">{node.name}</span>
        </AccordionTrigger>

        {node.status === ControlObjectiveObjectiveStatus.ARCHIVED ? (
          <Button className="h-8 !px-2" variant="outline" icon={<Pencil />} iconPosition="left" onClick={() => onUnarchive(node)} disabled={permLoading /* optionally require edit permission too */}>
            Unarchive
          </Button>
        ) : (
          <Button className="h-8 !px-2" variant="outline" icon={<Pencil />} iconPosition="left" onClick={() => onEdit(node)} disabled={permLoading || !isEditAllowed}>
            Edit
          </Button>
        )}
      </div>

      <AccordionContent>
        <ControlObjectiveCard obj={node} />
      </AccordionContent>
    </AccordionItem>
  )
}
