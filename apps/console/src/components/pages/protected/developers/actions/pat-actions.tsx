'use client'

import { useState } from 'react'
import { MoreHorizontal, Trash2 } from 'lucide-react'
import { pageStyles } from '../page.styles'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { usePathname } from 'next/navigation'
import { useDeleteApiToken, useDeletePersonalAccessToken } from '@/lib/graphql-hooks/tokens'
import { useNotification } from '@/hooks/useNotification'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { Button } from '@repo/ui/button'

type TokenActionProps = {
  tokenId: string
}

const ICON_SIZE = 12

export const TokenAction = ({ tokenId }: TokenActionProps) => {
  const { actionIcon } = pageStyles()
  const { mutateAsync: deletePersonalToken } = useDeletePersonalAccessToken()
  const { mutateAsync: deleteApiToken } = useDeleteApiToken()
  const { successNotification, errorNotification } = useNotification()
  const path = usePathname()
  const isOrg = path.includes('/organization-settings')

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const handleDeleteToken = async () => {
    try {
      isOrg ? await deleteApiToken({ deleteAPITokenId: tokenId }) : await deletePersonalToken({ deletePersonalAccessTokenId: tokenId })

      successNotification({
        title: 'Token deleted successfully',
      })
    } catch {
      errorNotification({
        title: 'There was a problem deleting this token, please try again',
      })
    } finally {
      setIsDeleteDialogOpen(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="cursor-pointer justify-self-end" asChild>
          <MoreHorizontal className={actionIcon()} />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-10">
          <DropdownMenuGroup>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault()
                setIsDeleteDialogOpen(true)
              }}
            >
              <div className="flex items-center cursor-pointer">
                <Trash2 width={ICON_SIZE} className="mr-2" />
                Delete token
              </div>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteToken}
        title="Confirm Deletion"
        description={`This action cannot be undone, this will permanently remove the ${isOrg ? 'API Token' : 'Personal Token'} from the organization.`}
      />
    </>
  )
}
