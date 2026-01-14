'use client'

import { Panel, PanelHeader } from '@repo/ui/panel'
import { useSearchParams } from 'next/navigation'
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
import { Switch } from '@repo/ui/switch'
import { OrganizationSettingSsoProvider, OrganizationSetting, UpdateOrganizationSettingInput } from '@repo/codegen/src/schema'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { Badge } from '@repo/ui/badge'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { Alert, AlertDescription } from '@repo/ui/alert'
import { X } from 'lucide-react'
import { SaveButton } from '@/components/shared/save-button/save-button'

type viewMode = 'overview' | 'edit'

const SSOOverview = ({
  setting,
  onEdit,
  onRemove,
  showRemoveDialog,
  setShowRemoveDialog,
  getProviderDisplayName,
  onTestSSO,
  isTestingSSO,
}: {
  setting: OrganizationSetting | undefined
  onEdit: () => void
  onRemove: () => void
  showRemoveDialog: boolean
  setShowRemoveDialog: (show: boolean) => void
  getProviderDisplayName: (provider: string) => string
  onTestSSO: () => void
  isTestingSSO: boolean
}) => {
  const isSSOConfigured = setting?.identityProvider && setting.identityProvider !== 'NONE'

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
          {isSSOConfigured && (
            <Button variant="destructive" size="sm" onClick={() => setShowRemoveDialog(true)}>
              Remove SSO
            </Button>
          )}
          <Button variant="secondary" onClick={onEdit}>
            {isSSOConfigured ? 'Edit Configuration' : 'Configure SSO'}
          </Button>
        </div>
      </div>

      {isSSOConfigured && (
        <Card>
          <CardContent className="pt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Provider</span>
                <Badge variant="secondary">{getProviderDisplayName(setting.identityProvider!)}</Badge>
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
                <Badge variant={setting.identityProviderAuthTested ? 'default' : 'secondary'}>{setting.identityProviderAuthTested ? 'Tested' : 'Not tested'}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
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
  const searchParams = useSearchParams()
  const { isPending, mutateAsync: updateOrgSetting } = useUpdateOrganizationSetting()
  const queryClient = useQueryClient()
  const { successNotification, errorNotification } = useNotification()
  const { currentOrgId } = useOrganization()

  const { data: orgSettingData } = useGetOrganizationSetting(currentOrgId || '')
  const currentSetting = orgSettingData?.organization?.setting as OrganizationSetting | undefined

  const identityProviderOptions = useMemo(() => Object.values(OrganizationSettingSsoProvider).filter((provider) => provider !== 'NONE'), [])

  const getProviderDisplayName = (provider: string): string => {
    return provider
      .replace(/_/g, ' ')
      .replace(/([A-Z][a-z]+)/g, ' $1')
      .trim()
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }
  const formSchema = useMemo(
    () =>
      z.object({
        identityProvider: z.enum(identityProviderOptions as [string, ...string[]]).optional(),
        identityProviderClientID: z.string().optional(),
        identityProviderClientSecret: z.string().optional(),
        oidcDiscoveryEndpoint: z.string().optional(),
        identityProviderLoginEnforced: z.boolean().optional(),
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
      identityProviderLoginEnforced: true,
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
        identityProviderLoginEnforced: currentSetting.identityProviderLoginEnforced || false,
      })
    }
  }, [currentSetting, identityProviderOptions, form])

  const updateSSOSettings = async (data: z.infer<typeof formSchema>) => {
    if (!currentOrgId || !currentSetting?.id) {
      return
    }

    const input: Partial<UpdateOrganizationSettingInput> = {
      identityProvider: data.identityProvider as OrganizationSettingSsoProvider | undefined,
      identityProviderClientID: data.identityProviderClientID || undefined,
      identityProviderClientSecret: data.identityProviderClientSecret || undefined,
      oidcDiscoveryEndpoint: data.oidcDiscoveryEndpoint || undefined,
      identityProviderLoginEnforced: data.identityProviderLoginEnforced,
    }

    await updateOrgSetting({
      updateOrganizationSettingId: currentSetting.id,
      input,
    })
    setIsSuccess(true)
    queryClient.invalidateQueries({
      predicate: (query) => {
        const [firstKey] = query.queryKey
        return firstKey === 'organizationSetting'
      },
    })
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
    setViewMode('overview')
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

      queryClient.invalidateQueries({
        predicate: (query) => {
          const [firstKey] = query.queryKey
          return firstKey === 'organizationSetting'
        },
      })
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
      return
    }

    const errorMessagesMap = {
      sso_signin_failed: 'SSO sign-in failed',
      sso_callback_failed: 'SSO callback failed',
      sso_callback_error: 'SSO callback error occurred',
    }

    const errorMessage = errorMessagesMap[error as keyof typeof errorMessagesMap]
    if (!errorMessage) {
      setShowSSOErrorAlert(false)
      return
    }

    setShowSSOErrorAlert(true)
    setSSOErrorMessage(errorMessage)
  }, [searchParams])

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

        {showSSOTestedAlert && (
          <Alert className="mb-4 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">
              <div className="flex items-center justify-between">
                <span className="font-medium">SSO connection tested and verified successfully!</span>
                <Button variant="secondary" size="sm" onClick={() => setShowSSOTestedAlert(false)} className="text-green-600 hover:text-green-800 h-6 w-6 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {showSSOErrorAlert && (
          <Alert className="mb-4 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              <div className="flex items-center justify-between">
                <span className="font-medium">SSO verification failed: {ssoErrorMessage}</span>
                <Button variant="secondary" size="sm" onClick={() => setShowSSOErrorAlert(false)} className="text-red-600 hover:text-red-800 h-6 w-6 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {viewMode === 'overview' ? (
          <SSOOverview
            setting={currentSetting}
            onEdit={handleEdit}
            onRemove={handleRemoveSSO}
            showRemoveDialog={showRemoveDialog}
            setShowRemoveDialog={setShowRemoveDialog}
            getProviderDisplayName={getProviderDisplayName}
            onTestSSO={handleTestSSO}
            isTestingSSO={isTestingSSO}
          />
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
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
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select an identity provider" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {identityProviderOptions.map((provider) => (
                            <SelectItem key={provider} value={provider}>
                              {getProviderDisplayName(provider)}
                            </SelectItem>
                          ))}
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
                        <Input variant="medium" {...field} placeholder="Enter client ID" />
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
                        <Input variant="medium" type="password" {...field} placeholder="Enter client secret" />
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
                        <Input variant="medium" {...field} placeholder="https://your-provider.com/.well-known/openid_configuration" />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="identityProviderLoginEnforced"
                render={({ field }) => (
                  <FormItem className="flex flex-col space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="identityProviderLoginEnforced" className="text-sm font-medium">
                          Enforce SSO
                        </Label>
                        <p className="text-sm text-muted-foreground">Enforce single sign-on for all members of the organization.</p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} disabled={!currentSetting?.identityProviderAuthTested} />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" type="button" onClick={handleCancel}>
                  Cancel
                </Button>
                <SaveButton variant={isSuccess ? 'success' : 'primary'} title={isPending ? 'Saving Changes' : isSuccess ? 'Saved' : 'Save Changes'} />
              </div>
            </form>
          </Form>
        )}
      </Panel>
    </>
  )
}

export { SSOPage }
