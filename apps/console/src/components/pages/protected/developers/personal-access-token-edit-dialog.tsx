import React, { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Checkbox } from '@repo/ui/checkbox'
import { PencilIcon } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@repo/ui/form'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from '@repo/ui/dropdown-menu'
import { Avatar } from '@/components/shared/avatar/avatar'
import { useOrganization } from '@/hooks/useOrganization'
import { Organization, OrganizationSetting } from '@repo/codegen/src/schema'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useUpdateApiToken, useUpdatePersonalAccessToken } from '@/lib/graphql-hooks/tokens'
import { buildOrganizationsInput } from './utils'
import { useGetOrganizationSetting } from '@/lib/graphql-hooks/organization'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'

type PersonalAccessTokenEditProps = {
  tokenId: string
  tokenName: string
  tokenDescription?: string
  tokenExpiration: string
  tokenAuthorizedOrganizations?: { id: string; name: string }[]
}

const PersonalAccessTokenEdit: React.FC<PersonalAccessTokenEditProps> = ({ tokenId, tokenName, tokenDescription, tokenExpiration, tokenAuthorizedOrganizations }) => {
  const path = usePathname()
  const isApiKeyPage = path.includes('/api-tokens')
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: updatePersonalAccessToken } = useUpdatePersonalAccessToken()
  const { mutateAsync: updateApiToken } = useUpdateApiToken()
  const { allOrgs: orgs, currentOrgId } = useOrganization()
  const filteredOrgs = orgs.filter((org) => org?.node?.personalOrg === false) || []
  const { data: orgSettingData } = useGetOrganizationSetting(currentOrgId || '')

  const currentSetting = orgSettingData?.organization?.setting as OrganizationSetting | undefined
  const [isAuthorizingSSO, setIsAuthorizingSSO] = useState<boolean>(false)

  const formSchema = z
    .object({
      description: z.string().optional(),
      name: z.string().optional(),
      expiryDate: z.date().optional(),
      noExpire: z.boolean().optional(),
      organizationIDs: z.array(z.string()).optional(),
    })
    .refine((data) => data.expiryDate || data.noExpire, { message: 'Please specify an expiry date or select Never expires', path: ['expiryDate'] })
    .refine((data) => isApiKeyPage || (data.organizationIDs && data.organizationIDs.length > 0), { message: 'At least one organization must be selected', path: ['organizationIDs'] })

  type FormData = z.infer<typeof formSchema>

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: tokenDescription || '',
      name: tokenName || '',
      expiryDate: tokenExpiration ? new Date(tokenExpiration) : undefined,
      noExpire: false,
      organizationIDs: tokenAuthorizedOrganizations?.map((org) => org.id) || [],
    },
  })

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'noExpire' && value.noExpire) {
        form.setValue('expiryDate', undefined)
      }
    })
    return () => subscription.unsubscribe()
  }, [form])

  const initialOrganizations = useMemo(() => tokenAuthorizedOrganizations?.map((org) => org.id) || [], [tokenAuthorizedOrganizations])

  const formatDateToLocal = (date?: Date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) return ''
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const handleSSOAuthorize = async () => {
    try {
      setIsAuthorizingSSO(true)

      localStorage.setItem(
        'api_token',
        JSON.stringify({
          tokenType: isApiKeyPage ? 'api' : 'personal',
          isApiKeyPage,
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
          token_type: isApiKeyPage ? 'api' : 'personal',
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

  const handleSubmit = async (data: FormData) => {
    const organizationInput = buildOrganizationsInput(initialOrganizations, data.organizationIDs || [], 'OrganizationIDs')

    try {
      setIsSubmitting(true)
      if (isApiKeyPage) {
        await updateApiToken({
          updateApiTokenId: tokenId,
          input: {
            ...(data.description ? { description: data.description } : { clearDescription: true }),
            ...(data.expiryDate && !data.noExpire ? { expiresAt: data.expiryDate } : { clearExpiresAt: true }),
          },
        })
      } else {
        await updatePersonalAccessToken({
          updatePersonalAccessTokenId: tokenId,
          input: {
            ...(data.description ? { description: data.description } : { clearDescription: true }),
            ...(data.expiryDate && !data.noExpire ? { expiresAt: data.expiryDate } : { clearExpiresAt: true }),
            ...organizationInput,
          },
        })
      }

      successNotification({
        title: 'Token updated successfully!',
        description: 'Copy your token now, as you will not be able to see it again.',
      })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    } finally {
      setIsSubmitting(false)
    }
    setOpen(false)
  }

  const handleCloseDialog = () => {
    if (isSubmitting) return
    form.reset()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-transparent! !hover:bg-transparent text-inherit! flex items-center justify-center p-2">
          <PencilIcon className="w-4 h-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg max-h-[600px]">
        <DialogHeader>
          <DialogTitle className="text-[hsl(var(--foreground))]">Edit Personal Access Token</DialogTitle>
        </DialogHeader>
        <FormProvider {...form}>
          <form id="edit-token-form" className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="space-y-2 py-4">
              <div>
                <FormField
                  name="name"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Token name</FormLabel>
                      <FormControl>
                        <Input {...field} disabled placeholder="Token name" className="mt-1" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div>
                <FormField
                  name="description"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Token description</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="My API Token" className="mt-1" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div>
                <FormField
                  name="expiryDate"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      {!form.watch('noExpire') && (
                        <>
                          <FormLabel>Token expiration</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              value={formatDateToLocal(field.value)}
                              onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                              disabled={form.watch('noExpire')}
                              className="mt-1"
                            />
                          </FormControl>
                          <FormMessage reserveSpace={false} />
                        </>
                      )}
                    </FormItem>
                  )}
                />
              </div>
              <div>
                <FormField
                  name="noExpire"
                  control={form.control}
                  render={({ field }) => (
                    <div className="flex items-center space-x-2">
                      <Checkbox checked={field.value || false} onCheckedChange={field.onChange} />
                      <span className="text-sm text-[hsl(var(--muted-foreground))]">Never expires</span>
                    </div>
                  )}
                />
              </div>
              {!isApiKeyPage && (
                <FormField
                  name="organizationIDs"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Authorized organization(s)</FormLabel>
                      <FormControl>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outlineInput" full>
                              {field.value && field.value.length > 0
                                ? Object.entries(orgs)
                                    .filter(([, value]) => value?.node && field.value?.includes(value.node.id))
                                    .map(([, value]) => value!.node!.name)
                                    .join(', ')
                                : 'Select organization(s)'}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {Object.entries(filteredOrgs).map(([, value]) => {
                              const orgNode = value?.node
                              if (!orgNode) return null
                              return (
                                <DropdownMenuCheckboxItem
                                  key={orgNode.id}
                                  checked={field.value?.includes(orgNode.id) ?? false}
                                  onCheckedChange={(checked) => {
                                    const currentValue = field.value ?? []
                                    const newValue = checked ? [...currentValue, orgNode.id] : currentValue.filter((id) => id !== orgNode.id)
                                    field.onChange(newValue)
                                  }}
                                >
                                  <Avatar entity={orgNode as Organization} variant="small" />
                                  {orgNode.name}
                                </DropdownMenuCheckboxItem>
                              )
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </form>
        </FormProvider>
        <DialogFooter>
          {!isApiKeyPage && currentSetting?.identityProviderLoginEnforced && (
            <Button disabled={isAuthorizingSSO} variant="secondary" onClick={handleSSOAuthorize}>
              {isAuthorizingSSO ? 'Authorizing...' : 'Authorize token for sso'}
            </Button>
          )}
          <CancelButton onClick={handleCloseDialog}></CancelButton>
          <SaveButton disabled={isSubmitting} form="edit-token-form" isSaving={isSubmitting} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default PersonalAccessTokenEdit
