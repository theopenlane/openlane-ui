'use client'

import React, { useState } from 'react'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Button } from '@repo/ui/button'
import { Checkbox } from '@repo/ui/checkbox'
import { AlertTriangleIcon, CirclePlusIcon, CopyIcon } from 'lucide-react'
import { useNotification } from '@/hooks/useNotification'
import { useOrganization } from '@/hooks/useOrganization'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@repo/ui/form'
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { useForm } from 'react-hook-form'
import { z, infer as zInfer } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { usePathname } from 'next/navigation'
import { useCreateAPIToken, useCreatePersonalAccessToken } from '@/lib/graphql-hooks/tokens'
import { CreateApiTokenInput, Organization, OrganizationSetting } from '@repo/codegen/src/schema'
import { Avatar } from '@/components/shared/avatar/avatar'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useGetOrganizationSetting } from '@/lib/graphql-hooks/organization'

type PersonalApiKeyDialogProps = {
  triggerText?: boolean
}

enum STEP {
  CREATE = 'CREATE',
  CREATED = 'CREATED',
}

const PersonalApiKeyDialog = ({ triggerText }: PersonalApiKeyDialogProps) => {
  const path = usePathname()
  const isOrg = path.includes('/organization-settings')
  const { allOrgs: orgs } = useOrganization()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { mutateAsync: createPersonalAccessToken } = useCreatePersonalAccessToken()
  const { mutateAsync: createApiToken } = useCreateAPIToken()
  const { successNotification, errorNotification } = useNotification()

  const { currentOrgId } = useOrganization()

  const { data: orgSettingData } = useGetOrganizationSetting(currentOrgId || '')

  const currentSetting = orgSettingData?.organization?.setting as OrganizationSetting | undefined

  const [step, setStep] = useState<STEP>(STEP.CREATE)

  const [confirmationChecked, setConfirmationChecked] = useState<boolean>(false)
  const [token, setToken] = useState<string>('')
  const [tokenId, setTokenId] = useState<string>('')
  const [isAuthorizingSSO, setIsAuthorizingSSO] = useState<boolean>(false)

  const formSchema = z
    .object({
      name: z.string().min(3, { message: 'Token name is required' }),
      description: z.string().optional(),
      organizationIDs: z.array(z.string()).optional(),
      expiryDate: z.date().optional(),
      noExpire: z.boolean().optional(),
      scopes: z.array(z.string()).optional(),
    })
    .refine(
      (data) => {
        if (!isOrg && (!data.organizationIDs || data.organizationIDs.length === 0)) {
          return false
        }
        return true
      },
      { message: 'At least one organization must be selected', path: ['organizationIDs'] },
    )
    .refine((data) => data.expiryDate || data.noExpire, {
      message: 'Please specify an expiry date or select the Never expires checkbox',
      path: ['expiryDate'],
    })

  type FormData = zInfer<typeof formSchema>

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      expiryDate: undefined,
      organizationIDs: [],
      noExpire: false,
    },
  })

  const handleCopyToken = () => {
    navigator.clipboard.writeText(token)
    successNotification({
      title: 'Token copied!',
    })
  }

  const handleSubmit = async (values: FormData) => {
    try {
      setIsSubmitting(true)

      let createdToken: string | undefined = undefined
      let createdTokenId: string | undefined = undefined

      if (isOrg) {
        const apiTokenInput: CreateApiTokenInput = {
          name: values.name,
          description: values.description,
          expiresAt: values.noExpire ? null : values.expiryDate,
          scopes: values.scopes,
        }

        const response = await createApiToken({
          input: apiTokenInput,
        })

        createdToken = response?.createAPIToken?.apiToken.token
        createdTokenId = response?.createAPIToken?.apiToken.id
      } else {
        const response = await createPersonalAccessToken({
          input: {
            name: values.name,
            description: values.description,
            expiresAt: values.noExpire ? null : values.expiryDate,
            organizationIDs: values.organizationIDs || [],
          },
        })

        createdToken = response?.createPersonalAccessToken?.personalAccessToken?.token
        createdTokenId = response?.createPersonalAccessToken?.personalAccessToken?.id
      }

      if (createdToken && createdTokenId) {
        setToken(createdToken)
        setTokenId(createdTokenId)
        successNotification({
          title: 'Token created successfully!',
          description: 'Copy your token now, as you will not be able to see it again.',
        })
        setStep(STEP.CREATED)
      } else {
        throw new Error('Failed to create token')
      }
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSSOAuthorize = async () => {
    try {
      setIsAuthorizingSSO(true)

      localStorage.setItem('sso_organization_id', currentOrgId || '')
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

  const resetDataToDefault = () => {
    setStep(STEP.CREATE)
    setConfirmationChecked(false)
    setToken('')
    setTokenId('')
    setIsAuthorizingSSO(false)
    form.reset()
  }

  return (
    <Dialog
      onOpenChange={(open) => {
        if (open === false) {
          setTimeout(() => {
            resetDataToDefault()
          }, 300)
        }
      }}
    >
      <DialogTrigger asChild>
        {triggerText ? (
          <div className="flex cursor-pointer">
            <p className="text-brand ">Create token</p>
            <p>?</p>
          </div>
        ) : (
          <Button iconPosition="left" icon={<CirclePlusIcon />}>
            Create New
          </Button>
        )}
      </DialogTrigger>
      {step === STEP.CREATE ? (
        <DialogContent className="sm:max-w-[455px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">Create new token</DialogTitle>
            <DialogDescription />
          </DialogHeader>

          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
              <FormField
                name="name"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Token name*</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter token name" {...field} />
                    </FormControl>
                    <FormMessage reserveSpace={false} />
                  </FormItem>
                )}
              />

              <FormField
                name="description"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter a description (optional)" {...field} />
                    </FormControl>
                    <FormMessage reserveSpace={false} />
                  </FormItem>
                )}
              />

              {!isOrg && (
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
                                    .filter(([, value]) => field?.value?.includes(value?.node?.id ?? ''))
                                    .map(([, value]) => value?.node?.name)
                                    .join(', ')
                                : 'Select organization(s)'}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {Object.entries(orgs).map(([, value]) => {
                              return (
                                <DropdownMenuCheckboxItem
                                  key={value?.node?.id}
                                  checked={field?.value?.includes(value?.node?.id ?? '')}
                                  onCheckedChange={(checked) => {
                                    const newValue = checked ? [...(field?.value ?? []), value?.node?.id] : field?.value?.filter((id) => id !== value?.node?.id)
                                    field.onChange(newValue)
                                  }}
                                >
                                  {value?.node && <Avatar entity={value.node as Organization} />}
                                  {value?.node?.name}
                                </DropdownMenuCheckboxItem>
                              )
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </FormControl>
                      <FormMessage reserveSpace={false} />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                name="expiryDate"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiration*</FormLabel>
                    {!form.watch('noExpire') && (
                      <>
                        <FormControl>
                          <Input
                            type="date"
                            disabled={form.watch('noExpire')}
                            value={field.value ? field.value.toISOString().split('T')[0] : ''}
                            onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage reserveSpace={false} />
                      </>
                    )}
                  </FormItem>
                )}
              />

              <FormField
                name="noExpire"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center mt-2">
                      <Checkbox id="no-expire" checked={field.value} onCheckedChange={(checked) => field.onChange(checked)} />
                      <Label htmlFor="no-expire" className="ml-2 font-medium">
                        Never expires
                      </Label>
                    </div>
                  </FormItem>
                )}
              />

              {isOrg && (
                <FormField
                  name="scopes"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scopes</FormLabel>
                      <FormControl>
                        <div className="flex flex-col justify-center gap-2">
                          <div className={'flex'}>
                            <Checkbox
                              id={field.name}
                              key={'read'}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  field.onChange([...(field.value || []), 'read'])
                                } else {
                                  field.onChange((field.value || []).filter((scope) => scope !== 'read'))
                                }
                              }}
                            />
                            <FormLabel htmlFor="scopes:read" className="ml-2 cursor-pointer">
                              Read
                            </FormLabel>
                          </div>
                          <div className={'flex'}>
                            <Checkbox
                              id={field.name}
                              key={'write'}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  field.onChange([...(field.value || []), 'write'])
                                } else {
                                  field.onChange((field.value || []).filter((scope) => scope !== 'write'))
                                }
                              }}
                            />
                            <FormLabel htmlFor="scopes:write" className="ml-2 cursor-pointer">
                              Write
                            </FormLabel>
                          </div>
                          <div className={'flex'}>
                            <Checkbox
                              id={field.name}
                              key={'group_manager'}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  field.onChange([...(field.value || []), 'group_manager'])
                                } else {
                                  field.onChange((field.value || []).filter((scope) => scope !== 'group_manager'))
                                }
                              }}
                            />
                            <FormLabel htmlFor="scopes:group_manager" className="ml-2 cursor-pointer">
                              Group Manager
                            </FormLabel>
                          </div>
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}

              <DialogFooter>
                <Button className="w-full mt-4" type="submit" variant="filled" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Token'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      ) : (
        <DialogContent isClosable={confirmationChecked && !isAuthorizingSSO} className="sm:max-w-[455px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">Token created</DialogTitle>
            <div className="flex gap-3 p-4 border rounded-md">
              <AlertTriangleIcon />
              <div>
                <p className="text-base">Heads up!</p>
                <p className="text-sm mt-0">Copy your access token now, as you will not be able to see this again</p>
              </div>
            </div>
          </DialogHeader>
          <div onClick={handleCopyToken} className=" flex items-center justify-between w-full cursor-pointer">
            <Input className=" truncate text-sm bg-background py-0 h-9 " icon={<CopyIcon className="h-4 w-4" />} readOnly value={token} maxWidth />
          </div>
          <div className="flex items-center mt-4">
            <Checkbox id="confirmation" onCheckedChange={(checked: boolean) => setConfirmationChecked(checked)} />
            <Label htmlFor="confirmation" className="  ml-4 w-full text-sm">
              I have copied the access token and put it in a safe place
            </Label>
          </div>
          <DialogClose asChild disabled={!confirmationChecked || isAuthorizingSSO}>
            <div className="flex gap-3">
              {currentSetting?.identityProviderLoginEnforced && (
                <Button disabled={!confirmationChecked || isAuthorizingSSO} variant="outline" onClick={handleSSOAuthorize}>
                  {isAuthorizingSSO ? 'Authorizing...' : 'Authorize token for sso'}
                </Button>
              )}
              <Button disabled={!confirmationChecked || isAuthorizingSSO} variant="filled">
                Close
              </Button>
            </div>
          </DialogClose>
        </DialogContent>
      )}
    </Dialog>
  )
}

export default PersonalApiKeyDialog
