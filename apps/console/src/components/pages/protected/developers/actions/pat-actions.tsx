'use client'

import { KeyRound, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useDeleteApiToken, useDeletePersonalAccessToken } from '@/lib/graphql-hooks/tokens'
import { useNotification } from '@/hooks/useNotification'
import { useOrganization } from '@/hooks/useOrganization'
import { useSSOAuthorize } from '../hooks/sso'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import PersonalApiKeyDialog from '../personal-access-token-crud-slideout'
import { Button } from '@repo/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'

type TokenActionProps = {
  tokenId: string
  tokenName: string
  tokenDescription?: string
  tokenExpiresAt?: string | null
  tokenAuthorizedOrganizations?: { id: string; name: string }[]
  tokenSsoAuthorizations?: Record<string, string> | null
  tokenScopes?: string[]
}

export const TokenAction = ({ tokenId, tokenName, tokenDescription, tokenExpiresAt, tokenAuthorizedOrganizations, tokenSsoAuthorizations, tokenScopes }: TokenActionProps) => {
  const { mutateAsync: deletePersonalToken } = useDeletePersonalAccessToken()
  const { mutateAsync: deleteApiToken } = useDeleteApiToken()
  const { successNotification, errorNotification } = useNotification()
  const { allOrgs } = useOrganization()
  const path = usePathname()
  const isApiTokens = path.includes('/api-tokens')
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const { handleSSOAuthorize, isAuthorizingSSO } = useSSOAuthorize({ isApiKeyPage: false, isEditMode: true, editTokenId: tokenId, createdTokenId: '' })

  const orgsNeedingSSO = isApiTokens
    ? []
    : allOrgs.filter(
        (org) => tokenAuthorizedOrganizations?.some((authOrg) => authOrg.id === org?.node?.id) && org?.node?.setting?.identityProviderLoginEnforced && !tokenSsoAuthorizations?.[org?.node?.id ?? ''],
      )

  const handleDeleteToken = async () => {
    try {
      if (isApiTokens) {
        await deleteApiToken({ deleteAPITokenId: tokenId })
      } else {
        await deletePersonalToken({ deletePersonalAccessTokenId: tokenId })
      }
      successNotification({ title: 'Token deleted successfully' })
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    } finally {
      setIsDeleteDialogOpen(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" className="-mr-2">
            <MoreHorizontal className="h-4 w-4 text-brand" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-40">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              setIsEditOpen(true)
            }}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>

          {orgsNeedingSSO.map((org) => (
            <DropdownMenuItem key={org?.node?.id} disabled={isAuthorizingSSO} onClick={() => org?.node?.id && handleSSOAuthorize(org.node.id)}>
              <KeyRound className="h-4 w-4 mr-2" />
              {isAuthorizingSSO ? 'Authorizing...' : orgsNeedingSSO.length === 1 ? 'Authorize for SSO' : `Authorize ${org?.node?.displayName} for SSO`}
            </DropdownMenuItem>
          ))}

          <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => setIsDeleteDialogOpen(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <PersonalApiKeyDialog
        editToken={{
          id: tokenId,
          name: tokenName,
          description: tokenDescription,
          expiresAt: tokenExpiresAt,
          authorizedOrganizations: tokenAuthorizedOrganizations,
          scopes: tokenScopes,
        }}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />

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
