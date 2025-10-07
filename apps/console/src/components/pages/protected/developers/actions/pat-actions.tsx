'use client'

import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useDeleteApiToken, useDeletePersonalAccessToken } from '@/lib/graphql-hooks/tokens'
import { useNotification } from '@/hooks/useNotification'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import PersonalAccessTokenEdit from '../personal-access-token-edit-dialog'

type TokenActionProps = {
  tokenId: string
  tokenName: string
  tokenDescription?: string
  tokenExpiration: string
  tokenAuthorizedOrganizations?: { id: string; name: string }[]
}

const ICON_SIZE = 16

export const TokenAction = ({ tokenId, tokenName, tokenDescription, tokenExpiration, tokenAuthorizedOrganizations }: TokenActionProps) => {
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
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    } finally {
      setIsDeleteDialogOpen(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-4 justify-end">
        <PersonalAccessTokenEdit tokenDescription={tokenDescription} tokenExpiration={tokenExpiration} tokenAuthorizedOrganizations={tokenAuthorizedOrganizations} />
        <Trash2
          style={{ color: 'var(--destructive)' }}
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
        title={`Delete ${isOrg ? 'API Token' : 'Personal Token'}`}
        description={
          <>
            This action cannot be undone. This will permanently remove the <b>{tokenName}</b> from the organization.
          </>
        }
      />
    </>
  )
}
