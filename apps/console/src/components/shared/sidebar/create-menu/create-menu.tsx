'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Plus } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { useSession } from 'next-auth/react'
import Menu from '@/components/shared/menu/menu'
import { CreateBtnIcon } from '@/components/shared/enum-mapper/common-enum'
import { useModuleAccess } from '@/lib/subscription-plan/hooks/use-module-access'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { hasPermission } from '@/lib/authz/utils'
import { CREATE_MENU_ITEMS, type CreateMenuDialogKey, type CreateMenuItem } from './create-menu-items'

const DIALOG_COMPONENTS: Record<CreateMenuDialogKey, React.ComponentType<{ open: boolean; onOpenChange: (open: boolean) => void }>> = {
  task: dynamic(() => import('@/components/pages/protected/tasks/create-task/dialog/create-task-dialog').then((mod) => mod.CreateTaskDialog), { ssr: false }),
}

const entryClassName = 'flex items-center space-x-2 justify-start'

const CreateMenuEntryContent: React.FC<{ item: CreateMenuItem }> = ({ item: { icon: Icon, label } }) => (
  <>
    <Icon size={16} />
    <span>{label}</span>
  </>
)

const CreateMenu: React.FC<{ expanded: boolean }> = ({ expanded }) => {
  const { data: session } = useSession()
  const { data: orgPermission } = useOrganizationRoles()
  const { hasObjectType } = useModuleAccess()
  const [openDialog, setOpenDialog] = useState<CreateMenuDialogKey | null>(null)

  const items = CREATE_MENU_ITEMS.filter((item) => (!item.objectType || hasObjectType(item.objectType)) && (!item.permission || hasPermission(orgPermission?.roles, item.permission, session)))

  if (items.length === 0) {
    return null
  }

  const ActiveDialog = openDialog ? DIALOG_COMPONENTS[openDialog] : null

  return (
    <>
      <Menu
        trigger={
          expanded ? (
            <Button variant="primary" className="flex-1">
              <Plus size={16} />
              <p>Create</p>
            </Button>
          ) : (
            CreateBtnIcon
          )
        }
        side="right"
        align="start"
        closeOnSelect
        content={(close) =>
          items.map((item) =>
            item.dialog ? (
              <Button
                key={item.label}
                size="sm"
                variant="transparent"
                className={entryClassName}
                onClick={() => {
                  setOpenDialog(item.dialog)
                  close()
                }}
              >
                <CreateMenuEntryContent item={item} />
              </Button>
            ) : (
              <Button key={item.label} asChild size="sm" variant="transparent" className={entryClassName}>
                <Link href={item.href} onClick={close}>
                  <CreateMenuEntryContent item={item} />
                </Link>
              </Button>
            ),
          )
        }
      />
      {ActiveDialog && <ActiveDialog open onOpenChange={(open) => !open && setOpenDialog(null)} />}
    </>
  )
}

export default CreateMenu
