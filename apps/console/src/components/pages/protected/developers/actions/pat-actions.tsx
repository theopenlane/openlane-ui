'use client'

import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useDeleteApiToken, useDeletePersonalAccessToken } from '@/lib/graphql-hooks/tokens'
import { useNotification } from '@/hooks/useNotification'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'

type TokenActionProps = {
  tokenId: string
}

const ICON_SIZE = 16

export const TokenAction = ({ tokenId }: TokenActionProps) => {
  const { mutateAsync: deletePersonalToken } = useDeletePersonalAccessToken()
  const { mutateAsync: deleteApiToken } = useDeleteApiToken()
  const { successNotification, errorNotification } = useNotification()
  const path = usePathname()
  const isOrg = path.includes('/organization-settings')

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const handleDeleteToken = async () => {
    try {
      if (isOrg) {
        await deleteApiToken({ deleteAPITokenId: tokenId })
      } else {
        await deletePersonalToken({ deletePersonalAccessTokenId: tokenId })
      }

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
      <div className="flex items-center gap-2 justify-end">
        <Trash2
          size={ICON_SIZE}
          onClick={(e) => {
            e.stopPropagation()
            setIsDeleteDialogOpen(true)
          }}
          className={'cursor-pointer'}
        />
      </div>

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteToken}
        title="Confirm Deletion"
        description={`This action cannot be undone. This will permanently remove the ${isOrg ? 'API Token' : 'Personal Token'} from the organization.`}
      />
    </>
  )
}
