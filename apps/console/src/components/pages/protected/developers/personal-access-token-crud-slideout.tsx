'use client'

import React, { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from '@repo/ui/sheet'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Button } from '@repo/ui/button'
import { Checkbox } from '@repo/ui/checkbox'
import { Switch } from '@repo/ui/switch'
import { AlertTriangleIcon, CopyIcon, SquarePlus } from 'lucide-react'
import { useNotification } from '@/hooks/useNotification'
import { useOrganization } from '@/hooks/useOrganization'
import { Form, FormField, FormItem, FormLabel, FormControl } from '@repo/ui/form'
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { useWatch } from 'react-hook-form'
import { usePathname } from 'next/navigation'
import { useCreateAPIToken, useCreatePersonalAccessToken, useUpdateApiToken, useUpdatePersonalAccessToken } from '@/lib/graphql-hooks/tokens'
import { ScopesSelector } from '@/components/shared/scopes-selector/scopes-selector'
import { type Organization, type OrganizationSetting } from '@repo/codegen/src/schema'
import { Avatar } from '@/components/shared/avatar/avatar'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useGetOrganizationSetting } from '@/lib/graphql-hooks/organization'
import { buildOrganizationsInput } from './utils'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import useFormSchema, { type TokenFormData } from './hooks/use-form-schema'
import { useSSOAuthorize } from './hooks/sso'

export type EditTokenData = {
  id: string
  name: string
  description?: string
  expiresAt?: string | null
  authorizedOrganizations?: { id: string; name: string }[]
  scopes?: string[]
}

