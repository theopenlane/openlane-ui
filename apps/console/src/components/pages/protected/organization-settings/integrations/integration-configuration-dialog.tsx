'use client'

import React, { useEffect, useMemo } from 'react'
import { FormProvider } from 'react-hook-form'
import { Button } from '@repo/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { useQueryClient } from '@tanstack/react-query'
import { useNotification } from '@/hooks/useNotification'
import { getProviderHelperContent } from '@/lib/integrations/provider-helper-content'
import { type IntegrationProvider } from '@/lib/integrations/types'
import { resolveConnectionEntry, resolveCredentialEntry, resolveSchemaRoot } from '@/lib/integrations/utils'
import { connectViaAuth, saveIntegrationConfiguration } from '@/lib/integrations/flow'
import { IntegrationSchemaSections, normalizeIntegrationFormPayloads, useIntegrationSchemaForm } from './schema-form'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  provider?: IntegrationProvider
  installationId?: string
  credentialRef?: string
  existingUserInput?: Record<string, unknown>
  onAuthFlowStarted?: (provider: IntegrationProvider) => void
}

const IntegrationConfigurationDialog = ({ open, onOpenChange, provider, installationId, credentialRef, existingUserInput, onAuthFlowStarted }: Props) => {
  const { successNotification, errorNotification } = useNotification()
  const queryClient = useQueryClient()
  const isExistingInstallation = Boolean(installationId)

  const activeCredentialEntry = useMemo(() => resolveCredentialEntry(provider, credentialRef), [provider, credentialRef])

  const activeCredentialRef = credentialRef ?? activeCredentialEntry?.ref
  const providerHelper = getProviderHelperContent(provider)

  const credentialSchema = useMemo(() => resolveSchemaRoot(activeCredentialEntry?.schema), [activeCredentialEntry?.schema])
  const userInputSchema = useMemo(() => resolveSchemaRoot(provider?.userInputSchema), [provider?.userInputSchema])
  const userInputSectionMeta = useMemo(
    () => ({
      title: 'Installation Settings',
      description: isExistingInstallation
        ? 'These settings control installation-specific behavior defined by the integration'
        : 'Only settings required to complete the initial connection are shown here.',
    }),
    [isExistingInstallation],
  )
  const { formMethods, initialValues, sections } = useIntegrationSchemaForm({
    credentialSchema,
    userInputSchema,
    userInputSectionMeta,
    existingUserInput,
  })

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = formMethods

  useEffect(() => {
    if (!open) {
      return
    }

    reset(initialValues)
  }, [initialValues, open, reset])

  const onSubmit = async (formValues: Record<string, unknown>) => {
    if (!provider) {
      return
    }

    const { credentialPayload, hasCredentialPayload, hasUserInputPayload, missingRequired, userInputPayload } = normalizeIntegrationFormPayloads(credentialSchema, userInputSchema, formValues)

    if (missingRequired.length > 0) {
      errorNotification({
        title: `Missing required fields for ${provider.displayName}`,
        description: missingRequired.join(', '),
      })
      return
    }

    try {
      if (isExistingInstallation && !hasCredentialPayload && !hasUserInputPayload) {
        onOpenChange(false)
        return
      }

      const connectionHasAuth = resolveConnectionEntry(provider, activeCredentialRef)?.auth != null

      if (connectionHasAuth && !hasCredentialPayload && !isExistingInstallation) {
        await connectViaAuth(provider, {
          credentialRef: activeCredentialRef,
          installationId,
          userInput: userInputPayload.payload,
          onRedirect: () => onAuthFlowStarted?.(provider),
        })

        successNotification({
          title: `Continue connecting ${provider.displayName}`,
          description: `Redirecting to ${provider.displayName} to finish setup.`,
        })

        onOpenChange(false)
        return
      }

      await saveIntegrationConfiguration({
        definitionId: provider.id,
        installationId,
        credentialRef: activeCredentialRef,
        body: credentialPayload.payload,
        userInput: userInputPayload.payload,
      })

      queryClient.invalidateQueries({ queryKey: ['integrations'] })

      successNotification({
        title: isExistingInstallation ? `${provider.displayName} updated` : `${provider.displayName} configured`,
        description: isExistingInstallation ? 'Integration settings were updated successfully.' : 'Integration credentials were saved successfully.',
      })

      onOpenChange(false)
    } catch (error) {
      errorNotification({
        title: `Failed to ${isExistingInstallation ? 'update' : 'configure'} ${provider.displayName}`,
        description: error instanceof Error ? error.message : 'Unexpected error while saving integration settings.',
      })
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-[520px] flex-col p-0 sm:w-[620px]">
        <SheetHeader className="border-b px-6 py-5">
          <SheetTitle>{isExistingInstallation ? `Update ${provider?.displayName ?? 'Integration'}` : `Configure ${provider?.displayName ?? 'Integration'}`}</SheetTitle>
          <SheetDescription>
            {isExistingInstallation
              ? 'Update the credentials and installation settings for this integration - these values will overwrite the existing once we have confirmed them.'
              : 'Provide the credentials and any required settings needed to connect this integration.'}
          </SheetDescription>
        </SheetHeader>

        <FormProvider {...formMethods}>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
              {providerHelper}
              {sections.length === 0 ? <p className="text-sm text-muted-foreground">No additional input is required for this integration.</p> : null}
              <IntegrationSchemaSections sections={sections} />
            </div>

            <SheetFooter className="border-t px-6 py-4 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !provider}>
                {isSubmitting ? 'Saving...' : isExistingInstallation ? 'Save Changes' : 'Save Configuration'}
              </Button>
            </SheetFooter>
          </form>
        </FormProvider>
      </SheetContent>
    </Sheet>
  )
}

export default IntegrationConfigurationDialog
