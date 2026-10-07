'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import Menu from '@/components/shared/menu/menu'
import MenuItem from '@/components/shared/menu/menu-item'
import { reportActionAnchor } from '@/components/shared/element-anchor/element-anchor'
import { canEdit, hasPermission } from '@/lib/authz/utils'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { SendAcknowledgementRequestDialog } from './acknowledgement-request/send-acknowledgement-request-dialog'

export const PoliciesReportActionsMenu = () => {
  const { data: permission } = useOrganizationRoles()
  const { data: session } = useSession()
  const [isAcknowledgementDialogOpen, setIsAcknowledgementDialogOpen] = useState(false)

  if (!canEdit(permission?.roles, session) || !hasPermission(permission?.roles, AccessEnum.CanCreateAssessment, session)) return null

  return (
    <>
      <Menu
        closeOnSelect
        triggerAnchor={reportActionAnchor(ObjectTypes.INTERNAL_POLICY, 'actions-menu')}
        content={(close) => (
          <MenuItem
            icon={<Send size={16} />}
            {...reportActionAnchor(ObjectTypes.INTERNAL_POLICY, 'send-acknowledgement-request')}
            onSelect={() => {
              close()
              setIsAcknowledgementDialogOpen(true)
            }}
          >
            Send acknowledgment request
          </MenuItem>
        )}
      />
      <SendAcknowledgementRequestDialog open={isAcknowledgementDialogOpen} onOpenChange={setIsAcknowledgementDialogOpen} />
    </>
  )
}
