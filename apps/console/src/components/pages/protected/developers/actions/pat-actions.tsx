'use client'

import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useDeleteApiToken, useDeletePersonalAccessToken } from '@/lib/graphql-hooks/tokens'
import { useNotification } from '@/hooks/useNotification'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import PersonalAccessTokenEdit from '../personal-access-token-edit-dialog'
import SsoAuthorizationDropdown from '../sso-authorization-dropdown'
import { Button } from '@repo/ui/button'

type TokenActionProps = {
  tokenId: string
  tokenName: string
  tokenDescription?: string
  tokenExpiration: string
  tokenAuthorizedOrganizations?: { id: string; name: string }[]
  tokenSsoAuthorizations?: Record<string, string> | null
}

const ICON_SIZE = 16

export const TokenAction = ({ tokenId, tokenName, tokenDescription, tokenExpiration, tokenAuthorizedOrganizations, tokenSsoAuthorizations }: TokenActionProps) => {
  const { mutateAsync: deletePersonalToken } = useDeletePersonalAccessToken()
  const { mutateAsync: deleteApiToken } = useDeleteApiToken()
  const { successNotification, errorNotification } = useNotification()
  const path = usePathname()
  const isApiTokens = path.includes('/api-tokens')
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const handleDeleteToken = async () => {
    try {
      if (isApiTokens) {
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
      <div className="flex items-center gap-1 justify-end">
        <PersonalAccessTokenEdit
          tokenName={tokenName}
          tokenId={tokenId}
          tokenDescription={tokenDescription}
          tokenExpiration={tokenExpiration}
          tokenAuthorizedOrganizations={tokenAuthorizedOrganizations}
        />
        <SsoAuthorizationDropdown tokenId={tokenId} tokenAuthorizedOrganizations={tokenAuthorizedOrganizations} tokenSsoAuthorizations={tokenSsoAuthorizations} />
        <Button
          onClick={(e) => {
            e.stopPropagation()
            setIsDeleteDialogOpen(true)
          }}
          className="!bg-transparent !hover:bg-transparent !text-inherit flex items-center justify-center p-2"
        >
          <Trash2 style={{ color: 'var(--destructive)' }} size={ICON_SIZE} className={'cursor-pointer'} />
        </Button>
      </div>

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteToken}
        title={`Delete ${isApiTokens ? 'API Token' : 'Personal Token'}`}
        description={
          <>
            This action cannot be undone. This will permanently remove the <b>{tokenName}</b> from the organization.
          </>
        }
      />
    </>
  )
}
