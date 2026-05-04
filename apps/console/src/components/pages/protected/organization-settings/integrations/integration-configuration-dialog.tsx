'use client'

import React, { useEffect, useMemo } from 'react'
import { FormProvider } from 'react-hook-form'
import { Button } from '@repo/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { useQueryClient } from '@tanstack/react-query'
import { useNotification } from '@/hooks/useNotification'
import { getProviderHelperContent } from '@/lib/integrations/provider-helper-content'
import { type IntegrationProvider, type IntegrationSchemaNode } from '@/lib/integrations/types'
import { disabledOperationConfigKeys, resolveConnectionEntry, resolveCredentialEntry, resolveSchemaRoot } from '@/lib/integrations/utils'
import { connectViaAuth, saveIntegrationConfiguration } from '@/lib/integrations/flow'
import { IntegrationSchemaSections, normalizeIntegrationFormPayloads, useIntegrationSchemaForm } from './schema-form'
import { Callout } from '@/components/shared/callout/callout'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  provider?: IntegrationProvider
  installationId?: string
  credentialRef?: string
  config?: Record<string, unknown>
  credentials?: Record<string, unknown>
  onAuthFlowStarted?: (provider: IntegrationProvider) => void
}

const IntegrationConfigurationDialog = ({ open, onOpenChange, provider, installationId, credentialRef, config, credentials, onAuthFlowStarted }: Props) => {
  const { successNotification, errorNotification } = useNotification()
  const queryClient = useQueryClient()
  const isExistingInstallation = Boolean(installationId)

  const activeCredentialEntry = useMemo(() => resolveCredentialEntry(provider, credentialRef), [provider, credentialRef])
  const activeCredentialRef = credentialRef ?? activeCredentialEntry?.ref
  const providerHelper = getProviderHelperContent(provider)
  const disabledConfigKeys = useMemo(() => disabledOperationConfigKeys(provider), [provider])

  const credentialSchema = useMemo(
    () => resolveSchemaRoot((isExistingInstallation && credentials ? credentials : activeCredentialEntry?.schema) as IntegrationSchemaNode | undefined),
    [isExistingInstallation, credentials, activeCredentialEntry?.schema],
  )
  const userInputSchema = useMemo(
    () => resolveSchemaRoot((isExistingInstallation && config ? config : provider?.userInputSchema) as IntegrationSchemaNode | undefined),
    [isExistingInstallation, config, provider?.userInputSchema],
  )
  const userInputSectionMeta = useMemo(
    () => ({
      title: 'Installation Settings',
      description: isExistingInstallation
        ? 'These settings control installation-specific behavior defined by the integration'
        : 'Only settings required to complete the initial connection are shown here.',
    }),
    [isExistingInstallation],
  )

  // Combined form — used for new installations where creds and settings are submitted together
  const combined = useIntegrationSchemaForm({ credentialSchema, userInputSchema, userInputSectionMeta })

  // Separate forms — used for existing installation tabs so each section validates independently
  const credForm = useIntegrationSchemaForm({ credentialSchema })
  const settingsForm = useIntegrationSchemaForm({ userInputSchema, userInputSectionMeta })

  const { reset: resetCombined } = combined.formMethods
  const { reset: resetCred } = credForm.formMethods
  const { reset: resetSettings } = settingsForm.formMethods

  useEffect(() => {
    if (!open) return
    resetCombined(combined.initialValues)
  }, [combined.initialValues, open, resetCombined])

  useEffect(() => {
    if (!open) return
    resetCred(credForm.initialValues)
  }, [credForm.initialValues, open, resetCred])

  useEffect(() => {
    if (!open) return
    resetSettings(settingsForm.initialValues)
  }, [settingsForm.initialValues, open, resetSettings])

  // New installation: submit credentials + settings together
  const onSubmit = async (formValues: Record<string, unknown>) => {
    if (!provider) return

    const { credentialPayload, hasCredentialPayload, hasUserInputPayload, missingRequired, userInputPayload } = normalizeIntegrationFormPayloads(credentialSchema, userInputSchema, formValues)

    if (missingRequired.length > 0) {
      errorNotification({ title: `Missing required fields for ${provider.displayName}`, description: missingRequired.join(', ') })
      return
    }

    try {
      const connectionHasAuth = resolveConnectionEntry(provider, activeCredentialRef)?.auth != null

      if (!isExistingInstallation && connectionHasAuth && !hasCredentialPayload) {
        await connectViaAuth(provider, {
          credentialRef: activeCredentialRef,
          installationId,
          userInput: userInputPayload.payload,
          onRedirect: () => onAuthFlowStarted?.(provider),
        })
        successNotification({ title: `Continue connecting ${provider.displayName}`, description: `Redirecting to ${provider.displayName} to finish setup.` })
        onOpenChange(false)
        return
      }

      if (!hasCredentialPayload && !hasUserInputPayload) {
        onOpenChange(false)
        return
      }

      await saveIntegrationConfiguration({ definitionId: provider.id, installationId, credentialRef: activeCredentialRef, body: credentialPayload.payload, userInput: userInputPayload.payload })
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
      successNotification({ title: `${provider.displayName} configured`, description: 'Integration credentials were saved successfully.' })
      onOpenChange(false)
    } catch (error) {
      errorNotification({ title: `Failed to configure ${provider.displayName}`, description: error instanceof Error ? error.message : 'Unexpected error while saving.' })
    }
  }

  // Existing installation: save credentials only
  const onSubmitCredentials = async (formValues: Record<string, unknown>) => {
    if (!provider) return

    const { credentialPayload, hasCredentialPayload, missingRequired } = normalizeIntegrationFormPayloads(credentialSchema, undefined, formValues)

    if (!hasCredentialPayload) {
      onOpenChange(false)
      return
    }

    if (missingRequired.length > 0) {
      errorNotification({ title: `Missing required credential fields for ${provider.displayName}`, description: missingRequired.join(', ') })
      return
    }

    try {
      await saveIntegrationConfiguration({ definitionId: provider.id, installationId, credentialRef: activeCredentialRef, body: credentialPayload.payload, userInput: {} })
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
      successNotification({ title: `${provider.displayName} credentials updated`, description: 'Credentials were updated successfully.' })
      onOpenChange(false)
    } catch (error) {
      errorNotification({ title: `Failed to update credentials for ${provider.displayName}`, description: error instanceof Error ? error.message : 'Unexpected error while saving credentials.' })
    }
  }

  // Existing installation: save settings only
  const onSubmitSettings = async (formValues: Record<string, unknown>) => {
    if (!provider) return

    const { hasUserInputPayload, missingRequired, userInputPayload } = normalizeIntegrationFormPayloads(undefined, userInputSchema, formValues)

    if (!hasUserInputPayload) {
      onOpenChange(false)
      return
    }

    if (missingRequired.length > 0) {
      errorNotification({ title: `Missing required settings for ${provider.displayName}`, description: missingRequired.join(', ') })
      return
    }

    try {
      await saveIntegrationConfiguration({ definitionId: provider.id, installationId, credentialRef: activeCredentialRef, body: {}, userInput: userInputPayload.payload })
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
      successNotification({ title: `${provider.displayName} settings updated`, description: 'Settings were updated successfully.' })
      onOpenChange(false)
    } catch (error) {
      errorNotification({ title: `Failed to update settings for ${provider.displayName}`, description: error instanceof Error ? error.message : 'Unexpected error while saving settings.' })
    }
  }

  const showTabs = isExistingInstallation && credForm.sections.length > 0 && settingsForm.sections.length > 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-[520px] flex-col p-0 sm:w-[620px]">
        <SheetHeader className="border-b px-6 py-5">
          <SheetTitle>{isExistingInstallation ? `Update ${provider?.displayName ?? 'Integration'}` : `Configure ${provider?.displayName ?? 'Integration'}`}</SheetTitle>
          <SheetDescription>
            {isExistingInstallation
              ? credForm.sections.length > 0
                ? 'Update the credentials and installation settings for this integration.'
                : 'Update the installation settings for this integration.'
              : 'Provide the credentials and any required settings needed to connect this integration.'}
          </SheetDescription>
        </SheetHeader>

        {showTabs ? (
          <Tabs defaultValue="credentials" variant="solid" className="flex flex-1 flex-col overflow-hidden">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="credentials">Credentials</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="credentials" className="flex flex-1 flex-col overflow-hidden mt-[10px]">
              <FormProvider {...credForm.formMethods}>
                <form onSubmit={credForm.formMethods.handleSubmit(onSubmitCredentials)} className="flex flex-1 flex-col overflow-hidden">
                  <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
                    {providerHelper}
                    <Callout variant="warning" title="Updating Credentials" className="mb-[30px]">
                      We only load non-sensitive values. When saving, the entire form is validated—so you'll need to re-enter any required values that aren’t pre-filled (like secrets).
                    </Callout>
                    <IntegrationSchemaSections sections={credForm.sections} hideDescriptions hideFieldKeys={disabledConfigKeys} />
                  </div>
                  <SheetFooter className="shrink-0 border-t px-6 py-4 sm:flex-row sm:justify-end">
                    <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={credForm.formMethods.formState.isSubmitting}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={credForm.formMethods.formState.isSubmitting || !provider}>
                      {credForm.formMethods.formState.isSubmitting ? 'Saving...' : 'Save Credentials'}
                    </Button>
                  </SheetFooter>
                </form>
              </FormProvider>
            </TabsContent>

            <TabsContent value="settings" className="flex flex-1 flex-col overflow-hidden">
              <FormProvider {...settingsForm.formMethods}>
                <form onSubmit={settingsForm.formMethods.handleSubmit(onSubmitSettings)} className="flex flex-1 flex-col overflow-hidden">
                  <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
                    <IntegrationSchemaSections sections={settingsForm.sections} hideDescriptions hideFieldKeys={disabledConfigKeys} />
                  </div>
                  <SheetFooter className="shrink-0 border-t px-6 py-4 sm:flex-row sm:justify-end">
                    <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={settingsForm.formMethods.formState.isSubmitting}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={settingsForm.formMethods.formState.isSubmitting || !provider}>
                      {settingsForm.formMethods.formState.isSubmitting ? 'Saving...' : 'Save Settings'}
                    </Button>
                  </SheetFooter>
                </form>
              </FormProvider>
            </TabsContent>
          </Tabs>
        ) : (
          <FormProvider {...combined.formMethods}>
            <form onSubmit={combined.formMethods.handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
                {providerHelper}
                {combined.sections.length === 0 ? <p className="text-sm text-muted-foreground">No additional input is required for this integration.</p> : null}
                <IntegrationSchemaSections sections={combined.sections} hideFieldKeys={disabledConfigKeys} />
              </div>
              <SheetFooter className="shrink-0 border-t px-6 py-4 sm:flex-row sm:justify-end">
                <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={combined.formMethods.formState.isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={combined.formMethods.formState.isSubmitting || !provider}>
                  {combined.formMethods.formState.isSubmitting ? 'Saving...' : 'Save Configuration'}
                </Button>
              </SheetFooter>
            </form>
          </FormProvider>
        )}
      </SheetContent>
    </Sheet>
  )
}

export default IntegrationConfigurationDialog