type PersonalApiKeyDialogProps = {
  triggerText?: boolean
  editToken?: EditTokenData
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

enum STEP {
  CREATE = 'CREATE',
  CREATED = 'CREATED',
}

const PersonalApiKeyDialog = ({ triggerText, editToken, open: controlledOpen, onOpenChange: controlledOnOpenChange }: PersonalApiKeyDialogProps) => {
  const path = usePathname()
  const isApiKeyPage = path.includes('/api-tokens')
  const isEditMode = !!editToken
  const isControlled = controlledOpen !== undefined

  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const handleOpenChange = (value: boolean) => {
    if (isControlled) {
      controlledOnOpenChange?.(value)
    } else {
      setInternalOpen(value)
    }
  }

  const { currentOrgId, allOrgs: orgs } = useOrganization()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { mutateAsync: createPersonalAccessToken } = useCreatePersonalAccessToken()
  const { mutateAsync: createApiToken } = useCreateAPIToken()
  const { mutateAsync: updatePersonalAccessToken } = useUpdatePersonalAccessToken()
  const { mutateAsync: updateApiToken } = useUpdateApiToken()
  const { successNotification, errorNotification } = useNotification()

  const { data: orgSettingData } = useGetOrganizationSetting(currentOrgId || '')
  const currentSetting = orgSettingData?.organization?.setting as OrganizationSetting | undefined
  const filteredOrgs = orgs.filter((org) => org?.node?.personalOrg === false) || []

  const [step, setStep] = useState<STEP>(STEP.CREATE)
  const [confirmationChecked, setConfirmationChecked] = useState<boolean>(false)
  const [createdToken, setCreatedToken] = useState<string>('')
  const [createdTokenId, setCreatedTokenId] = useState<string>('')
  const { handleSSOAuthorize, isAuthorizingSSO } = useSSOAuthorize({ isApiKeyPage, isEditMode, editTokenId: editToken?.id, createdTokenId })

  const { form, initialOrgIds } = useFormSchema({ isApiKeyPage, isEditMode, editToken })

  const noExpire = useWatch({ control: form.control, name: 'noExpire' })

  const handleCopyToken = () => {
    navigator.clipboard.writeText(createdToken)
    successNotification({ title: 'Token copied!' })
  }

  const descriptionInput = (description?: string) => (description ? { description } : { clearDescription: true })

  const expiryInput = (expiryDate?: Date, noExpire?: boolean) => (expiryDate && !noExpire ? { expiresAt: expiryDate } : { clearExpiresAt: true })

  const handleEdit = async (values: TokenFormData) => {
    if (!editToken) return
    if (isApiKeyPage) {
      await updateApiToken({
        updateApiTokenId: editToken.id,
        input: {
          ...descriptionInput(values.description),
          ...expiryInput(values.expiryDate, values.noExpire),
          scopes: values.scopes ?? [],
        },
      })
    } else {
      await updatePersonalAccessToken({
        updatePersonalAccessTokenId: editToken.id,
        input: {
          ...descriptionInput(values.description),
          ...expiryInput(values.expiryDate, values.noExpire),
          ...buildOrganizationsInput(initialOrgIds, values.organizationIDs || [], 'OrganizationIDs'),
        },
      })
    }
    successNotification({ title: 'Token updated successfully!' })
    handleOpenChange(false)
  }

  const handleCreate = async (values: TokenFormData) => {
    const expiresAt = values.noExpire ? null : values.expiryDate

    let token: string | undefined
    let tokenId: string | undefined

    if (isApiKeyPage) {
      const response = await createApiToken({
        input: { name: values.name, description: values.description, expiresAt, scopes: values.scopes },
      })
      token = response?.createAPIToken?.apiToken.token
      tokenId = response?.createAPIToken?.apiToken.id
    } else {
      const response = await createPersonalAccessToken({
        input: { name: values.name, description: values.description, expiresAt, organizationIDs: values.organizationIDs || [] },
      })
      token = response?.createPersonalAccessToken?.personalAccessToken?.token
      tokenId = response?.createPersonalAccessToken?.personalAccessToken?.id
    }

    if (!token || !tokenId) throw new Error('Failed to create token')

    setCreatedToken(token)
    setCreatedTokenId(tokenId)
    successNotification({ title: 'Token created successfully!', description: 'Copy your token now, as you will not be able to see it again.' })
    setStep(STEP.CREATED)
  }

  const handleSubmit = async (values: TokenFormData) => {
    try {
      setIsSubmitting(true)
      await (isEditMode ? handleEdit(values) : handleCreate(values))
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetDataToDefault = () => {
    setStep(STEP.CREATE)
    setConfirmationChecked(false)
    setCreatedToken('')
    setCreatedTokenId('')
    form.reset()
  }

  const showSSOButton = isApiKeyPage
    ? currentSetting?.identityProviderLoginEnforced
    : orgs.some(
        (org) =>
          (isEditMode ? editToken?.authorizedOrganizations?.some((authOrg) => authOrg.id === org?.node?.id) : form.getValues('organizationIDs')?.includes(org?.node?.id ?? '')) &&
          org?.node?.setting?.identityProviderLoginEnforced,
      )

  const renderForm = () => (
    <Form {...form}>
      <form id="token-form" className="flex flex-col gap-4" onSubmit={form.handleSubmit(handleSubmit)}>
        <div className="space-y-2 shrink-0">
          <FormField
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>Token name{!isEditMode && <span className="text-destructive">*</span>}</FormLabel>
                <FormControl>
                  <Input placeholder="Enter token name" {...field} disabled={isEditMode} />
                </FormControl>
                {fieldState.error && <p className="mt-1 text-sm text-destructive">{fieldState.error.message}</p>}
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
              </FormItem>
            )}
          />

          <FormField
            name="expiryDate"
            control={form.control}
            render={({ field, fieldState }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Expiration{!isEditMode && <span className="text-destructive">*</span>}</FormLabel>
                  <FormField
                    name="noExpire"
                    control={form.control}
                    render={({ field: noExpireField }) => (
                      <div className="flex items-center gap-2">
                        <Label htmlFor="no-expire" className="text-sm text-muted-foreground">
                          Never expires
                        </Label>
                        <Switch
                          id="no-expire"
                          checked={noExpireField.value ?? false}
                          onCheckedChange={(checked) => {
                            noExpireField.onChange(checked)
                            if (checked) form.clearErrors('expiryDate')
                          }}
                        />
                      </div>
                    )}
                  />
                </div>
                {!noExpire && (
                  <FormControl>
                    <Input type="date" value={field.value ? field.value.toISOString().split('T')[0] : ''} onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)} />
                  </FormControl>
                )}
                {fieldState.error && <p className="mt-1 text-sm text-destructive">{fieldState.error.message}</p>}
              </FormItem>
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
                              .filter(([, value]) => field?.value?.includes(value?.node?.id ?? ''))
                              .map(([, value]) => value?.node?.name)
                              .join(', ')
                          : 'Select organization(s)'}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {Object.entries(filteredOrgs).map(([, value]) => (
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
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </FormControl>
              </FormItem>
            )}
          />
        )}
        {isApiKeyPage && (
          <FormField
            name="scopes"
            control={form.control}
            render={({ field }) => (
              <FormItem className="!space-y-0">
                <FormControl>
                  <ScopesSelector value={field.value ?? []} onChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        )}
      </form>
    </Form>
  )

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        // Block dismissal (×, overlay click, Escape) until the copy confirmation is checked
        if (!nextOpen && step === STEP.CREATED && !confirmationChecked) return
        handleOpenChange(nextOpen)
        if (!nextOpen) setTimeout(resetDataToDefault, 300)
      }}
    >
      {!isControlled && (
        <SheetTrigger asChild>
          {triggerText ? (
            <div className="flex cursor-pointer">
              <p className="text-brand">Create token</p>
              <p>?</p>
            </div>
          ) : (
            <Button variant="primary" className="h-8 !px-2 !pl-3" icon={<SquarePlus />} iconPosition="left">
              Create
            </Button>
          )}
        </SheetTrigger>
      )}

      {!isEditMode && step === STEP.CREATED ? (
        <SheetContent initialWidth={700}>
          <SheetHeader>
            <SheetTitle className="text-2xl font-semibold">Token created</SheetTitle>
            <div className="flex gap-3 p-4 border rounded-md mt-2">
              <AlertTriangleIcon className="shrink-0" />
              <div>
                <p className="text-base">Heads up!</p>
                <p className="text-sm mt-0">Copy your access token now, as you will not be able to see this again</p>
              </div>
            </div>
          </SheetHeader>

          <div className="space-y-4 py-4">
            <div onClick={handleCopyToken} className="flex items-center justify-between w-full cursor-pointer">
              <Input className="truncate text-sm bg-background py-0 h-9" icon={<CopyIcon className="h-4 w-4" />} readOnly value={createdToken} maxWidth />
            </div>
            <div className="flex items-center mt-4">
              <Checkbox id="confirmation" onCheckedChange={(checked: boolean) => setConfirmationChecked(checked)} />
              <Label htmlFor="confirmation" className="ml-4 w-full text-sm">
                I have copied the access token and put it in a safe place
              </Label>
            </div>
          </div>

          <SheetFooter>
            <div className="flex gap-3 w-full">
              {showSSOButton && (
                <Button disabled={!confirmationChecked || isAuthorizingSSO} variant="secondary" onClick={() => handleSSOAuthorize()}>
                  {isAuthorizingSSO ? 'Authorizing...' : 'Authorize token for SSO'}
                </Button>
              )}
              <SheetClose asChild>
                <Button variant="primary" disabled={!confirmationChecked || isAuthorizingSSO} className="flex-1">
                  Close
                </Button>
              </SheetClose>
            </div>
          </SheetFooter>
        </SheetContent>
      ) : (
        <SheetContent initialWidth={700}>
          <SheetHeader>
            <SheetTitle className="text-xl font-semibold pb-4">{isEditMode ? 'Edit token' : 'Create new token'}</SheetTitle>
          </SheetHeader>

          {renderForm()}

          <div className="absolute bottom-0 left-0 right-0 p-4 bg-secondary border-t">
            {isEditMode ? (
              <div className="flex gap-2 w-full">
                {showSSOButton && (
                  <Button disabled={isAuthorizingSSO} variant="secondary" onClick={() => handleSSOAuthorize()}>
                    {isAuthorizingSSO ? 'Authorizing...' : 'Authorize for SSO'}
                  </Button>
                )}
                <CancelButton onClick={() => handleOpenChange(false)} />
                <SaveButton form="token-form" isSaving={isSubmitting} disabled={isSubmitting} />
              </div>
            ) : (
              <Button form="token-form" variant="primary" className="w-full" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Token'}
              </Button>
            )}
          </div>
        </SheetContent>
      )}
    </Sheet>
  )
}

export default PersonalApiKeyDialog
