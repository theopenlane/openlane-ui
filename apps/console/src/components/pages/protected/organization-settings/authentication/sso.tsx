'use client'

import Image from 'next/image'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Input } from '@repo/ui/input'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormItem, FormField, FormControl, FormMessage } from '@repo/ui/form'
import { z } from 'zod'
import { Button } from '@repo/ui/button'
import { useEffect, useState, useMemo } from 'react'
import { RESET_SUCCESS_STATE_MS } from '@/constants'
import { useOrganization } from '@/hooks/useOrganization'
import { useUpdateOrganizationSetting, useGetOrganizationSetting } from '@/lib/graphql-hooks/organization'
import { useQueryClient } from '@tanstack/react-query'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Label } from '@repo/ui/label'
import { OrganizationSettingSsoProvider, type OrganizationSetting, type UpdateOrganizationSettingInput } from '@repo/codegen/src/schema'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { Badge } from '@repo/ui/badge'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { Alert, AlertDescription } from '@repo/ui/alert'
import { Check, Copy, Info, MoreHorizontal, Pencil, RefreshCw, X } from 'lucide-react'
import { siteUrl } from '@repo/dally/auth'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import Link from 'next/link'
import { SSOInfoSlideOut } from '@/components/shared/sso-info-slide-out/sso-info-slide-out'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { SSO_PROVIDER_LOGOS, SSO_PROVIDER_NAMES } from '@/components/shared/enum-mapper/sso-provider-enum'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { isValidDomain } from '@/utils/strings'
import { DomainListEditor } from '@/components/shared/domain-list-editor/domain-list-editor'

type viewMode = 'overview' | 'edit'

const providerLabel = (provider: string): string => SSO_PROVIDER_NAMES[provider as OrganizationSettingSsoProvider] ?? getEnumLabel(provider)

