import { useOrganization } from '@/hooks/useOrganization'
import { Organization } from '@repo/codegen/src/schema'
import { Avatar } from '@/components/shared/avatar/avatar'
import { Button } from '@repo/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { KeyRound } from 'lucide-react'
import { usePathname } from 'next/navigation'
import React, { useState } from 'react'
import { useGetOrganizationSetting } from '@/lib/graphql-hooks/organization'
import { useNotification } from '@/hooks/useNotification'

type SsoAuthorizationDropdownProps = {
  tokenId: string
  tokenAuthorizedOrganizations?: { id: string; name: string }[]
  tokenSsoAuthorizations?: Record<string, string> | null
}

const SsoAuthorizationDropdown: React.FC<SsoAuthorizationDropdownProps> = ({ tokenAuthorizedOrganizations, tokenId, tokenSsoAuthorizations }: SsoAuthorizationDropdownProps) => {
  const path = usePathname()
  const isOrg = path.includes('/organization-settings')
  const { currentOrgId, allOrgs, getOrganizationByID } = useOrganization()
  const { data } = useGetOrganizationSetting(currentOrgId)

  const currentOrganization = getOrganizationByID(currentOrgId || '')
  const [isSsoDropdownOpened, setIsSsoDropdownOpened] = useState(false)
  const [isAuthorizingSSO, setIsAuthorizingSSO] = useState<boolean>(false)
  const { errorNotification } = useNotification()

  const handleSSOAuthorize = async () => {
    try {
      setIsAuthorizingSSO(true)

      localStorage.setItem(
        'api_token',
        JSON.stringify({
          tokenType: isOrg ? 'api' : 'personal',
          isOrg,
        }),
      )

      const response = await fetch('/api/auth/sso/authorize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          organization_id: currentOrgId,
          token_id: tokenId,
          token_type: isOrg ? 'api' : 'personal',
        }),
      })

      const data = await response.json()

      if (response.ok && data.success && data.redirect_uri) {
        window.location.href = data.redirect_uri
      } else {
        throw new Error(data.error || 'SSO authorization failed')
      }
    } catch (error) {
      console.error('SSO authorization error:', error)
      errorNotification({
        title: 'SSO Authorization Failed',
        description: error instanceof Error ? error.message : 'An error occurred during SSO authorization',
      })
    } finally {
      setIsAuthorizingSSO(false)
    }
  }

  return (
    <DropdownMenu open={isSsoDropdownOpened} onOpenChange={setIsSsoDropdownOpened}>
      <DropdownMenuTrigger asChild>
        <Button className="!bg-transparent !hover:bg-transparent" icon={<KeyRound size={16} />}></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="border shadow-md w-[540px] overflow-y-auto p-0" align="end">
        <p className="text-muted-foreground text-xs p-4 pb-0"> SSO organizations</p>
        <div className="flex justify-between p-4">
          {isOrg && currentOrganization ? (
            <div className="flex flex-col gap-4 w-full">
              <div className="flex justify-between">
                <div className="flex gap-2 items-center">
                  <Avatar entity={currentOrganization as Organization} variant="small" />
                  {currentOrganization?.node?.displayName}
                </div>
                {data?.organization?.setting?.identityProviderLoginEnforced ||
                  (currentOrganization?.node?.id && !tokenSsoAuthorizations?.[currentOrganization?.node?.id] && (
                    <Button type="button" disabled={isAuthorizingSSO} variant="outline" onClick={handleSSOAuthorize} className="!p-1 bg-card">
                      {isAuthorizingSSO ? 'Authorizing...' : 'Authorize token for sso'}
                    </Button>
                  ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 w-full">
              {allOrgs.length > 0 &&
                allOrgs
                  .filter((organization) => tokenAuthorizedOrganizations?.some((authorizedOrg) => authorizedOrg.id === organization?.node?.id))
                  .map((org) => {
                    return (
                      <div className="flex justify-between" key={org?.node?.id}>
                        <div className="flex gap-2 items-center">
                          <Avatar entity={org as Organization} variant="small" />
                          {org?.node?.displayName}
                        </div>
                        {org?.node?.setting?.identityProviderLoginEnforced ||
                          (org?.node?.id && !tokenSsoAuthorizations?.[org?.node?.id] && (
                            <Button type="button" disabled={isAuthorizingSSO} variant="outline" onClick={handleSSOAuthorize} className="!p-1 bg-card">
                              {isAuthorizingSSO ? 'Authorizing...' : 'Authorize token for sso'}
                            </Button>
                          ))}
                      </div>
                    )
                  })}
            </div>
          )}
        </div>
        <div className="border-t p-4 pt-3">
          <Button type="button" onClick={() => setIsSsoDropdownOpened(false)}>
            Close
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default SsoAuthorizationDropdown