const StatusAlert = ({ tone, message, onClose }: { tone: 'warning' | 'success' | 'error'; message: string; onClose: () => void }) => {
  const styles = {
    warning: { container: 'border-yellow-200 bg-yellow-50', text: 'text-yellow-800', button: 'text-yellow-600 hover:text-yellow-800' },
    success: { container: 'border-green-200 bg-green-50', text: 'text-green-800', button: 'text-green-600 hover:text-green-800' },
    error: { container: 'border-red-200 bg-red-50', text: 'text-red-800', button: 'text-red-600 hover:text-red-800' },
  }[tone]

  return (
    <Alert className={`mb-4 ${styles.container}`}>
      <AlertDescription className={styles.text}>
        <div className="flex items-center justify-between">
          <span className="font-medium">{message}</span>
          <Button variant="secondary" size="sm" onClick={onClose} className={`${styles.button} h-6 w-6 p-0`}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}

const SSOOverview = ({
  setting,
  slugName,
  onEdit,
  onRemove,
  showRemoveDialog,
  setShowRemoveDialog,
  onTestSSO,
  isTestingSSO,
  onToggleEnforcement,
  isTogglingEnforcement,
}: {
  setting: OrganizationSetting | undefined
  slugName?: string | null
  onEdit: () => void
  onRemove: () => void
  showRemoveDialog: boolean
  setShowRemoveDialog: (show: boolean) => void
  onTestSSO: () => void
  isTestingSSO: boolean
  onToggleEnforcement: (enforced: boolean) => void
  isTogglingEnforcement: boolean
}) => {
  const isSSOConfigured = setting?.identityProvider && setting.identityProvider !== 'NONE'
  const providerLogo = SSO_PROVIDER_LOGOS[setting?.identityProvider as OrganizationSettingSsoProvider]
  const [copied, setCopied] = useState(false)
  const shareableUrl = slugName ? `${siteUrl}/orgs/${slugName}/sso` : ''

  const handleCopyShareableUrl = () => {
    if (!shareableUrl) return
    navigator.clipboard.writeText(shareableUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), RESET_SUCCESS_STATE_MS)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">SSO Configuration</h3>
          <p className="text-sm text-muted-foreground">{isSSOConfigured ? 'Single Sign-On is configured for your organization' : 'No SSO provider configured yet'}</p>
        </div>
        <div className="flex gap-2">
          {isSSOConfigured && !setting?.identityProviderAuthTested && (
            <Button variant="filled" size="sm" onClick={onTestSSO} loading={isTestingSSO} disabled={isTestingSSO} className="bg-orange-600 hover:bg-orange-700 text-white">
              {isTestingSSO ? 'Testing...' : 'Verify SSO connection'}
            </Button>
          )}
          {isSSOConfigured && setting?.identityProviderAuthTested && (
            <Button
              variant={setting.identityProviderLoginEnforced ? 'destructive' : 'primary'}
              size="sm"
              onClick={() => onToggleEnforcement(!setting.identityProviderLoginEnforced)}
              loading={isTogglingEnforcement}
              disabled={isTogglingEnforcement}
            >
              {setting.identityProviderLoginEnforced ? 'Remove Enforcement' : 'Enforce SSO'}
            </Button>
          )}
          {isSSOConfigured && !setting?.identityProviderLoginEnforced && (
            <Button variant="destructive" size="sm" onClick={() => setShowRemoveDialog(true)}>
              Remove SSO
            </Button>
          )}
          {isSSOConfigured ? (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={onEdit}>
                  <Pencil className="h-4 w-4 mr-2" /> Edit Configuration
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={onTestSSO} disabled={isTestingSSO}>
                  <RefreshCw className="h-4 w-4 mr-2" /> {isTestingSSO ? 'Testing...' : 'Re-test Connection'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="secondary" onClick={onEdit}>
              Configure SSO
            </Button>
          )}
        </div>
      </div>

      {isSSOConfigured && (
        <Card>
          <CardContent className="pt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Provider</span>
                <div className="flex items-center gap-2">
                  {providerLogo && <Image src={providerLogo} width={20} height={20} alt="" className="object-contain" />}
                  <Badge variant="secondary">{providerLabel(setting.identityProvider ?? '')}</Badge>
                </div>
              </div>

              {setting.oidcDiscoveryEndpoint && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Discovery Endpoint</span>
                  <span className="text-sm font-mono">{setting.oidcDiscoveryEndpoint}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">SSO Enforcement</span>
                <Badge variant={setting.identityProviderLoginEnforced ? 'default' : 'destructive'}>{setting.identityProviderLoginEnforced ? 'Enforced for all members' : 'Not enforced'}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Authentication Status</span>
                <Badge variant={setting.identityProviderAuthTested ? 'green' : 'secondary'}>{setting.identityProviderAuthTested ? 'Tested' : 'Not tested'}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isSSOConfigured && shareableUrl && (
        <Card>
          <CardContent className="pt-4">
            <div className="space-y-2">
              <span className="text-sm font-medium text-muted-foreground">Shareable SSO URL</span>
              <p className="text-sm text-muted-foreground">Share this link so members can sign in to this organization through your identity provider.</p>
              <div className="flex items-center gap-2">
                <Input readOnly value={shareableUrl} className="font-mono text-sm" />
                <Button variant="secondary" size="sm" onClick={handleCopyShareableUrl} className="shrink-0">
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isSSOConfigured && (
        <div className="space-y-2">
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              Users with the <strong>Owner</strong> or <strong>Auditor</strong> role are automatically exempt from SSO enforcement.
            </span>
          </div>
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              Individual members can also be marked as SSO exempt from the{' '}
              <Link href="/user-management/members" className="underline hover:text-foreground">
                Members page
              </Link>
              .
            </span>
          </div>
        </div>
      )}

      <ConfirmationDialog
        open={showRemoveDialog}
        onOpenChange={setShowRemoveDialog}
        title="Remove SSO Configuration"
        description="Are you sure you want to remove the SSO configuration? This will disable single sign-on for your organization and users will need to use their regular login credentials."
        confirmationText="Remove SSO"
        confirmationTextVariant="destructive"
        onConfirm={onRemove}
      />
    </div>
  )
}

const SSOPage = () => {
  const [isSuccess, setIsSuccess] = useState(false)
  const [viewMode, setViewMode] = useState<viewMode>('overview')
  const [showRemoveDialog, setShowRemoveDialog] = useState(false)
  const [isTestingSSO, setIsTestingSSO] = useState(false)
  const [showSSOTestedAlert, setShowSSOTestedAlert] = useState(false)
  const [showSSOErrorAlert, setShowSSOErrorAlert] = useState(false)
  const [ssoErrorMessage, setSSOErrorMessage] = useState('')
  const [exemptDomains, setExemptDomains] = useState<string[]>([])
  const [newExemptDomain, setNewExemptDomain] = useState('')
  const [exemptDomainError, setExemptDomainError] = useState<string | null>(null)
  const [isTogglingEnforcement, setIsTogglingEnforcement] = useState(false)
  const [showEnforcePromptDialog, setShowEnforcePromptDialog] = useState(false)
  const [pendingEnforceCheck, setPendingEnforceCheck] = useState(false)
  const [isSavingDomains, setIsSavingDomains] = useState(false)
  const [showReTestWarning, setShowReTestWarning] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const { isPending, mutateAsync: updateOrgSetting } = useUpdateOrganizationSetting()
  const queryClient = useQueryClient()
  const { successNotification, errorNotification } = useNotification()
  const { currentOrgId } = useOrganization()

  const { data: orgSettingData } = useGetOrganizationSetting(currentOrgId || '')
  const currentSetting = orgSettingData?.organization?.setting as OrganizationSetting | undefined
  const orgSlugName = orgSettingData?.organization?.slugName
  const isSSOConfigured = !!(currentSetting?.identityProvider && currentSetting.identityProvider !== 'NONE')
  const allowedDomains = currentSetting?.allowedEmailDomains ?? []

  const identityProviderOptions = useMemo(() => Object.values(OrganizationSettingSsoProvider).filter((provider) => provider !== 'NONE'), [])

  const formSchema = useMemo(
    () =>
      z.object({
        identityProvider: z.enum(identityProviderOptions as [string, ...string[]], { required_error: 'Identity provider is required' }),
        identityProviderClientID: z.string().min(1, 'Client ID is required'),
        identityProviderClientSecret: z.string().min(1, 'Client Secret is required'),
        oidcDiscoveryEndpoint: z.string().min(1, 'OIDC Discovery Endpoint is required').url('Enter a valid URL'),
      }),
    [identityProviderOptions],
  )

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      identityProvider: undefined,
      identityProviderClientID: '',
      identityProviderClientSecret: '',
      oidcDiscoveryEndpoint: '',
    },
  })

  useEffect(() => {
    if (currentSetting) {
      const currentProvider = currentSetting.identityProvider
      form.reset({
        identityProvider: currentProvider && currentProvider !== 'NONE' && identityProviderOptions.includes(currentProvider) ? currentProvider : undefined,
        identityProviderClientID: currentSetting.identityProviderClientID || '',
        identityProviderClientSecret: currentSetting.identityProviderClientSecret || '',
        oidcDiscoveryEndpoint: currentSetting.oidcDiscoveryEndpoint || '',
      })
      setExemptDomains(currentSetting.ssoExemptDomains ?? [])
    }
  }, [currentSetting, identityProviderOptions, form])

  const invalidateOrgSetting = () => queryClient.invalidateQueries({ queryKey: ['organizationSetting', currentOrgId] })

  const updateSSOSettings = async (data: z.infer<typeof formSchema>) => {
    if (!currentOrgId || !currentSetting?.id) return

    const credentialsChanged =
      data.identityProvider !== (currentSetting.identityProvider ?? '') ||
      (data.identityProviderClientID || '') !== (currentSetting.identityProviderClientID || '') ||
      !!data.identityProviderClientSecret ||
      (data.oidcDiscoveryEndpoint || '') !== (currentSetting.oidcDiscoveryEndpoint || '')

    const input: Partial<UpdateOrganizationSettingInput> = {
      identityProvider: data.identityProvider as OrganizationSettingSsoProvider | undefined,
      identityProviderClientID: data.identityProviderClientID || undefined,
      identityProviderClientSecret: data.identityProviderClientSecret || undefined,
      oidcDiscoveryEndpoint: data.oidcDiscoveryEndpoint || undefined,
    }

    await updateOrgSetting({ updateOrganizationSettingId: currentSetting.id, input })
    setIsSuccess(true)
    if (credentialsChanged && currentSetting.identityProviderAuthTested) setShowReTestWarning(true)
    invalidateOrgSetting()
  }

  const saveDomains = async (domains: string[], previous: string[]) => {
    if (!currentSetting?.id) return
    setIsSavingDomains(true)
    try {
      await updateOrgSetting({ updateOrganizationSettingId: currentSetting.id, input: { ssoExemptDomains: domains } })
      invalidateOrgSetting()
    } catch (error) {
      setExemptDomains(previous)
      errorNotification({ title: 'Error saving exempt domains', description: parseErrorMessage(error) })
    } finally {
      setIsSavingDomains(false)
    }
  }

  const addExemptDomain = async () => {
    const trimmed = newExemptDomain.trim().toLowerCase()
    if (!trimmed) return
    if (!isValidDomain(trimmed)) {
      setExemptDomainError(`"${trimmed}" is not a valid domain`)
      return
    }
    if (exemptDomains.includes(trimmed)) {
      setExemptDomainError(`"${trimmed}" is already in the list`)
      return
    }
    if (allowedDomains.includes(trimmed)) {
      setExemptDomainError(`"${trimmed}" is in your allowed domains, so it can't also be SSO-exempt. Remove it from allowed domains first.`)
      return
    }
    const previous = exemptDomains
    const updated = [...exemptDomains, trimmed]
    setExemptDomains(updated)
    setNewExemptDomain('')
    await saveDomains(updated, previous)
  }

  const removeExemptDomain = async (domain: string) => {
    const previous = exemptDomains
    const updated = exemptDomains.filter((d) => d !== domain)
    setExemptDomains(updated)
    await saveDomains(updated, previous)
  }

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      await updateSSOSettings(data)
      successNotification({
        title: 'SSO settings updated successfully',
      })
      setViewMode('overview')
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error updating SSO settings',
        description: errorMessage,
      })
    }
  }

  const handleCancel = () => {
    form.reset()
    setExemptDomains(currentSetting?.ssoExemptDomains ?? [])
    setNewExemptDomain('')
    setExemptDomainError(null)
    setViewMode('overview')
  }

  const handleToggleEnforcement = async (enforced: boolean) => {
    if (!currentOrgId || !currentSetting?.id) return
    setIsTogglingEnforcement(true)
    try {
      await updateOrgSetting({
        updateOrganizationSettingId: currentSetting.id,
        input: { identityProviderLoginEnforced: enforced },
      })
      invalidateOrgSetting()
      successNotification({ title: enforced ? 'SSO enforcement enabled' : 'SSO enforcement disabled' })
    } catch (error) {
      errorNotification({ title: 'Error updating SSO enforcement', description: parseErrorMessage(error) })
    } finally {
      setIsTogglingEnforcement(false)
    }
  }

  const handleEdit = () => {
    setViewMode('edit')
  }

  const handleRemoveSSO = async () => {
    if (!currentOrgId || !currentSetting?.id) {
      return
    }

    try {
      const input: Partial<UpdateOrganizationSettingInput> = {
        identityProvider: 'NONE' as OrganizationSettingSsoProvider,
        identityProviderClientID: '',
        identityProviderClientSecret: '',
        oidcDiscoveryEndpoint: '',
        identityProviderLoginEnforced: false,
      }

      await updateOrgSetting({
        updateOrganizationSettingId: currentSetting.id,
        input,
      })

      setShowRemoveDialog(false)
      successNotification({
        title: 'SSO configuration removed successfully',
      })

      invalidateOrgSetting()
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error removing SSO configuration',
        description: errorMessage,
      })
    }
  }

  const handleTestSSO = async () => {
    if (!currentOrgId || !currentSetting?.id) {
      return
    }

    setIsTestingSSO(true)

    try {
      localStorage.setItem('testing_sso', 'true')

      const response = await fetch('/api/auth/sso', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organization_id: currentOrgId,
          is_test: true,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success && data.redirect_uri) {
        window.location.href = data.redirect_uri
        return
      }

      if (!data.success) {
        errorNotification({
          title: 'SSO test failed',
          description: data.message || 'Failed to initiate SSO test',
        })
        return
      }

      errorNotification({
        title: 'SSO test failed',
        description: 'Failed to initiate SSO test. Please check your configuration.',
      })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'SSO test failed',
        description: errorMessage,
      })
    } finally {
      setIsTestingSSO(false)
    }
  }

  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        setIsSuccess(false)
      }, RESET_SUCCESS_STATE_MS)
      return () => clearTimeout(timer)
    }
  }, [isSuccess])

  useEffect(() => {
    const ssoTested = searchParams?.get('ssotested')
    const error = searchParams?.get('error')

    if (ssoTested === '1') {
      setShowSSOTestedAlert(true)
      setShowReTestWarning(false)
      setPendingEnforceCheck(true)
      router.replace(pathname)
      return
    }

    if (error) {
      const errorMessagesMap = {
        sso_signin_failed: 'SSO sign-in failed',
        sso_callback_failed: 'SSO callback failed',
        sso_callback_error: 'SSO callback error occurred',
      }
      const errorMessage = errorMessagesMap[error as keyof typeof errorMessagesMap]
      if (errorMessage) {
        setShowSSOErrorAlert(true)
        setSSOErrorMessage(errorMessage)
        router.replace(pathname)
      }
    }
  }, [searchParams, router, pathname])

  useEffect(() => {
    if (pendingEnforceCheck && currentSetting !== undefined) {
      if (!currentSetting.identityProviderLoginEnforced) {
        setShowEnforcePromptDialog(true)
      }
      setPendingEnforceCheck(false)
    }
  }, [pendingEnforceCheck, currentSetting])

  return (
    <>
      <Panel>
        <PanelHeader
          heading="SSO Configuration"
          subheading={
            viewMode === 'overview'
              ? "View and manage your organization's Single Sign-On settings"
              : 'Configure Single Sign-On (SSO) for your organization to allow users to authenticate using external identity providers.'
          }
          noBorder
        />

        {showReTestWarning && (
          <StatusAlert tone="warning" message="SSO credentials updated — we recommend re-testing your connection to confirm everything is working." onClose={() => setShowReTestWarning(false)} />
        )}

        {showSSOTestedAlert && <StatusAlert tone="success" message="SSO connection tested and verified successfully!" onClose={() => setShowSSOTestedAlert(false)} />}

        {showSSOErrorAlert && <StatusAlert tone="error" message={`SSO verification failed: ${ssoErrorMessage}`} onClose={() => setShowSSOErrorAlert(false)} />}

        {viewMode === 'overview' ? (
          <SSOOverview
            setting={currentSetting}
            slugName={orgSlugName}
            onEdit={handleEdit}
            onRemove={handleRemoveSSO}
            showRemoveDialog={showRemoveDialog}
            setShowRemoveDialog={setShowRemoveDialog}
            onTestSSO={handleTestSSO}
            isTestingSSO={isTestingSSO}
            onToggleEnforcement={handleToggleEnforcement}
            isTogglingEnforcement={isTogglingEnforcement}
          />
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-1">
              <div className="mb-3">
                <SSOInfoSlideOut />
              </div>
              <FormField
                control={form.control}
                name="identityProvider"
                render={({ field }) => (
                  <FormItem className="flex flex-col space-y-1">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="identityProvider" className="text-sm font-medium w-48 shrink-0">
                        Identity Provider
                      </Label>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full max-w-[280px]">
                            <SelectValue placeholder="Select an identity provider" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {identityProviderOptions.map((provider) => {
                            const logo = SSO_PROVIDER_LOGOS[provider as OrganizationSettingSsoProvider]
                            return (
                              <SelectItem key={provider} value={provider}>
                                <div className="flex items-center gap-2">
                                  {logo ? <Image src={logo} width={16} height={16} alt="" className="object-contain shrink-0" /> : <span className="w-4 shrink-0" />}
                                  {providerLabel(provider)}
                                </div>
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="identityProviderClientID"
                render={({ field }) => (
                  <FormItem className="flex flex-col space-y-1">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="identityProviderClientID" className="text-sm font-medium w-48 shrink-0">
                        Client ID
                      </Label>
                      <FormControl className="flex-1">
                        <Input variant="medium" maxWidth className="max-w-[280px]" {...field} placeholder="Enter client ID" />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="identityProviderClientSecret"
                render={({ field }) => (
                  <FormItem className="flex flex-col space-y-1">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="identityProviderClientSecret" className="text-sm font-medium w-48 shrink-0">
                        Client Secret
                      </Label>
                      <FormControl className="flex-1">
                        <Input variant="medium" maxWidth className="max-w-[280px]" type="password" {...field} placeholder="Enter client secret" />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="oidcDiscoveryEndpoint"
                render={({ field }) => (
                  <FormItem className="flex flex-col space-y-1">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="oidcDiscoveryEndpoint" className="text-sm font-medium w-48 shrink-0">
                        OIDC Discovery Endpoint
                      </Label>
                      <FormControl className="flex-1">
                        <Input variant="medium" maxWidth className="max-w-[280px]" {...field} placeholder="https://your-provider.com/.well-known/openid_configuration" />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-2">
                <CancelButton onClick={handleCancel}></CancelButton>
                <SaveButton variant={isSuccess ? 'success' : 'primary'} title={isPending ? 'Saving Changes' : isSuccess ? 'Saved' : 'Save Changes'} disabled={!form.formState.isDirty || isPending} />
              </div>
            </form>
          </Form>
        )}

        {isSSOConfigured && (
          <div className="border-t mt-4 pt-4 flex flex-col space-y-2">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Exempt Domains</Label>
              <p className="text-sm text-muted-foreground">Users with email addresses matching these domains are exempt from SSO enforcement. Changes are saved immediately.</p>
            </div>
            <DomainListEditor
              domains={exemptDomains}
              newDomain={newExemptDomain}
              onNewDomainChange={(value) => {
                setNewExemptDomain(value)
                if (exemptDomainError) setExemptDomainError(null)
              }}
              onAdd={addExemptDomain}
              onRemove={removeExemptDomain}
              error={exemptDomainError}
              isPending={isSavingDomains}
              addOnEnter
            />
          </div>
        )}
      </Panel>

      <ConfirmationDialog
        open={showEnforcePromptDialog}
        onOpenChange={setShowEnforcePromptDialog}
        title="Enable SSO Enforcement?"
        description="Your SSO connection has been verified. Would you like to enforce SSO login for all members of the organization?"
        confirmationText="Enforce SSO"
        onConfirm={async () => {
          await handleToggleEnforcement(true)
          setShowEnforcePromptDialog(false)
        }}
      />
    </>
  )
}

export { SSOPage }
